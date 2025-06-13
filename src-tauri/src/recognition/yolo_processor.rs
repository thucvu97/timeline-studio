use anyhow::{anyhow, Result};
use image::{imageops::FilterType, DynamicImage, GenericImageView};
use ort::session::{builder::GraphOptimizationLevel, Session, SessionOutputs};
use ort::value::Tensor;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Once;

// Инициализация tract backend для ORT
static INIT: Once = Once::new();

fn init_ort() -> Result<()> {
    INIT.call_once(|| {
        // Инициализируем ORT с tract backend для bundled builds
        ort::init()
            .with_execution_providers([ort_tract::tract_provider()])
            .commit()
            .expect("Failed to initialize ORT with tract backend");
    });
    Ok(())
}

/// Поддерживаемые модели YOLO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum YoloModel {
  /// YOLOv11 для обнаружения объектов
  YoloV11Detection,
  /// YOLOv11 для сегментации
  YoloV11Segmentation,
  /// YOLOv11 для обнаружения лиц
  YoloV11Face,
  /// YOLOv8 для обнаружения объектов (legacy)
  YoloV8Detection,
  /// YOLOv8 для сегментации (legacy)
  YoloV8Segmentation,
  /// YOLOv8 для обнаружения лиц (legacy)
  YoloV8Face,
  /// Пользовательская модель
  Custom(PathBuf),
}

/// Результат обнаружения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
  /// Класс объекта
  pub class: String,
  /// ID класса
  pub class_id: usize,
  /// Уверенность (0.0 - 1.0)
  pub confidence: f32,
  /// Координаты (x, y, width, height) в пикселях
  pub bbox: BoundingBox,
  /// Дополнительные атрибуты (для лиц)
  pub attributes: Option<FaceAttributes>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceAttributes {
  /// Ключевые точки лица
  pub landmarks: Vec<(f32, f32)>,
  /// Предполагаемый возраст
  pub age: Option<f32>,
  /// Предполагаемый пол
  pub gender: Option<String>,
  /// Эмоция
  pub emotion: Option<String>,
}

/// Процессор YOLO для распознавания объектов
pub struct YoloProcessor {
  /// ONNX сессия
  session: Option<Session>,
  /// Путь к модели
  model_path: PathBuf,
  /// Тип модели
  model_type: YoloModel,
  /// Минимальная уверенность для детекции
  confidence_threshold: f32,
  /// Классы для обнаружения (если пусто - все)
  target_classes: Vec<String>,
  /// IoU порог для NMS
  iou_threshold: f32,
}

/// Инициализация tract backend для ORT
fn init_ort_tract() {
  INIT.call_once(|| {
    ort::set_api(ort_tract::api());
  });
}

impl YoloProcessor {
  /// Создать новый процессор
  pub fn new(model_type: YoloModel, confidence_threshold: f32) -> Result<Self> {
    // Инициализируем tract backend
    init_ort_tract();
    let model_path = match &model_type {
      YoloModel::YoloV11Detection => PathBuf::from("models/yolo11n.onnx"),
      YoloModel::YoloV11Segmentation => PathBuf::from("models/yolo11n-seg.onnx"),
      YoloModel::YoloV11Face => PathBuf::from("models/yolo11n-face.onnx"),
      YoloModel::YoloV8Detection => PathBuf::from("models/yolov8n.onnx"),
      YoloModel::YoloV8Segmentation => PathBuf::from("models/yolov8n-seg.onnx"),
      YoloModel::YoloV8Face => PathBuf::from("models/yolov8n-face.onnx"),
      YoloModel::Custom(path) => path.clone(),
    };

    Ok(Self {
      session: None,
      model_path,
      model_type,
      confidence_threshold,
      target_classes: Vec::new(),
      iou_threshold: 0.45,
    })
  }

  /// Загрузить модель
  pub async fn load_model(&mut self) -> Result<()> {
    if self.model_path.exists() {
      // Инициализируем ORT с tract backend перед созданием сессии
      init_ort()?;
      
      // Создаем ONNX сессию
      let session = Session::builder()?
        .with_optimization_level(GraphOptimizationLevel::Level3)?
        .with_intra_threads(4)?
        .commit_from_file(&self.model_path)?;

      self.session = Some(session);
      Ok(())
    } else {
      Err(anyhow!("Model file not found: {:?}", self.model_path))
    }
  }

