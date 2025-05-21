import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Шапка */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">Timeline Studio</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#features" className="text-gray-600 hover:text-gray-900">Возможности</a></li>
              <li><a href="#download" className="text-gray-600 hover:text-gray-900">Скачать</a></li>
              <li><a href="https://chatman-media.github.io/timeline-studio/api-docs/" className="text-gray-600 hover:text-gray-900">Документация</a></li>
              <li><a href="https://github.com/chatman-media/timeline-studio" className="text-gray-600 hover:text-gray-900">GitHub</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Главный баннер */}
      <section className="hero-gradient text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Создавайте потрясающие видео</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Timeline Studio - мощное приложение для создания и редактирования видео,
            построенное на базе Tauri, React и XState.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#download" className="bg-white text-gray-800 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300">
              Скачать бесплатно
            </a>
            <a href="https://github.com/chatman-media/timeline-studio" className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-300">
              Исходный код
            </a>
          </div>
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Ключевые возможности</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="Кроссплатформенность"
              description="Работает на Windows, macOS и Linux благодаря Tauri"
              icon="🖥️"
            />
            <FeatureCard
              title="Редактирование видео"
              description="Создание и редактирование видеопроектов с различными соотношениями сторон"
              icon="🎬"
            />
            <FeatureCard
              title="Управление состоянием"
              description="Надежное управление состоянием с помощью XState"
              icon="🧠"
            />
            <FeatureCard
              title="Интернационализация"
              description="Полная поддержка многоязычности (i18n)"
              icon="🌐"
            />
            <FeatureCard
              title="Тестирование"
              description="Полное тестовое покрытие с использованием Vitest"
              icon="🧪"
            />
            <FeatureCard
              title="Современный UI"
              description="Стильный интерфейс с использованием Tailwind CSS"
              icon="🎨"
            />
          </div>
        </div>
      </section>

      {/* Скачать */}
      <section id="download" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Скачать Timeline Studio</h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            Доступно для всех основных операционных систем. Выберите вашу платформу:
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <DownloadButton platform="Windows" icon="windows" />
            <DownloadButton platform="macOS" icon="apple" />
            <DownloadButton platform="Linux" icon="linux" />
          </div>
          <p className="mt-8 text-gray-600">
            Или посетите <a href="https://github.com/chatman-media/timeline-studio/releases" className="text-blue-600 hover:underline">страницу релизов</a> для загрузки других версий.
          </p>
        </div>
      </section>

      {/* Документация */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Документация</h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            Подробная документация поможет вам начать работу с Timeline Studio:
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a href="https://chatman-media.github.io/timeline-studio/api-docs/" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg transition duration-300">
              API документация
            </a>
            <a href="https://github.com/chatman-media/timeline-studio#начало-работы" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg transition duration-300">
              Руководство пользователя
            </a>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold">Timeline Studio</h2>
              <p className="text-gray-400 mt-2">Приложение для создания и редактирования видео</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Ресурсы</h3>
                <ul className="space-y-2">
                  <li><a href="https://github.com/chatman-media/timeline-studio" className="text-gray-400 hover:text-white">GitHub</a></li>
                  <li><a href="https://www.npmjs.com/package/timeline-studio" className="text-gray-400 hover:text-white">npm</a></li>
                  <li><a href="https://chatman-media.github.io/timeline-studio/api-docs/" className="text-gray-400 hover:text-white">Документация</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Связаться</h3>
                <ul className="space-y-2">
                  <li><a href="https://github.com/chatman-media/timeline-studio/issues" className="text-gray-400 hover:text-white">Сообщить о проблеме</a></li>
                  <li><a href="mailto:ak.chatman.media@gmail.com" className="text-gray-400 hover:text-white">Электронная почта</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Timeline Studio. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Компонент карточки возможностей
const FeatureCard: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-300">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

// Компонент кнопки загрузки
const DownloadButton: React.FC<{ platform: string; icon: string }> = ({ platform, icon }) => {
  return (
    <a
      href={`https://github.com/chatman-media/timeline-studio/releases/latest/download/timeline-studio-${platform.toLowerCase()}.zip`}
      className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg shadow-md transition duration-300 flex items-center justify-center"
    >
      <span className="mr-2">{platform}</span>
      <span className="text-sm">{icon}</span>
    </a>
  );
};

export default App;
