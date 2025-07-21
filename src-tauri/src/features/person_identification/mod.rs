pub mod database;
pub mod commands;
pub mod types;
pub mod similarity;
pub mod registry;

#[cfg(test)]
mod tests;

pub use database::PersonDatabase;
pub use types::*;
pub use registry::PersonIdentificationRegistry;