  /// Установить целевые классы для обнаружения
  pub fn set_target_classes(&mut self, classes: Vec<String>) {
    self.target_classes = classes;
  }

  /// Обработать изображение
  pub async fn process_image(&mut self, image_path: &Path) -> Result<Vec<Detection>> {
    // Проверяем, загружена ли модель
    if self.session.is_none() {
      return Err(anyhow!("Model not loaded. Call load_model() first"));
    }

    // Загружаем изображение
    let image = image::open(image_path)?;
    let (orig_width, orig_height) = image.dimensions();

    // Преобразуем изображение в тензор YOLO (640x640)
    let input_tensor = self.preprocess_image(&image)?;

    // Выполняем инференс
    // ort::inputs! больше не возвращает Result в v2.0.0-rc.10
    let inputs = ort::inputs!["images" => input_tensor];
    let outputs = self.session.as_mut().unwrap().run(inputs)?;

    // Обрабатываем результаты без заимствования self
    let detections = Self::postprocess_output_static(
      &outputs,
      orig_width,
      orig_height,
      self.confidence_threshold,
      &self.target_classes,
      self.iou_threshold,
    )?;

    Ok(detections)
  }

  /// Предобработка изображения
  fn preprocess_image(&self, image: &DynamicImage) -> Result<Tensor<f32>> {
    // Resize к 640x640
    let resized = image.resize_exact(640, 640, FilterType::CatmullRom);

    // Создаем плоский вектор для данных [1, 3, 640, 640]
    let mut data = vec![0.0f32; 3 * 640 * 640];

    for (x, y, pixel) in resized.pixels() {
      let channels = pixel.0;
      // NCHW формат: batch=0, channel, height=y, width=x
      data[(y as usize * 640) + x as usize] = channels[0] as f32 / 255.0;
      data[(640 * 640) + y as usize * 640 + x as usize] = channels[1] as f32 / 255.0;
      data[(2 * 640 * 640) + y as usize * 640 + x as usize] = channels[2] as f32 / 255.0;
    }

    // Создаем Tensor из вектора с формой
    let shape = vec![1i64, 3, 640, 640];
    let tensor = Tensor::from_array((shape, data))?;
    Ok(tensor)
  }

  /// Постобработка результатов (статическая версия)
  fn postprocess_output_static(
    outputs: &SessionOutputs,
    orig_width: u32,
    orig_height: u32,
    confidence_threshold: f32,
    target_classes: &[String],
    iou_threshold: f32,
  ) -> Result<Vec<Detection>> {
    // Получаем выходной тензор
    let output = outputs
      .get("output0")
      .ok_or_else(|| anyhow!("Output tensor not found"))?;

    // В v2.0.0-rc.10 используется try_extract_array
    let output_array = output.try_extract_array::<f32>()?;
    let output_shape = output_array.shape();

    // YOLO v8/v11 формат: [1, 84, 8400] или [1, num_classes + 4, num_boxes]
    if output_shape.len() != 3 {
      return Err(anyhow!("Unexpected output shape: {:?}", output_shape));
    }

    let num_classes = output_shape[1] - 4;
    let num_boxes = output_shape[2];

    let mut detections = Vec::new();
    let scale_x = orig_width as f32 / 640.0;
    let scale_y = orig_height as f32 / 640.0;

    // Обрабатываем каждый бокс
    for i in 0..num_boxes {
      // Получаем координаты бокса
      let cx = output_array[[0, 0, i]] * scale_x;
      let cy = output_array[[0, 1, i]] * scale_y;
      let w = output_array[[0, 2, i]] * scale_x;
      let h = output_array[[0, 3, i]] * scale_y;

      // Находим максимальную уверенность среди классов
      let mut max_conf = 0.0;
      let mut max_class = 0;

      for c in 0..num_classes {
        let conf = output_array[[0, 4 + c, i]];
        if conf > max_conf {
          max_conf = conf;
          max_class = c;
        }
      }

      // Фильтруем по уверенности
      if max_conf < confidence_threshold {
        continue;
      }

      // Получаем название класса
      let class_name = Self::get_class_name_static(max_class);

      // Фильтруем по целевым классам
      if !target_classes.is_empty() && !target_classes.contains(&class_name) {
        continue;
      }

      detections.push(Detection {
        class: class_name,
        class_id: max_class,
        confidence: max_conf,
        bbox: BoundingBox {
          x: cx - w / 2.0,
          y: cy - h / 2.0,
          width: w,
          height: h,
        },
        attributes: None,
      });
    }

    // Применяем NMS
    let filtered = Self::apply_nms_static(detections, iou_threshold);

    Ok(filtered)
  }

