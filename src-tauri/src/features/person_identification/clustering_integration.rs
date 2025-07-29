/**
 * Clustering Integration - Integration between face clustering and person identification
 */
use crate::features::person_identification::database::PersonDatabase;
use crate::features::person_identification::types::{PersonData, SimilaritySearchResult};
use crate::recognition::face_clustering::{ClusteringResult, FaceCluster};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Результат интеграции кластеризации
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusteringIntegrationResult {
  /// Созданные/обновленные персоны
  pub persons_created: Vec<String>,
  /// Добавленные эмбеддинги
  pub embeddings_added: usize,
  /// Объединенные персоны
  pub persons_merged: Vec<(String, String)>,
  /// Статистика
  pub stats: IntegrationStats,
}

/// Статистика интеграции
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationStats {
  pub total_clusters: usize,
  pub matched_persons: usize,
  pub new_persons: usize,
  pub merged_persons: usize,
  pub noise_faces: usize,
}

/// Метаданные для интеграции
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterMetadata {
  pub file_id: String,
  pub timestamps: Vec<f32>,
  pub bboxes: Vec<[f32; 4]>,
  pub frame_paths: Vec<String>,
}

/// Интегратор кластеризации с базой персон
pub struct ClusteringIntegrator<'a> {
  db: &'a mut PersonDatabase,
  similarity_threshold: f32,
}

impl<'a> ClusteringIntegrator<'a> {
  /// Создать новый интегратор
  pub fn new(db: &'a mut PersonDatabase, similarity_threshold: f32) -> Self {
    Self {
      db,
      similarity_threshold,
    }
  }

  /// Интегрировать результаты кластеризации в базу персон
  pub async fn integrate_clusters(
    &mut self,
    clustering_result: &ClusteringResult,
    embeddings: &[Vec<f32>],
    metadata: &ClusterMetadata,
  ) -> Result<ClusteringIntegrationResult> {
    let mut persons_created = Vec::new();
    let mut persons_merged = Vec::new();
    let mut embeddings_added = 0;
    let mut matched_persons = 0;
    let mut new_persons = 0;

    // Обрабатываем каждый кластер
    for cluster in &clustering_result.clusters {
      match self.process_cluster(cluster, embeddings, metadata).await? {
        ClusterProcessResult::NewPerson(person_id) => {
          persons_created.push(person_id);
          new_persons += 1;
          embeddings_added += cluster.face_indices.len();
        }
        ClusterProcessResult::MatchedPerson(person_id, added) => {
          matched_persons += 1;
          embeddings_added += added;
          if added > 0 {
            persons_created.push(person_id);
          }
        }
        ClusterProcessResult::MergedPersons(main_id, merged_ids) => {
          for merged_id in merged_ids {
            persons_merged.push((main_id.clone(), merged_id));
          }
          matched_persons += 1;
        }
      }
    }

    let stats = IntegrationStats {
      total_clusters: clustering_result.clusters.len(),
      matched_persons,
      new_persons,
      merged_persons: persons_merged.len(),
      noise_faces: clustering_result.noise_points.len(),
    };

    Ok(ClusteringIntegrationResult {
      persons_created,
      embeddings_added,
      persons_merged,
      stats,
    })
  }

  /// Обработать один кластер
  async fn process_cluster(
    &mut self,
    cluster: &FaceCluster,
    embeddings: &[Vec<f32>],
    metadata: &ClusterMetadata,
  ) -> Result<ClusterProcessResult> {
    // Ищем похожих персон в базе
    let similar_persons = self
      .db
      .search_similar_persons(&cluster.centroid, 5, true) // use_cosine = true
      .await?;

    if similar_persons.is_empty() {
      // Создаем новую персону
      let person_id = self
        .create_person_from_cluster(cluster, embeddings, metadata)
        .await?;
      Ok(ClusterProcessResult::NewPerson(person_id))
    } else if similar_persons.len() == 1 && similar_persons[0].similarity > 0.9 {
      // Высокое сходство с одной персоной - добавляем эмбеддинги
      let person_id = &similar_persons[0].person_id;
      let added = self
        .add_cluster_to_person(person_id, cluster, embeddings, metadata)
        .await?;
      Ok(ClusterProcessResult::MatchedPerson(
        person_id.clone(),
        added,
      ))
    } else {
      // Несколько похожих персон - возможно нужно объединить
      self
        .handle_multiple_matches(cluster, &similar_persons, embeddings, metadata)
        .await
    }
  }

