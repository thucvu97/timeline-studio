#!/usr/bin/env node
/**
 * Timeline Studio ruv-swarm initialization
 */

import { spawn } from "child_process"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log("🔥 Initializing Timeline Studio Swarm (NO TIMEOUT VERSION)...")

const swarmProcess = spawn("npx", ["-y", "ruv-swarm"], {
  cwd: join(__dirname, ".."),
  stdio: "inherit",
  env: {
    ...process.env,
    SWARM_CONFIG: join(__dirname, "config.json"),
    SWARM_MODE: "timeline-studio",
    NO_TIMEOUT: "true",
  },
})

swarmProcess.on("close", (code) => {
  if (code === 0) {
    console.log("✅ Swarm initialized successfully")
  } else {
    console.error(`❌ Swarm initialization failed with code ${code}`)
  }
})
