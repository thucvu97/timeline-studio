//! Test binary for Specta TypeScript generation
//! Run with: cargo run --bin test_specta

use timeline_studio_lib::specta_export;

fn main() {
  println!("Testing Specta TypeScript generation...");

  // This will create TypeScript bindings in debug mode
  specta_export::export_typescript_bindings();

  println!("Test completed!");
}