  /// Применить Non-Maximum Suppression (статическая версия)
  fn apply_nms_static(mut detections: Vec<Detection>, iou_threshold: f32) -> Vec<Detection> {
    // Сортируем по уверенности
    detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

    let mut keep = Vec::new();
    let mut suppressed = vec![false; detections.len()];

    for i in 0..detections.len() {
      if suppressed[i] {
        continue;
      }

      keep.push(detections[i].clone());

      // Подавляем пересекающиеся боксы
      for j in (i + 1)..detections.len() {
        if suppressed[j] || detections[i].class != detections[j].class {
          continue;
        }

        let iou = Self::calculate_iou_static(&detections[i].bbox, &detections[j].bbox);
        if iou > iou_threshold {
          suppressed[j] = true;
        }
      }
    }

    keep
  }

  /// Вычислить IoU двух боксов (статическая версия)
  fn calculate_iou_static(box1: &BoundingBox, box2: &BoundingBox) -> f32 {
    let x1 = box1.x.max(box2.x);
    let y1 = box1.y.max(box2.y);
    let x2 = (box1.x + box1.width).min(box2.x + box2.width);
    let y2 = (box1.y + box1.height).min(box2.y + box2.height);

    if x2 < x1 || y2 < y1 {
      return 0.0;
    }

    let intersection = (x2 - x1) * (y2 - y1);
    let area1 = box1.width * box1.height;
    let area2 = box2.width * box2.height;
    let union = area1 + area2 - intersection;

    intersection / union
  }

  /// Получить название класса по индексу (статическая версия)
  fn get_class_name_static(class_id: usize) -> String {
    let class_names = Self::get_class_names_static();
    class_names
      .get(class_id)
      .cloned()
      .unwrap_or_else(|| format!("class_{}", class_id))
  }

  /// Обработать несколько изображений пакетом
  pub async fn process_batch(&mut self, image_paths: Vec<PathBuf>) -> Result<Vec<Vec<Detection>>> {
    let mut results = Vec::new();

    for path in image_paths {
      let detections = self.process_image(&path).await?;
      results.push(detections);
    }

    Ok(results)
  }

  /// Мок-функция для демонстрации (заменить на реальную YOLO)
  fn mock_process_image(&self, image: &DynamicImage) -> Vec<Detection> {
    let (width, height) = image.dimensions();

    match self.model_type {
      YoloModel::YoloV8Detection => {
        // Демо: обнаружение объектов
        vec![
          Detection {
            class: "person".to_string(),
            class_id: 0,
            confidence: 0.92,
            bbox: BoundingBox {
              x: width as f32 * 0.3,
              y: height as f32 * 0.2,
              width: width as f32 * 0.2,
              height: height as f32 * 0.6,
            },
            attributes: None,
          },
          Detection {
            class: "car".to_string(),
            class_id: 2,
            confidence: 0.85,
            bbox: BoundingBox {
              x: width as f32 * 0.6,
              y: height as f32 * 0.5,
              width: width as f32 * 0.3,
              height: height as f32 * 0.2,
            },
            attributes: None,
          },
        ]
      }
      YoloModel::YoloV8Face => {
        // Демо: обнаружение лиц
        vec![Detection {
          class: "face".to_string(),
          class_id: 0,
          confidence: 0.95,
          bbox: BoundingBox {
            x: width as f32 * 0.4,
            y: height as f32 * 0.3,
            width: width as f32 * 0.15,
            height: height as f32 * 0.2,
          },
          attributes: Some(FaceAttributes {
            landmarks: vec![
              (width as f32 * 0.42, height as f32 * 0.35), // Левый глаз
              (width as f32 * 0.48, height as f32 * 0.35), // Правый глаз
              (width as f32 * 0.45, height as f32 * 0.38), // Нос
              (width as f32 * 0.43, height as f32 * 0.42), // Левый угол рта
              (width as f32 * 0.47, height as f32 * 0.42), // Правый угол рта
            ],
            age: Some(25.0),
            gender: Some("male".to_string()),
            emotion: Some("neutral".to_string()),
          }),
        }]
      }
      _ => Vec::new(),
    }
  }

