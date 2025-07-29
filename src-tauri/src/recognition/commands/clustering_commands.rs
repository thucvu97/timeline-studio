/**
 * Clustering Commands - Tauri commands for face clustering
 */
use crate::recognition::face_clustering::{
  ClusteringResult, DBSCANParams, DistanceMetric, FaceCluster, FaceClusteringEngine,
};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{Emitter, State};
use tokio::sync::Mutex;

/// Состояние для движка кластеризации
pub struct ClusteringEngineState(pub Arc<Mutex<Option<FaceClusteringEngine>>>);

impl Default for ClusteringEngineState {
  fn default() -> Self {
    Self(Arc::new(Mutex::new(None)))
  }
}

/// Результат кластеризации для фронтенда
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusteringResponse {
  pub success: bool,
  pub message: String,
  pub result: Option<ClusteringResult>,
}

/// Запрос на кластеризацию
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterFacesRequest {
  /// Эмбеддинги лиц для кластеризации
  pub embeddings: Vec<Vec<f32>>,
  /// Опциональные параметры DBSCAN
  pub params: Option<DBSCANParams>,
  /// Метаданные лиц (опционально)
  pub face_metadata: Option<Vec<FaceMetadata>>,
}

/// Метаданные лица
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceMetadata {
  pub file_id: String,
  pub timestamp: f32,
  pub bbox: [f32; 4],
}

/// Результат поиска ближайшего кластера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NearestClusterResult {
  pub found: bool,
  pub cluster_index: Option<usize>,
  pub similarity: Option<f32>,
  pub cluster: Option<FaceCluster>,
}

/// Инициализировать движок кластеризации
#[tauri::command]
pub async fn init_clustering_engine(
  state: State<'_, ClusteringEngineState>,
  params: Option<DBSCANParams>,
) -> Result<ClusteringResponse, String> {
  let mut engine_guard = state.0.lock().await;

  let params = params.unwrap_or_default();
  let engine = FaceClusteringEngine::new(params.clone());

  *engine_guard = Some(engine);

  log::info!(
    "Clustering engine initialized with params: eps={}, min_samples={}",
    params.eps,
    params.min_samples
  );

  Ok(ClusteringResponse {
    success: true,
    message: "Clustering engine initialized successfully".to_string(),
    result: None,
  })
}

/// Кластеризовать лица
#[tauri::command]
pub async fn cluster_faces(
  state: State<'_, ClusteringEngineState>,
  request: ClusterFacesRequest,
) -> Result<ClusteringResponse, String> {
  let mut engine_guard = state.0.lock().await;

  // Инициализируем движок если его нет
  if engine_guard.is_none() {
    let params = request.params.clone().unwrap_or_default();
    *engine_guard = Some(FaceClusteringEngine::new(params));
  }

  let engine = engine_guard.as_mut().ok_or("Engine not initialized")?;

  // Обновляем параметры если переданы
  if let Some(params) = request.params {
    engine.update_params(params);
  }

  // Выполняем кластеризацию
  match engine.cluster_faces(&request.embeddings) {
    Ok(result) => {
      log::info!(
        "Clustering completed: {} clusters found, {} noise points",
        result.clusters.len(),
        result.noise_points.len()
      );

      Ok(ClusteringResponse {
        success: true,
        message: format!(
          "Found {} clusters with {:.1}% coverage",
          result.clusters.len(),
          result.get_coverage() * 100.0
        ),
        result: Some(result),
      })
    }
    Err(e) => {
      log::error!("Clustering failed: {}", e);
      Err(format!("Clustering failed: {}", e))
    }
  }
}

/// Найти ближайший кластер для нового эмбеддинга
#[tauri::command]
pub async fn find_nearest_cluster(
  state: State<'_, ClusteringEngineState>,
  embedding: Vec<f32>,
  clusters: Vec<FaceCluster>,
) -> Result<NearestClusterResult, String> {
  let engine_guard = state.0.lock().await;
  let engine = engine_guard.as_ref().ok_or("Engine not initialized")?;

  match engine.find_nearest_cluster(&embedding, &clusters) {
    Ok(Some((idx, similarity))) => Ok(NearestClusterResult {
      found: true,
      cluster_index: Some(idx),
      similarity: Some(similarity),
      cluster: clusters.get(idx).cloned(),
    }),
    Ok(None) => Ok(NearestClusterResult {
      found: false,
      cluster_index: None,
      similarity: None,
      cluster: None,
    }),
    Err(e) => Err(format!("Error finding nearest cluster: {}", e)),
  }
}

/// Обновить параметры кластеризации
#[tauri::command]
pub async fn update_clustering_params(
  state: State<'_, ClusteringEngineState>,
  params: DBSCANParams,
) -> Result<ClusteringResponse, String> {
  let mut engine_guard = state.0.lock().await;

  if let Some(engine) = engine_guard.as_mut() {
    engine.update_params(params.clone());

    Ok(ClusteringResponse {
      success: true,
      message: format!(
        "Parameters updated: eps={}, min_samples={}",
        params.eps, params.min_samples
      ),
      result: None,
    })
  } else {
    Err("Engine not initialized".to_string())
  }
}

