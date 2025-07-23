/// Simple binary to export TypeScript types
/// Run with: cargo run --bin export_types
fn main() {
  println!("Exporting TypeScript types...");

  match timeline_studio_lib::types_export::export_types() {
    Ok(typescript_code) => {
      // Write to file
      let path = "../src/types/generated/state-types.ts";
      std::fs::create_dir_all("../src/types/generated").ok();

      match std::fs::write(path, typescript_code) {
        Ok(_) => println!("Types exported successfully to {path}"),
        Err(e) => eprintln!("Failed to write file: {e}"),
      }
    }
    Err(e) => eprintln!("Failed to export types: {e}"),
  }
}
