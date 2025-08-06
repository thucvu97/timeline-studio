#!/bin/bash

# Timeline Studio Alpha Release Launcher
# Version: 0.60.0-alpha
# Date: 2025-08-03

set -e

echo "🚀 Timeline Studio Alpha Release Launcher"
echo "========================================="
echo ""

# Проверка Ollama
check_ollama() {
    echo "🔍 Проверка Ollama..."
    if command -v ollama &> /dev/null; then
        echo "✅ Ollama установлена"
        
        # Проверка запущен ли сервер
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo "✅ Ollama сервер запущен"
        else
            echo "🚀 Запуск Ollama сервера..."
            ollama serve > /dev/null 2>&1 &
            sleep 3
        fi
        
        # Проверка установленных моделей
        echo ""
        echo "📦 Установленные модели:"
        ollama list 2>/dev/null || echo "Нет установленных моделей"
        
        # Проверка рекомендуемой модели
        if ! ollama list 2>/dev/null | grep -q "llama3.2"; then
            echo ""
            echo "⚠️  Рекомендуемая модель llama3.2 не установлена"
            echo "Установить? (y/n)"
            read -r response
            if [[ "$response" == "y" ]]; then
                echo "📥 Загрузка llama3.2 (2GB)..."
                ollama pull llama3.2
            fi
        fi
    else
        echo "❌ Ollama не установлена!"
        echo ""
        echo "Установите Ollama для работы AI функций:"
        echo ""
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  brew install ollama"
        else
            echo "  curl -fsSL https://ollama.ai/install.sh | sh"
        fi
        echo ""
        echo "Продолжить без AI? (y/n)"
        read -r response
        if [[ "$response" != "y" ]]; then
            exit 1
        fi
    fi
}

# Проверка зависимостей
check_dependencies() {
    echo ""
    echo "🔍 Проверка зависимостей..."
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo "✅ Node.js: $NODE_VERSION"
    else
        echo "❌ Node.js не установлен"
        exit 1
    fi
    
    # Bun
    if command -v bun &> /dev/null; then
        BUN_VERSION=$(bun -v)
        echo "✅ Bun: $BUN_VERSION"
    else
        echo "❌ Bun не установлен"
        echo "Установите: curl -fsSL https://bun.sh/install | bash"
        exit 1
    fi
    
    # Rust
    if command -v rustc &> /dev/null; then
        RUST_VERSION=$(rustc --version | cut -d' ' -f2)
        echo "✅ Rust: $RUST_VERSION"
    else
        echo "❌ Rust не установлен"
        echo "Установите: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        exit 1
    fi
    
    # FFmpeg
    if command -v ffmpeg &> /dev/null; then
        echo "✅ FFmpeg установлен"
    else
        echo "⚠️  FFmpeg не установлен (опционально)"
    fi
}

# Установка зависимостей если нужно
install_deps() {
    if [ ! -d "node_modules" ]; then
        echo ""
        echo "📦 Установка зависимостей..."
        bun install
    fi
}

# Настройка окружения
setup_env() {
    echo ""
    echo "⚙️  Настройка окружения..."
    
    # Создание .env.local если не существует
    if [ ! -f ".env.local" ]; then
        echo "📝 Создание .env.local..."
        cat > .env.local << EOF
# Timeline Studio Alpha Configuration
# Generated: $(date)

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2

# FFmpeg Configuration (macOS)
FFMPEG_DIR=/opt/homebrew/opt/ffmpeg
PKG_CONFIG_PATH=/opt/homebrew/opt/ffmpeg/lib/pkgconfig

# ONNX Runtime (optional)
ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib

# Development
NODE_ENV=development
EOF
        echo "✅ .env.local создан"
    fi
    
    # Загрузка переменных окружения для macOS
    if [[ "$OSTYPE" == "darwin"* ]] && [ -f ".env.macos" ]; then
        source .env.macos
        echo "✅ Переменные окружения загружены"
    fi
}

# Выбор режима запуска
select_mode() {
    echo ""
    echo "🎯 Выберите режим запуска:"
    echo ""
    echo "1) Development (разработка с hot-reload)"
    echo "2) Build (сборка приложения)"
    echo "3) Preview (предпросмотр сборки)"
    echo "4) Test (запуск тестов)"
    echo ""
    echo -n "Выбор (1-4): "
    read -r choice
    
    case $choice in
        1)
            echo ""
            echo "🚀 Запуск в режиме разработки..."
            echo "================================"
            echo ""
            echo "Приложение будет доступно по адресу:"
            echo "  http://localhost:3000 (Next.js)"
            echo "  http://localhost:1420 (Tauri)"
            echo ""
            echo "AI сервер Ollama:"
            echo "  http://localhost:11434"
            echo ""
            echo "Нажмите Ctrl+C для остановки"
            echo ""
            bun run tauri dev
            ;;
        2)
            echo ""
            echo "📦 Сборка приложения..."
            bun run tauri build
            echo ""
            echo "✅ Сборка завершена!"
            echo "Приложение: src-tauri/target/release/timeline-studio"
            ;;
        3)
            echo ""
            echo "👁️ Предпросмотр сборки..."
            bun run build
            bun run preview
            ;;
        4)
            echo ""
            echo "🧪 Запуск тестов..."
            bun run test
            ;;
        *)
            echo "❌ Неверный выбор"
            exit 1
            ;;
    esac
}

# Показать информацию об альфа-релизе
show_alpha_info() {
    echo ""
    echo "📋 Timeline Studio Alpha v0.60.0"
    echo "================================="
    echo ""
    echo "🎯 Основные функции:"
    echo "  • AI анализ видео (Ollama)"
    echo "  • Детекция сцен"
    echo "  • Генерация субтитров"
    echo "  • Экспорт в JSON"
    echo ""
    echo "⚠️  Известные проблемы:"
    echo "  • ~2000 TypeScript ошибок (не влияют на работу)"
    echo "  • Первый запрос к AI медленный"
    echo "  • Базовая обработка ошибок"
    echo ""
    echo "📚 Документация: docs/08_tasks/ru/07_milestones/alpha_release.md"
    echo ""
}

# Основной процесс
main() {
    clear
    show_alpha_info
    check_ollama
    check_dependencies
    install_deps
    setup_env
    select_mode
}

# Запуск
main