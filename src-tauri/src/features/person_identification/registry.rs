use tauri::{Builder, Runtime};
use crate::CommandRegistry;

use super::commands::*;

pub struct PersonIdentificationRegistry;

impl CommandRegistry for PersonIdentificationRegistry {
    fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
        builder.invoke_handler(tauri::generate_handler![
            init_person_database,
            create_person,
            get_person,
            add_face_embedding,
            search_similar_persons,
            add_person_appearance,
            add_person_thumbnail,
            get_person_database_stats,
            delete_person,
            set_similarity_threshold,
        ])
    }
}