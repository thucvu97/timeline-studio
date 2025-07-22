/// Binary to generate TypeScript types using Specta
/// Run with: cargo run --bin generate_types
fn main() {
  println!("Generating TypeScript types...");

  // Call the export function
  timeline_studio_lib::specta_export::export_typescript_bindings();

  println!("TypeScript types generated successfully!");
}
