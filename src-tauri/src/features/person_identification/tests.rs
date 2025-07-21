#[cfg(test)]
mod tests {
    use crate::features::person_identification::{
        database::PersonDatabase,
        similarity::{cosine_similarity, euclidean_distance, euclidean_to_similarity},
    };
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_database_creation() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        
        let db = PersonDatabase::new(db_path).await.unwrap();
        assert!(db.get_stats().await.unwrap().total_persons == 0);
    }

    #[tokio::test]
    async fn test_person_crud() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = PersonDatabase::new(db_path).await.unwrap();

        // Create person
        let person = db.create_person(
            "Test Person".to_string(),
            Some("Test description".to_string())
        ).await.unwrap();
        
        assert_eq!(person.name, "Test Person");
        assert_eq!(person.description, Some("Test description".to_string()));
        assert!(!person.is_verified);

        // Get person
        let retrieved = db.get_person(&person.id).await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "Test Person");

        // Delete person
        db.delete_person(&person.id).await.unwrap();
        let deleted = db.get_person(&person.id).await.unwrap();
        assert!(deleted.is_none());
    }

    #[tokio::test]
    async fn test_face_embedding_operations() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = PersonDatabase::new(db_path).await.unwrap();

        // Create person
        let person = db.create_person(
            "Test Person".to_string(),
            None
        ).await.unwrap();

        // Add embedding
        let embedding = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        let face_embedding = db.add_face_embedding(
            &person.id,
            embedding.clone(),
            0.95,
            "clip_123",
            100,
            10.5
        ).await.unwrap();

        assert_eq!(face_embedding.person_id, person.id);
        assert_eq!(face_embedding.quality, 0.95);
        assert_eq!(face_embedding.embedding, embedding);
    }

    #[tokio::test]
    async fn test_similarity_search() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let mut db = PersonDatabase::new(db_path).await.unwrap();

        // Create persons with embeddings
        let person1 = db.create_person("Person 1".to_string(), None).await.unwrap();
        let person2 = db.create_person("Person 2".to_string(), None).await.unwrap();

        // Add similar embeddings to person1
        let embedding1 = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        db.add_face_embedding(&person1.id, embedding1.clone(), 0.9, "clip1", 1, 1.0).await.unwrap();

        // Add different embedding to person2
        let embedding2 = vec![0.9, 0.8, 0.7, 0.6, 0.5];
        db.add_face_embedding(&person2.id, embedding2.clone(), 0.9, "clip2", 1, 1.0).await.unwrap();

        // Search with similar embedding
        let query_embedding = vec![0.11, 0.21, 0.31, 0.41, 0.51];
        let results = db.search_similar_persons(&query_embedding, 10, true).await.unwrap();

        assert!(!results.is_empty());
        assert_eq!(results[0].person_id, person1.id);
        assert!(results[0].similarity > 0.95); // Should be very similar
    }

    #[tokio::test]
    async fn test_appearance_tracking() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = PersonDatabase::new(db_path).await.unwrap();

        // Create person
        let person = db.create_person("Test Person".to_string(), None).await.unwrap();

        // Add appearance
        let appearance = db.add_appearance(
            &person.id,
            "clip_123",
            10.0,
            20.0,
            0.9,
            300
        ).await.unwrap();

        assert_eq!(appearance.person_id, person.id);
        assert_eq!(appearance.clip_id, "clip_123");
        assert_eq!(appearance.start_time, 10.0);
        assert_eq!(appearance.end_time, 20.0);
        assert_eq!(appearance.confidence, 0.9);
        assert_eq!(appearance.frame_count, 300);
    }

    #[tokio::test]
    async fn test_thumbnail_management() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = PersonDatabase::new(db_path).await.unwrap();

        // Create person
        let person = db.create_person("Test Person".to_string(), None).await.unwrap();

        // Add thumbnail
        let image_data = vec![1, 2, 3, 4, 5]; // Mock image data
        let thumbnail = db.add_thumbnail(
            &person.id,
            image_data.clone(),
            200,
            200,
            true,
            0.95
        ).await.unwrap();

        assert_eq!(thumbnail.person_id, person.id);
        assert_eq!(thumbnail.image_data, image_data);
        assert_eq!(thumbnail.width, 200);
        assert_eq!(thumbnail.height, 200);
        assert!(thumbnail.is_primary);
    }

    #[tokio::test]
    async fn test_database_stats() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = PersonDatabase::new(db_path).await.unwrap();

        // Create test data
        let person1 = db.create_person("Person 1".to_string(), None).await.unwrap();
        let person2 = db.create_person("Person 2".to_string(), None).await.unwrap();

        // Add embeddings
        db.add_face_embedding(&person1.id, vec![0.1, 0.2], 0.9, "clip1", 1, 1.0).await.unwrap();
        db.add_face_embedding(&person1.id, vec![0.2, 0.3], 0.8, "clip2", 2, 2.0).await.unwrap();
        db.add_face_embedding(&person2.id, vec![0.3, 0.4], 0.9, "clip3", 3, 3.0).await.unwrap();

        // Add appearances
        db.add_appearance(&person1.id, "clip1", 0.0, 10.0, 0.9, 300).await.unwrap();
        db.add_appearance(&person2.id, "clip2", 5.0, 15.0, 0.8, 300).await.unwrap();

        // Get stats
        let stats = db.get_stats().await.unwrap();

        assert_eq!(stats.total_persons, 2);
        assert_eq!(stats.total_embeddings, 3);
        assert_eq!(stats.total_appearances, 2);
        assert_eq!(stats.average_embeddings_per_person, 1.5);
        assert!(stats.storage_size_bytes > 0);
    }

    #[test]
    fn test_similarity_calculations() {
        // Test cosine similarity
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert_eq!(cosine_similarity(&a, &b), 1.0);

        let c = vec![0.0, 1.0, 0.0];
        assert_eq!(cosine_similarity(&a, &c), 0.0);

        let d = vec![-1.0, 0.0, 0.0];
        assert_eq!(cosine_similarity(&a, &d), -1.0);

        // Test euclidean distance
        let e = vec![0.0, 0.0];
        let f = vec![3.0, 4.0];
        assert_eq!(euclidean_distance(&e, &f), 5.0);

        // Test euclidean to similarity conversion
        assert_eq!(euclidean_to_similarity(0.0), 1.0);
        assert!(euclidean_to_similarity(1.0) < 1.0);
        assert!(euclidean_to_similarity(10.0) < euclidean_to_similarity(1.0));
    }

    #[tokio::test]
    async fn test_threshold_setting() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let mut db = PersonDatabase::new(db_path).await.unwrap();

        // Set threshold
        db.set_similarity_threshold(0.85);
        
        // Create person with embedding
        let person = db.create_person("Test Person".to_string(), None).await.unwrap();
        let embedding = vec![0.1, 0.2, 0.3, 0.4, 0.5];
        db.add_face_embedding(&person.id, embedding.clone(), 0.9, "clip1", 1, 1.0).await.unwrap();

        // Search with slightly different embedding
        let query = vec![0.15, 0.25, 0.35, 0.45, 0.55];
        let results = db.search_similar_persons(&query, 10, true).await.unwrap();

        // Should find results if similarity is above threshold
        assert!(!results.is_empty() || results[0].similarity >= 0.85);
    }

    #[tokio::test]
    async fn test_embedding_conversion() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = PersonDatabase::new(db_path).await.unwrap();

        // Test embedding to bytes and back
        let original = vec![0.1_f32, 0.2, 0.3, 0.4, 0.5];
        let bytes = db.embedding_to_bytes(&original);
        let restored = db.bytes_to_embedding(&bytes, original.len()).unwrap();

        for i in 0..original.len() {
            assert!((original[i] - restored[i]).abs() < f32::EPSILON);
        }
    }
}