  /// Создать новую персону из кластера
  async fn create_person_from_cluster(
    &mut self,
    cluster: &FaceCluster,
    embeddings: &[Vec<f32>],
    metadata: &ClusterMetadata,
  ) -> Result<String> {
    // Генерируем имя персоны
    let person_name = cluster
      .person_name
      .clone()
      .unwrap_or_else(|| format!("Person_{}", chrono::Utc::now().timestamp()));

    // Создаем персону
    let person_data = PersonData {
      name: person_name.clone(),
      alternative_names: vec![],
      notes: Some(format!(
        "Auto-detected from {} with {} appearances",
        metadata.file_id,
        cluster.face_indices.len()
      )),
      tags: vec!["auto-detected".to_string()],
      metadata: HashMap::from([
        ("source_file".to_string(), metadata.file_id.clone()),
        (
          "cluster_confidence".to_string(),
          cluster.confidence.to_string(),
        ),
        (
          "num_faces".to_string(),
          cluster.face_indices.len().to_string(),
        ),
      ]),
    };

    // Используем description из notes для create_person
    let person_profile = self.db.create_person(
      person_data.name.clone(),
      person_data.notes.clone(),
    ).await?;
    let person_id = person_profile.id;

    // Добавляем эмбеддинги
    for &idx in &cluster.face_indices {
      if idx < embeddings.len() && idx < metadata.timestamps.len() {
        self
          .db
          .add_face_embedding(
            &person_id,
            embeddings[idx].clone(),
            0.9, // default quality
            &metadata.file_id,
            idx as i32, // frame number
            metadata.timestamps[idx] as f64,
          )
          .await?;
      }
    }

    // Добавляем первое изображение как thumbnail
    if let Some(&first_idx) = cluster.face_indices.first() {
      if let Some(frame_path) = metadata.frame_paths.get(first_idx) {
        if let Ok(image_data) = std::fs::read(frame_path) {
          // Добавляем thumbnail
          self
            .db
            .add_thumbnail(
              &person_id,
              image_data,
              224, // стандартная ширина
              224, // стандартная высота
              true, // is_primary
              1.0,  // quality
            )
            .await?;
        }
      }
    }

    Ok(person_id.clone())
  }

  /// Добавить кластер к существующей персоне
  async fn add_cluster_to_person(
    &mut self,
    person_id: &str,
    cluster: &FaceCluster,
    embeddings: &[Vec<f32>],
    metadata: &ClusterMetadata,
  ) -> Result<usize> {
    let mut added = 0;

    // Добавляем только новые эмбеддинги
    for &idx in &cluster.face_indices {
      if idx < embeddings.len() {
        // Проверяем, не слишком ли похож эмбеддинг на уже существующие
        let is_duplicate = self
          .check_duplicate_embedding(
            person_id,
            &embeddings[idx],
            0.95, // Высокий порог для дубликатов
          )
          .await?;

        if !is_duplicate {
          self
            .db
            .add_face_embedding(
              person_id,
              embeddings[idx].clone(),
              0.9, // default quality
              &metadata.file_id,
              idx as i32,
              metadata.timestamps.get(idx).copied().unwrap_or(0.0) as f64,
            )
            .await?;
          added += 1;
        }
      }
    }

    // Добавляем появление персоны
    if added > 0 && !cluster.face_indices.is_empty() {
      let timestamps: Vec<f64> = cluster
        .face_indices
        .iter()
        .filter_map(|&idx| metadata.timestamps.get(idx))
        .map(|&t| t as f64)
        .collect();
      
      if !timestamps.is_empty() {
        let start_time = timestamps.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let end_time = timestamps.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        
        self
          .db
          .add_appearance(
            person_id,
            &metadata.file_id,
            start_time,
            end_time,
            cluster.confidence,
            cluster.face_indices.len() as i32,
          )
          .await?;
      }
    }

    Ok(added)
  }

