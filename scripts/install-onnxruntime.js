#!/usr/bin/env node

/**
 * Install script for onnxruntime-node with retry logic and fallback
 * This handles network timeouts and connection issues
 */

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

function log(message) {
  console.log(`[onnxruntime-install] ${message}`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function tryInstall(attempt) {
  log(`Attempt ${attempt} of ${MAX_RETRIES} to install onnxruntime-node...`)

  try {
    // Set longer timeout
    execSync("npm install onnxruntime-node@1.22.0 --no-save --no-audit --no-fund", {
      stdio: "inherit",
      env: {
        ...process.env,
        npm_config_fetch_timeout: "600000",
        npm_config_fetch_retries: "5",
        ONNXRUNTIME_DOWNLOAD_TIMEOUT: "600000",
      },
    })

    log("✅ onnxruntime-node installed successfully!")
    return true
  } catch (error) {
    log(`❌ Installation failed: ${error.message}`)

    if (attempt < MAX_RETRIES) {
      log(`Waiting ${RETRY_DELAY / 1000} seconds before retry...`)
      await sleep(RETRY_DELAY)
    }

    return false
  }
}

async function installWithFallback() {
  // Check if already installed
  try {
    require.resolve("onnxruntime-node")
    log("onnxruntime-node is already installed")
    return
  } catch (e) {
    // Not installed, continue
  }

  // Try to install with retries
  for (let i = 1; i <= MAX_RETRIES; i++) {
    if (await tryInstall(i)) {
      return
    }
  }

  // If all attempts fail, create a mock file to allow build to continue
  log("⚠️  All installation attempts failed. Creating mock to allow build to continue...")

  const mockDir = path.join(process.cwd(), "node_modules", "onnxruntime-node")
  fs.mkdirSync(mockDir, { recursive: true })

  const mockContent = `
// Mock onnxruntime-node module
// This is a placeholder to allow the build to continue when the real module fails to install
module.exports = {
  InferenceSession: class InferenceSession {
    static async create() {
      console.warn('Using mock onnxruntime-node - AI features will not work');
      return new InferenceSession();
    }
    async run() {
      return {};
    }
    async dispose() {}
  }
};
`

  fs.writeFileSync(path.join(mockDir, "index.js"), mockContent)
  fs.writeFileSync(
    path.join(mockDir, "package.json"),
    JSON.stringify(
      {
        name: "onnxruntime-node",
        version: "1.22.0-mock",
        main: "index.js",
      },
      null,
      2,
    ),
  )

  log("✅ Mock onnxruntime-node created. Build can continue, but AI features will be disabled.")
}

// Run the installation
if (require.main === module) {
  installWithFallback().catch((error) => {
    console.error("Failed to install onnxruntime-node:", error)
    process.exit(1)
  })
}

module.exports = { installWithFallback }
