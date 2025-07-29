# ML Models Directory

Эта директория содержит ONNX модели для машинного обучения в Timeline Studio.

## Структура

```
models/
├── yolo/           # YOLO модели для детекции объектов и лиц
│   ├── yolov8n.onnx           # YOLOv8 Nano для общих объектов
│   ├── yolov8n-face.onnx      # YOLOv8 для детекции лиц
│   └── yolov11n-face.onnx     # YOLOv11 для детекции лиц
└── facenet/        # FaceNet модели для генерации embeddings
    ├── facenet-512d.onnx      # FaceNet 512-размерные embeddings
    ├── facenet-128d.onnx      # FaceNet 128-размерные embeddings
    └── arcface-512d.onnx      # ArcFace 512-размерные embeddings
```

## Загрузка моделей

Для загрузки моделей запустите:

```bash
./scripts/download-models.sh
```

## Заглушки для разработки

В режиме разработки используются упрощенные модели-заглушки:

- **YOLO модели**: Простые модели для тестирования детекции
- **FaceNet модели**: Упрощенные модели для генерации embeddings

## Продакшен модели

Для продакшена нужны реальные обученные модели:

### YOLO Face Detection
- **YOLOv8-Face**: https://github.com/deepcam-cn/yolov5-face
- **YOLOv11-Face**: Обновленные модели от Ultralytics

### Face Recognition
- **FaceNet**: https://github.com/davidsandberg/facenet
- **ArcFace**: https://github.com/deepinsight/insightface
- **ONNX Models**: https://github.com/onnx/models/tree/main/vision

## Конфигурация

Пути к моделям настраиваются в:
- `src-tauri/src/models_config.rs` - конфигурация путей
- `src-tauri/src/recognition/yolo_processor.rs` - YOLO модели  
- `src-tauri/src/recognition/facenet_processor.rs` - FaceNet модели

## Требования к системе

- **ONNX Runtime**: Для выполнения инференса
- **GPU (опционально)**: CUDA/ROCm для ускорения
- **Память**: Минимум 4GB RAM для комфортной работы
- **Диск**: ~500MB для всех моделей