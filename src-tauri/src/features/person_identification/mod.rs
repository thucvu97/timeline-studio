pub mod commands;
pub mod database;
pub mod registry;
pub mod similarity;
pub mod types;

#[cfg(test)]
mod tests;

pub use database::PersonDatabase;
pub use registry::PersonIdentificationRegistry;
pub use types::*;