/// Получить информацию о движке кластеризации
#[tauri::command]
pub async fn get_clustering_engine_info(
  state: State<'_, ClusteringEngineState>,
) -> Result<HashMap<String, serde_json::Value>, String> {
  use serde_json::json;

  let engine_guard = state.0.lock().await;

  if let Some(engine) = engine_guard.as_ref() {
    let params = engine.get_params();

    Ok(HashMap::from([
      ("initialized".to_string(), json!(true)),
      ("params".to_string(), json!(params)),
      (
        "metric".to_string(),
        json!(match params.metric {
          DistanceMetric::Cosine => "cosine",
          DistanceMetric::Euclidean => "euclidean",
        }),
      ),
    ]))
  } else {
    Ok(HashMap::from([("initialized".to_string(), json!(false))]))
  }
}

/// Объединить два кластера
#[tauri::command]
pub async fn merge_clusters(
  state: State<'_, ClusteringEngineState>,
  cluster1: FaceCluster,
  cluster2: FaceCluster,
  embeddings: Vec<Vec<f32>>,
) -> Result<FaceCluster, String> {
  let engine_guard = state.0.lock().await;
  let engine = engine_guard.as_ref().ok_or("Engine not initialized")?;

  engine
    .merge_clusters(&cluster1, &cluster2, &embeddings)
    .map_err(|e| format!("Failed to merge clusters: {}", e))
}

/// Анализировать качество кластеризации
#[tauri::command]
pub async fn analyze_clustering_quality(
  clustering_result: ClusteringResult,
) -> Result<HashMap<String, f32>, String> {
  let mut quality_metrics = HashMap::new();

  // Покрытие (процент лиц в кластерах)
  quality_metrics.insert("coverage".to_string(), clustering_result.get_coverage());

  // Средний размер кластера
  quality_metrics.insert(
    "avg_cluster_size".to_string(),
    clustering_result.stats.avg_cluster_size,
  );

  // Отношение кластеров к общему числу лиц
  let cluster_ratio = if clustering_result.stats.total_faces > 0 {
    clustering_result.stats.num_clusters as f32 / clustering_result.stats.total_faces as f32
  } else {
    0.0
  };
  quality_metrics.insert("cluster_ratio".to_string(), cluster_ratio);

  // Средняя уверенность кластеров
  let avg_confidence = if !clustering_result.clusters.is_empty() {
    clustering_result
      .clusters
      .iter()
      .map(|c| c.confidence)
      .sum::<f32>()
      / clustering_result.clusters.len() as f32
  } else {
    0.0
  };
  quality_metrics.insert("avg_confidence".to_string(), avg_confidence);

  Ok(quality_metrics)
}

/// Автоматическая кластеризация видео
#[tauri::command]
pub async fn auto_cluster_video_faces<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  file_id: String,
  embeddings: Vec<Vec<f32>>,
  metadata: Vec<FaceMetadata>,
  save_results: bool,
) -> Result<ClusteringResponse, String> {
  // Создаем временный движок с оптимальными параметрами для видео
  let params = DBSCANParams {
    eps: 0.45,      // Более строгий порог для видео
    min_samples: 5, // Минимум 5 лиц для устойчивого кластера
    metric: DistanceMetric::Cosine,
  };

  let engine = FaceClusteringEngine::new(params);

  match engine.cluster_faces(&embeddings) {
    Ok(mut result) => {
      // Добавляем метаданные к результатам
      for cluster in &mut result.clusters {
        // Присваиваем временные имена главным героям
        if cluster.face_indices.len() > 20 {
          cluster.person_name = Some(format!("Main Person {}", cluster.id));
        } else if cluster.face_indices.len() > 10 {
          cluster.person_name = Some(format!("Person {}", cluster.id));
        }
      }

      // Сохраняем результаты если требуется
      if save_results {
        // TODO: Интеграция с PersonDatabase для сохранения кластеров
        log::info!(
          "Would save {} clusters for file {}",
          result.clusters.len(),
          file_id
        );
      }

      // Отправляем событие о завершении
      app
        .emit(
          "clustering-completed",
          serde_json::json!({
              "file_id": file_id,
              "num_clusters": result.clusters.len(),
              "coverage": result.get_coverage(),
          }),
        )
        .map_err(|e| e.to_string())?;

      Ok(ClusteringResponse {
        success: true,
        message: format!(
          "Video clustering completed: {} persons detected",
          result.clusters.len()
        ),
        result: Some(result),
      })
    }
    Err(e) => {
      log::error!("Video clustering failed: {}", e);
      Err(format!("Video clustering failed: {}", e))
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_clustering_state_creation() {
    let state = ClusteringEngineState::default();
    let guard = state.0.lock().await;
    assert!(guard.is_none());
  }

  #[tokio::test]
  async fn test_clustering_response() {
    let response = ClusteringResponse {
      success: true,
      message: "Test".to_string(),
      result: None,
    };

    assert!(response.success);
    assert_eq!(response.message, "Test");
  }
}
