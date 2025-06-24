// Test script to check Tauri API availability
// Run this in the browser console of the Tauri app

async function testTauriAPI() {
  console.log("=== Testing Tauri API ===");
  
  // Test 1: Check if Tauri is available
  console.log("1. Checking Tauri availability:");
  if (typeof window.__TAURI__ !== 'undefined') {
    console.log("✅ Tauri is available");
  } else {
    console.error("❌ Tauri is NOT available");
    return;
  }
  
  // Test 2: Check fs plugin
  console.log("\n2. Checking fs plugin:");
  try {
    const fs = await import("@tauri-apps/plugin-fs");
    console.log("✅ fs plugin loaded:", Object.keys(fs).join(", "));
  } catch (error) {
    console.error("❌ fs plugin error:", error);
  }
  
  // Test 3: Check dialog plugin
  console.log("\n3. Checking dialog plugin:");
  try {
    const dialog = await import("@tauri-apps/plugin-dialog");
    console.log("✅ dialog plugin loaded:", Object.keys(dialog).join(", "));
  } catch (error) {
    console.error("❌ dialog plugin error:", error);
  }
  
  // Test 4: Test a simple command
  console.log("\n4. Testing greet command:");
  try {
    const { invoke } = await import("@tauri-apps/api/primitives");
    const result = await invoke("greet");
    console.log("✅ greet command result:", result);
  } catch (error) {
    console.error("❌ greet command error:", error);
  }
  
  // Test 5: Test file system operation
  console.log("\n5. Testing file system operation:");
  try {
    const { readDir, BaseDirectory } = await import("@tauri-apps/plugin-fs");
    const files = await readDir(".", { baseDir: BaseDirectory.AppConfig });
    console.log("✅ AppConfig directory contents:", files.length, "items");
  } catch (error) {
    console.error("❌ File system error:", error);
  }
  
  console.log("\n=== Test Complete ===");
}

// Run the test
testTauriAPI();