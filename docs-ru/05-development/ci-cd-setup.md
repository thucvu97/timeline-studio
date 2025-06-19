# Настройка CI/CD для Timeline Studio

Данный документ предоставляет инструкции по настройке непрерывной интеграции и развертывания для Timeline Studio.

## Настройка CI/CD для Windows

### Конфигурация GitHub Actions

Для сборки под Windows в GitHub Actions добавьте следующие шаги настройки перед сборкой:

```yaml
- name: Установка FFmpeg и зависимостей (Windows)
  if: runner.os == 'Windows'
  run: |
    # Установка vcpkg
    git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
    C:\vcpkg\bootstrap-vcpkg.bat
    C:\vcpkg\vcpkg.exe integrate install
    
    # Установка FFmpeg
    C:\vcpkg\vcpkg.exe install ffmpeg:x64-windows
    
    # Установка pkg-config
    choco install pkgconfiglite
    
    # Установка переменных окружения
    echo "VCPKG_ROOT=C:\vcpkg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append

- name: Сборка Tauri приложения
  env:
    VCPKG_ROOT: C:\vcpkg
  run: |
    bun run tauri build
```

### Альтернатива: Предсобранные зависимости

Если установка vcpkg слишком медленная, можно использовать предсобранный FFmpeg:

```yaml
- name: Настройка FFmpeg (Windows - быстро)
  if: runner.os == 'Windows'
  run: |
    # Загрузка предсобранного FFmpeg
    Invoke-WebRequest -Uri "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl-shared.zip" -OutFile "ffmpeg.zip"
    Expand-Archive -Path "ffmpeg.zip" -DestinationPath "C:\"
    Rename-Item "C:\ffmpeg-master-latest-win64-gpl-shared" "C:\ffmpeg"
    
    # Загрузка pkg-config
    Invoke-WebRequest -Uri "https://download.gnome.org/binaries/win64/dependencies/pkg-config_0.26-1_win64.zip" -OutFile "pkg-config.zip"
    Expand-Archive -Path "pkg-config.zip" -DestinationPath "C:\pkg-config"
    
    # Установка переменных окружения
    echo "FFMPEG_DIR=C:\ffmpeg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
    echo "PKG_CONFIG_PATH=C:\ffmpeg\lib\pkgconfig" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
    echo "C:\ffmpeg\bin" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append
    echo "C:\pkg-config\bin" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append
```

## Настройка CI/CD для macOS

```yaml
- name: Установка FFmpeg (macOS)
  if: runner.os == 'macOS'
  run: |
    brew install ffmpeg pkg-config
```

## Настройка CI/CD для Linux

```yaml
- name: Установка FFmpeg (Linux)
  if: runner.os == 'Linux'
  run: |
    sudo apt-get update
    sudo apt-get install -y ffmpeg libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libswscale-dev libswresample-dev pkg-config
```

## Полный пример GitHub Actions Workflow

```yaml
name: Сборка и тестирование

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
    - uses: actions/checkout@v4

    - name: Настройка Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Настройка Bun
      uses: oven-sh/setup-bun@v1

    - name: Настройка Rust
      uses: dtolnay/rust-toolchain@stable

    - name: Установка FFmpeg (Linux)
      if: runner.os == 'Linux'
      run: |
        sudo apt-get update
        sudo apt-get install -y ffmpeg libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libswscale-dev libswresample-dev pkg-config

    - name: Установка FFmpeg (macOS)
      if: runner.os == 'macOS'
      run: |
        brew install ffmpeg pkg-config

    - name: Установка FFmpeg (Windows)
      if: runner.os == 'Windows'
      run: |
        # Использование vcpkg для надежной сборки
        git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
        C:\vcpkg\bootstrap-vcpkg.bat
        C:\vcpkg\vcpkg.exe integrate install
        C:\vcpkg\vcpkg.exe install ffmpeg:x64-windows
        choco install pkgconfiglite
        echo "VCPKG_ROOT=C:\vcpkg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append

    - name: Установка зависимостей
      run: bun install

    - name: Запуск тестов
      run: bun run test

    - name: Сборка приложения
      env:
        VCPKG_ROOT: ${{ runner.os == 'Windows' && 'C:\vcpkg' || '' }}
      run: bun run tauri build
```

## Альтернатива с Docker

Для более консистентных сборок рассмотрите использование Docker:

```dockerfile
# Windows Server Core с FFmpeg
FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Установка зависимостей
RUN powershell -Command \
    Set-ExecutionPolicy Bypass -Scope Process -Force; \
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; \
    iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

RUN choco install -y nodejs rust ffmpeg pkgconfiglite

# Установка рабочей директории
WORKDIR C:\timeline-studio

# Копирование исходного кода
COPY . .

# Сборка
RUN bun install && bun run tauri build
```

## Устранение проблем CI

### 1. "ffmpeg-sys-next build failed"
- Убедитесь, что vcpkg правильно интегрирован
- Проверьте, что переменные окружения установлены корректно
- Убедитесь, что pkg-config в PATH

### 2. "Could not find Vcpkg tree"
- Установите переменную окружения VCPKG_ROOT
- Выполните vcpkg integrate install
- Перезапустите сборку

### 3. "pkg-config command could not be found"
- Установите pkgconfiglite на Windows
- Добавьте pkg-config в PATH
- Установите PKG_CONFIG_PATH для библиотек FFmpeg

### 4. Таймаут сборки
- Рассмотрите использование предсобранного FFmpeg вместо vcpkg
- Кешируйте установку vcpkg между сборками
- Используйте matrix стратегию для параллельных сборок