  /// Получить список поддерживаемых классов (статическая версия для базовой модели)
  fn get_class_names_static() -> Vec<String> {
    // Возвращаем стандартные классы COCO для YOLOv8/v11
    vec![
      "person",
      "bicycle",
      "car",
      "motorcycle",
      "airplane",
      "bus",
      "train",
      "truck",
      "boat",
      "traffic light",
      "fire hydrant",
      "stop sign",
      "parking meter",
      "bench",
      "bird",
      "cat",
      "dog",
      "horse",
      "sheep",
      "cow",
      "elephant",
      "bear",
      "zebra",
      "giraffe",
      "backpack",
      "umbrella",
      "handbag",
      "tie",
      "suitcase",
      "frisbee",
      "skis",
      "snowboard",
      "sports ball",
      "kite",
      "baseball bat",
      "baseball glove",
      "skateboard",
      "surfboard",
      "tennis racket",
      "bottle",
      "wine glass",
      "cup",
      "fork",
      "knife",
      "spoon",
      "bowl",
      "banana",
      "apple",
      "sandwich",
      "orange",
      "broccoli",
      "carrot",
      "hot dog",
      "pizza",
      "donut",
      "cake",
      "chair",
      "couch",
      "potted plant",
      "bed",
      "dining table",
      "toilet",
      "tv",
      "laptop",
      "mouse",
      "remote",
      "keyboard",
      "cell phone",
      "microwave",
      "oven",
      "toaster",
      "sink",
      "refrigerator",
      "book",
      "clock",
      "vase",
      "scissors",
      "teddy bear",
      "hair drier",
      "toothbrush",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect()
  }

  /// Получить список поддерживаемых классов
  pub fn get_class_names(&self) -> Vec<String> {
    match self.model_type {
      YoloModel::YoloV11Detection | YoloModel::YoloV8Detection => vec![
        "person",
        "bicycle",
        "car",
        "motorcycle",
        "airplane",
        "bus",
        "train",
        "truck",
        "boat",
        "traffic light",
        "fire hydrant",
        "stop sign",
        "parking meter",
        "bench",
        "bird",
        "cat",
        "dog",
        "horse",
        "sheep",
        "cow",
        "elephant",
        "bear",
        "zebra",
        "giraffe",
        "backpack",
        "umbrella",
        "handbag",
        "tie",
        "suitcase",
        "frisbee",
        "skis",
        "snowboard",
        "sports ball",
        "kite",
        "baseball bat",
        "baseball glove",
        "skateboard",
        "surfboard",
        "tennis racket",
        "bottle",
        "wine glass",
        "cup",
        "fork",
        "knife",
        "spoon",
        "bowl",
        "banana",
        "apple",
        "sandwich",
        "orange",
        "broccoli",
        "carrot",
        "hot dog",
        "pizza",
        "donut",
        "cake",
        "chair",
        "couch",
        "potted plant",
        "bed",
        "dining table",
        "toilet",
        "tv",
        "laptop",
        "mouse",
        "remote",
        "keyboard",
        "cell phone",
        "microwave",
        "oven",
        "toaster",
        "sink",
        "refrigerator",
        "book",
        "clock",
        "vase",
        "scissors",
        "teddy bear",
        "hair drier",
        "toothbrush",
      ]
      .iter()
      .map(|s| s.to_string())
      .collect(),
      YoloModel::YoloV11Face | YoloModel::YoloV8Face => vec!["face".to_string()],
      _ => Vec::new(),
    }
  }
}

/// Конфигурация для процессора
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YoloConfig {
  /// Тип модели
  pub model_type: YoloModel,
  /// Порог уверенности
  pub confidence_threshold: f32,
  /// Порог NMS (Non-Maximum Suppression)
  pub nms_threshold: f32,
  /// Максимальное количество детекций
  pub max_detections: usize,
  /// Размер входного изображения
  pub input_size: (u32, u32),
}

impl Default for YoloConfig {
  fn default() -> Self {
    Self {
      model_type: YoloModel::YoloV11Detection,
      confidence_threshold: 0.5,
      nms_threshold: 0.45,
      max_detections: 100,
      input_size: (640, 640),
    }
  }
}