  /// Обработать множественные совпадения
  async fn handle_multiple_matches(
    &mut self,
    cluster: &FaceCluster,
    similar_persons: &[SimilaritySearchResult],
    embeddings: &[Vec<f32>],
    metadata: &ClusterMetadata,
  ) -> Result<ClusterProcessResult> {
    // Если все совпадения имеют высокое сходство, возможно это одна персона
    let high_similarity_matches: Vec<_> = similar_persons
      .iter()
      .filter(|result| result.similarity > 0.85)
      .collect();

    if high_similarity_matches.len() > 1 {
      // Объединяем персон
      let main_person_id = &high_similarity_matches[0].person_id;
      let mut merged_ids = Vec::new();

      for result in high_similarity_matches.iter().skip(1) {
        // TODO: Реализовать merge_persons в PersonDatabase
        log::info!("Would merge person {} into {}", result.person_id, main_person_id);
        merged_ids.push(result.person_id.clone());
      }

      // Добавляем кластер к главной персоне
      self
        .add_cluster_to_person(main_person_id, cluster, embeddings, metadata)
        .await?;

      Ok(ClusterProcessResult::MergedPersons(
        main_person_id.clone(),
        merged_ids,
      ))
    } else {
      // Добавляем к наиболее похожей персоне
      let best_match = &similar_persons[0];
      let added = self
        .add_cluster_to_person(&best_match.person_id, cluster, embeddings, metadata)
        .await?;
      Ok(ClusterProcessResult::MatchedPerson(
        best_match.person_id.clone(),
        added,
      ))
    }
  }

  /// Проверить, является ли эмбеддинг дубликатом
  async fn check_duplicate_embedding(
    &self,
    _person_id: &str,
    _embedding: &[f32],
    _threshold: f32,
  ) -> Result<bool> {
    // TODO: Реализовать проверку дубликатов в PersonDatabase
    // Пока возвращаем false
    Ok(false)
  }
}

/// Результат обработки кластера
enum ClusterProcessResult {
  /// Создана новая персона
  NewPerson(String),
  /// Найдена существующая персона (id, количество добавленных эмбеддингов)
  MatchedPerson(String, usize),
  /// Объединены персоны (основная персона, объединенные персоны)
  MergedPersons(String, Vec<String>),
}

/// Автоматическая группировка персон после кластеризации
pub async fn auto_group_persons(
  db: &mut PersonDatabase,
  _min_appearances: usize,
) -> Result<HashMap<String, Vec<String>>> {
  // Получаем статистику по всем персонам
  let _stats = db.get_stats().await?;

  // TODO: Реализовать автоматическую группировку
  // Например, главные герои vs второстепенные персонажи

  let mut groups = HashMap::new();
  groups.insert("main_characters".to_string(), vec![]);
  groups.insert("supporting_characters".to_string(), vec![]);
  groups.insert("background_people".to_string(), vec![]);

  Ok(groups)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_integration_result() {
    let result = ClusteringIntegrationResult {
      persons_created: vec!["person1".to_string()],
      embeddings_added: 10,
      persons_merged: vec![],
      stats: IntegrationStats {
        total_clusters: 3,
        matched_persons: 1,
        new_persons: 2,
        merged_persons: 0,
        noise_faces: 5,
      },
    };

    assert_eq!(result.persons_created.len(), 1);
    assert_eq!(result.embeddings_added, 10);
    assert_eq!(result.stats.total_clusters, 3);
  }
}
