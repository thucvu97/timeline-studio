import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { useBrowserState } from "@/components/common/browser-state-provider";
import { AddMediaButton } from "@/features/browser/components/layout/add-media-button";
import { FavoriteButton } from "@/features/browser/components/layout/favorite-button";
import { useResources } from "@/features/resources";
import { MediaFile } from "@/types/media";
import { TransitionResource } from "@/types/resources";
import { Transition } from "@/types/transitions";

import { useTransitions } from "../hooks/use-transitions";

/**
 * Интерфейс пропсов для компонента TransitionPreview
 */
interface TransitionPreviewProps {
  transition?: Transition;
  sourceVideo: MediaFile;
  targetVideo: MediaFile;
  transitionType: string;
  onClick: () => void;
  size: number;
  previewWidth?: number;
  previewHeight?: number;
}

/**
 * Компонент для отображения превью перехода между видео
 * Показывает анимированный переход между двумя видео и позволяет добавить переход в проект
 */
export function TransitionPreview({
  transition,
  sourceVideo,
  targetVideo,
  transitionType,
  onClick,
  size,
  previewWidth,
  previewHeight,
}: TransitionPreviewProps) {
  const { t } = useTranslation(); // Хук для интернационализации
  const {
    addTransition,
    isTransitionAdded,
    removeResource,
    transitionResources,
  } = useResources(); // Получаем методы для работы с ресурсами

  const [isHovering, setIsHovering] = useState(false); // Состояние наведения мыши
  const [isError, setIsError] = useState(false); // Состояние ошибки загрузки видео

  // Ссылки на элементы видео и таймеры
  const sourceVideoRef = useRef<HTMLVideoElement>(null); // Ссылка на исходное видео
  const targetVideoRef = useRef<HTMLVideoElement>(null); // Ссылка на целевое видео
  const transitionTimeoutRef = useRef<NodeJS.Timeout>(null); // Таймер для запуска перехода
  const loopTimeoutRef = useRef<NodeJS.Timeout>(null); // Таймер для зацикливания демонстрации

  // Получаем переходы из хука
  const { transitions } = useTransitions();

  // Получаем переход из пропсов или находим по типу
  const currentTransition = transition || transitions.find(
    (t: Transition) => t.id === transitionType || t.type === transitionType,
  );

  // Создаем объект перехода для совместимости с ресурсами
  const transitionObj = currentTransition ? {
    id: currentTransition.id,
    type: currentTransition.type,
    name: currentTransition.labels.ru,
    duration: currentTransition.duration.default,
    ffmpegCommand: currentTransition.ffmpegCommand,
    params: currentTransition.parameters || {},
    previewPath: currentTransition.previewPath || "",
  } : {
    id: transitionType,
    type: transitionType,
    name: transitionType,
    duration: 1.5,
    ffmpegCommand: () => "",
    params: {},
    previewPath: "",
  };

  // Вычисляем размеры превью
  const actualWidth = previewWidth || size;
  const actualHeight = previewHeight || size;

  // Мемоизируем объекты для кнопок
  const favoriteFile = useMemo(() => ({
    id: transitionObj.id,
    path: "",
    name: transitionObj.name,
  }), [transitionObj.id, transitionObj.name]);

  const addMediaFile = useMemo(() => ({
    id: transitionType,
    path: "",
    name: transitionType
  }), [transitionType]);

  // Мемоизируем обработчики событий
  const handleAddMedia = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    addTransition(transitionObj);
  }, [addTransition, transitionObj]);

  const handleRemoveMedia = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const resource = transitionResources.find(
      (res: TransitionResource) =>
        res.resourceId === transitionObj.id ||
        res.resourceId === transitionObj.type,
    );
    if (resource) {
      removeResource(resource.id);
    } else {
      console.warn(
        `Не удалось найти ресурс перехода с ID ${transitionObj.id} для удаления`,
      );
    }
  }, [removeResource, transitionResources, transitionObj.id, transitionObj.type]);

  // Функция для получения индикатора сложности
  const getComplexityIndicator = (complexity: string) => {
    switch (complexity) {
      case "basic":
        return { color: "bg-green-500", label: "BSC" };
      case "intermediate":
        return { color: "bg-yellow-500", label: "INT" };
      case "advanced":
        return { color: "bg-red-500", label: "ADV" };
      default:
        return { color: "bg-gray-500", label: "UNK" };
    }
  };

  // Функция для получения индикатора категории
  const getCategoryIndicator = (category: string) => {
    switch (category) {
      case "basic":
        return "BSC";
      case "advanced":
        return "ADV";
      case "creative":
        return "CRE";
      case "3d":
        return "3D";
      case "artistic":
        return "ART";
      case "cinematic":
        return "CIN";
      default:
        return "UNK";
    }
  };

  const complexityIndicator = useMemo(() =>
    getComplexityIndicator(currentTransition?.complexity || "basic"),
    [currentTransition?.complexity]
  );
  const categoryIndicator = useMemo(() =>
    getCategoryIndicator(currentTransition?.category || "basic"),
    [currentTransition?.category]
  );

  // Получаем активную вкладку для оптимизации
  const { activeTab } = useBrowserState();

  // Проверяем, добавлен ли переход уже в хранилище ресурсов
  // Мемоизируем результат и проверяем только если вкладка активна
  const isAdded = useMemo(() => {
    // Проверяем только если текущая вкладка - transitions
    if (activeTab !== "transitions") {
      return false; // Возвращаем false для неактивных вкладок
    }
    return isTransitionAdded(transitionObj);
  }, [activeTab, isTransitionAdded, transitionObj]);

  // Отладочный вывод
  // useEffect(() => {
  //   console.log(`Transition ${transitionObj.id} (${transitionType}) isAdded:`, isAdded)
  // }, [transitionObj, transitionType, isAdded])

  /**
   * Сбрасывает состояние видео элементов к начальному
   * Устанавливает время воспроизведения на начало и сбрасывает все CSS-стили
   */
  const resetVideos = useCallback(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current) return;

    const sourceVideo = sourceVideoRef.current;
    const targetVideo = targetVideoRef.current;

    // Сбрасываем время воспроизведения
    sourceVideo.currentTime = 0;
    targetVideo.currentTime = 0;

    // Сброс всех возможных стилей для исходного видео
    sourceVideo.style.transform = "scale(1)";
    sourceVideo.style.opacity = "1";
    sourceVideo.style.filter = "blur(0px) wave(0, 0%, 0%)";
    sourceVideo.style.clipPath = "none";
    sourceVideo.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
    sourceVideo.style.mixBlendMode = "normal";

    // Сброс всех возможных стилей для целевого видео
    targetVideo.style.opacity = "0"; // Целевое видео изначально скрыто
    targetVideo.style.transform = "scale(1)";
    targetVideo.style.filter = "blur(0px)";
    targetVideo.style.clipPath = "none";
    targetVideo.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
    targetVideo.style.mixBlendMode = "normal";
  }, []);

  /**
   * Запускает анимацию перехода между видео
   * Сначала показывает исходное видео, затем применяет эффект перехода и показывает целевое видео
   */
  const startTransition = useCallback(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current || isError) return;

    const sourceVideo = sourceVideoRef.current;
    const targetVideo = targetVideoRef.current;

    // Сбрасываем состояние видео перед началом перехода
    resetVideos();
    // Запускаем воспроизведение исходного видео
    void sourceVideo.play();

    // Устанавливаем таймер для начала перехода через 1 секунду
    transitionTimeoutRef.current = setTimeout(() => {
      // Показываем целевое видео
      targetVideo.style.opacity = "1";

      // Применяем соответствующий эффект перехода в зависимости от типа
      switch (transitionType) {
        case "zoom":
          // Эффект увеличения: исходное видео увеличивается и исчезает
          sourceVideo.style.transform = "scale(2)";
          sourceVideo.style.opacity = "0";
          break;

        case "fade":
          // Эффект затухания: исходное видео плавно исчезает
          sourceVideo.style.opacity = "0";
          break;

        case "slide":
          // Эффект слайда: исходное видео уезжает влево
          sourceVideo.style.transform = "translateX(-100%)";
          break;

        case "scale":
          // Эффект масштабирования: исходное видео уменьшается и исчезает
          sourceVideo.style.transform = "scale(0.1)";
          sourceVideo.style.opacity = "0";
          targetVideo.style.transform = "scale(1)";
          break;

        case "rotate":
          // Эффект вращения: исходное видео вращается и уменьшается
          sourceVideo.style.transform = "rotate(180deg) scale(0.5)";
          sourceVideo.style.opacity = "0";
          targetVideo.style.transform = "rotate(0deg) scale(1)";
          break;

        case "flip":
          // Эффект переворота: исходное видео переворачивается по оси Y
          sourceVideo.style.transform = "rotateY(180deg)";
          sourceVideo.style.opacity = "0";
          targetVideo.style.transform = "rotateY(0deg)";
          break;

        case "push":
          // Эффект выталкивания: исходное видео выталкивается влево
          sourceVideo.style.transform = "translateX(-100%)";
          targetVideo.style.transform = "translateX(0%)";
          targetVideo.style.transition = "transform 1s ease-in-out";
          break;

        case "squeeze":
          // Эффект сжатия: исходное видео сжимается по горизонтали
          sourceVideo.style.transform = "scaleX(0)";
          sourceVideo.style.opacity = "0";
          break;

        case "diagonal":
          // Эффект диагонали: исходное видео уходит по диагонали
          sourceVideo.style.transform = "translate(-100%, -100%)";
          sourceVideo.style.opacity = "0";
          break;

        case "spiral":
          // Эффект спирали: исходное видео вращается и уменьшается
          sourceVideo.style.transform = "rotate(720deg) scale(0)";
          sourceVideo.style.opacity = "0";
          break;

        case "fold":
          // Эффект складывания: исходное видео складывается как страница
          sourceVideo.style.transform = "perspective(500px) rotateX(90deg)";
          sourceVideo.style.opacity = "0";
          break;

        case "wave":
          // Эффект волны: исходное видео искажается волной и исчезает
          sourceVideo.style.transform = "scale(1.5)";
          sourceVideo.style.filter = "wave(16, 50%, 50%)";
          sourceVideo.style.opacity = "0";
          break;

        case "shutter":
          // Эффект шторки: исходное видео закрывается шторкой
          sourceVideo.style.clipPath = "inset(0 50% 0 50%)";
          sourceVideo.style.opacity = "0";
          break;

        case "bounce":
          // Эффект отскока: исходное видео уменьшается с эффектом пружины
          sourceVideo.style.transform = "scale(0)";
          sourceVideo.style.opacity = "0";
          sourceVideo.style.transition =
            "all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
          break;

        case "swirl":
          // Эффект вихря: исходное видео вращается быстрее и исчезает
          sourceVideo.style.transform = "rotate(1080deg) scale(0)";
          sourceVideo.style.opacity = "0";
          sourceVideo.style.transition = "all 1s cubic-bezier(0.4, 0, 0.2, 1)";
          break;

        case "dissolve":
          // Эффект растворения: исходное и целевое видео смешиваются
          sourceVideo.style.mixBlendMode = "multiply";
          targetVideo.style.mixBlendMode = "screen";
          sourceVideo.style.opacity = "0";
          break;
      }

      // Запускаем воспроизведение целевого видео
      void targetVideo.play();

      // Устанавливаем таймер для повторения перехода через 2 секунды
      loopTimeoutRef.current = setTimeout(() => {
        if (isHovering) {
          startTransition(); // Повторяем переход, если курсор все еще наведен
        }
      }, 2000);
    }, 1000);
  }, [isHovering, transitionType, isError]); // Убираем resetVideos из зависимостей

  /**
   * Эффект для инициализации видео и обработки ошибок
   */
  useEffect(() => {
    if (!sourceVideoRef.current || !targetVideoRef.current) return;

    const sourceVideo = sourceVideoRef.current;
    const targetVideo = targetVideoRef.current;

    // Функция обработки ошибок загрузки видео
    const handleError = () => setIsError(true);

    // Добавляем обработчики ошибок для обоих видео
    sourceVideo.addEventListener("error", handleError);
    targetVideo.addEventListener("error", handleError);

    // Запускаем исходное видео сразу для показа превью только один раз
    resetVideos();
    sourceVideo.play().catch(() => {
      // Игнорируем ошибки воспроизведения
    });

    // Функция очистки при размонтировании компонента
    return () => {
      // Удаляем обработчики ошибок
      sourceVideo.removeEventListener("error", handleError);
      targetVideo.removeEventListener("error", handleError);
      // Очищаем таймеры
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current);
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    };
  }, []); // Убираем resetVideos из зависимостей

  /**
   * Эффект для управления переходами при наведении
   */
  useEffect(() => {
    if (isHovering) {
      // Если курсор наведен - запускаем переход
      startTransition();
    } else {
      // Если курсор не наведен - сбрасываем к исходному состоянию
      resetVideos();
      if (sourceVideoRef.current) {
        void sourceVideoRef.current.play().catch(() => {
          // Игнорируем ошибки воспроизведения
        });
      }
      // Очищаем таймеры
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current);
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    }
  }, [isHovering]); // Убираем функции из зависимостей

  return (
    <div className="flex flex-col items-center">
      <div className="group relative">
        {/* Контейнер превью перехода */}
        <div
          className="flex cursor-pointer overflow-hidden rounded-xs bg-[#1a1a1a] relative"
          style={{ width: `${actualWidth}px`, height: `${actualHeight}px` }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={onClick}
        >
          {/* Индикаторы сложности и категории */}
          {currentTransition && (
            <>
              {/* Индикатор сложности */}
              <div className="absolute top-1 left-1 z-10">
                <div
                  className={`${complexityIndicator.color} rounded-full w-3 h-3 flex items-center justify-center`}
                  title={t(`transitions.complexity.${currentTransition.complexity}`, currentTransition.complexity)}
                >
                  <span className="text-[8px] font-bold text-white">
                    {complexityIndicator.label[0]}
                  </span>
                </div>
              </div>

              {/* Индикатор категории */}
              <div className="absolute top-1 right-1 z-10">
                <div
                  className="bg-gray-700 text-white rounded px-1 py-0.5 text-[8px] font-medium"
                  title={t(`transitions.categories.${currentTransition.category}`, currentTransition.category)}
                >
                  {categoryIndicator}
                </div>
              </div>

              {/* Индикатор длительности */}
              {currentTransition.duration && (
                <div className="absolute bottom-1 left-1 z-10">
                  <div className="bg-black bg-opacity-60 text-white rounded px-1 py-0.5 text-[8px]">
                    {currentTransition.duration.default.toFixed(1)}s
                  </div>
                </div>
              )}
            </>
          )}
          {isError ? (
            // Отображаем сообщение об ошибке, если видео не загрузилось
            <div className="flex h-full items-center justify-center text-white">
              {t("timeline.player.videoLoadError")}
            </div>
          ) : (
            // Контейнер для видео с переходом
            <div className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-md">
              {/* Исходное видео (видимое в начале) */}
              <video
                ref={sourceVideoRef}
                src={sourceVideo.path}
                className="h-full w-full origin-center object-cover transition-all duration-1000"
                muted
                loop
                playsInline
                preload="auto"
                onError={() => setIsError(true)}
                data-testid="source-video"
              />
              {/* Целевое видео (появляется при переходе) */}
              <video
                ref={targetVideoRef}
                src={targetVideo.path}
                className="absolute inset-0 h-full w-full origin-center object-cover opacity-0 transition-all duration-1000"
                muted
                loop
                playsInline
                preload="auto"
                onError={() => setIsError(true)}
                data-testid="target-video"
              />
              {/* Кнопка добавления в избранное */}
              <FavoriteButton
                file={favoriteFile}
                size={size}
                type="transition"
              />

              {/* Кнопка добавления перехода в проект */}
              <div
                className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
              >
                <AddMediaButton
                  file={addMediaFile}
                  onAddMedia={handleAddMedia}
                  onRemoveMedia={handleRemoveMedia}
                  isAdded={isAdded}
                  size={size}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Название перехода */}
      <div className="mt-1 text-xs text-center max-w-[120px] truncate">
        {currentTransition?.labels?.ru || t(`transitions.types.${transitionType}`, transitionType)}
      </div>
    </div>
  );
}
