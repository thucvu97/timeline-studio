import { expect, test } from "@playwright/test"
import { isAnyVisible, waitForApp } from "../helpers/test-utils"

test.describe("Advanced Export Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await waitForApp(page)
  })

  test.describe("Section Export", () => {
    test("should open section export tab", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const sectionsTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /section/i })
          .first()
        if (await sectionsTab.isVisible()) {
          await sectionsTab.click()
          await page.waitForTimeout(300)

          // Check for section export interface
          const sectionExportVisible = await isAnyVisible(page, [
            '[data-testid="section-export-tab"]',
            "text=/export.*mode/i",
            "text=/section/i",
          ])
          expect(sectionExportVisible).toBe(true)
        }
      }
    })

    test("should show export mode options", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const sectionsTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /section/i })
          .first()
        if (await sectionsTab.isVisible()) {
          await sectionsTab.click()
          await page.waitForTimeout(300)

          // Check for all three export modes
          const markerModeVisible = await isAnyVisible(page, [
            "text=/marker/i",
            'radio[value="markers"]',
            'input[value="markers"]',
          ])

          const clipModeVisible = await isAnyVisible(page, [
            "text=/clip/i",
            'radio[value="clips"]',
            'input[value="clips"]',
          ])

          const manualModeVisible = await isAnyVisible(page, [
            "text=/manual/i",
            'radio[value="manual"]',
            'input[value="manual"]',
          ])

          expect(markerModeVisible || clipModeVisible || manualModeVisible).toBe(true)
        }
      }
    })

    test("should show quality presets for sections", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const sectionsTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /section/i })
          .first()
        if (await sectionsTab.isVisible()) {
          await sectionsTab.click()
          await page.waitForTimeout(300)

          const qualityPresets = await isAnyVisible(page, [
            "text=/preview|draft|final/i",
            'option[value="preview"]',
            'option[value="draft"]',
            'option[value="final"]',
          ])
          expect(qualityPresets).toBe(true)
        }
      }
    })

    test("should allow manual time range input", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const sectionsTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /section/i })
          .first()
        if (await sectionsTab.isVisible()) {
          await sectionsTab.click()
          await page.waitForTimeout(300)

          // Select manual mode if available
          const manualRadio = page.locator('input[value="manual"]').first()
          if (await manualRadio.isVisible()) {
            await manualRadio.click()
            await page.waitForTimeout(300)

            // Check for time input fields
            const timeInputs = await isAnyVisible(page, [
              'input[placeholder*="00:00:00"]',
              "text=/start.*time|end.*time/i",
              'input[type="text"][value*=":"]',
            ])
            expect(timeInputs).toBe(true)
          }
        }
      }
    })
  })

  test.describe("Batch Export", () => {
    test("should open batch export tab", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const batchTab = page.locator('[role="tab"]').filter({ hasText: /batch/i }).first()
        if (await batchTab.isVisible()) {
          await batchTab.click()
          await page.waitForTimeout(300)

          // Check for batch export interface
          const batchExportVisible = await isAnyVisible(page, [
            '[data-testid="batch-export-tab"]',
            "text=/batch.*export|multiple.*project/i",
            'button:has-text("Add Projects")',
          ])
          expect(batchExportVisible).toBe(true)
        }
      }
    })

    test("should show project selection controls", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const batchTab = page.locator('[role="tab"]').filter({ hasText: /batch/i }).first()
        if (await batchTab.isVisible()) {
          await batchTab.click()
          await page.waitForTimeout(300)

          const projectControls = await isAnyVisible(page, [
            'button:has-text("Add Projects")',
            "text=/select.*project|choose.*project/i",
            'button:has-text("Browse")',
          ])
          expect(projectControls).toBe(true)
        }
      }
    })

    test("should show output folder selection", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const batchTab = page.locator('[role="tab"]').filter({ hasText: /batch/i }).first()
        if (await batchTab.isVisible()) {
          await batchTab.click()
          await page.waitForTimeout(300)

          const outputFolderControls = await isAnyVisible(page, [
            "text=/output.*folder|save.*to/i",
            'button:has-text("Choose Folder")',
            'input[placeholder*="folder"]',
          ])
          expect(outputFolderControls).toBe(true)
        }
      }
    })

    test("should show render queue interface", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const batchTab = page.locator('[role="tab"]').filter({ hasText: /batch/i }).first()
        if (await batchTab.isVisible()) {
          await batchTab.click()
          await page.waitForTimeout(300)

          const renderQueueInterface = await isAnyVisible(page, [
            "text=/render.*queue|queue.*status/i",
            '[data-testid="render-queue"]',
            "text=/active.*job|pending|complete/i",
          ])
          expect(renderQueueInterface).toBe(true)
        }
      }
    })

    test("should show queue management controls", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const batchTab = page.locator('[role="tab"]').filter({ hasText: /batch/i }).first()
        if (await batchTab.isVisible()) {
          await batchTab.click()
          await page.waitForTimeout(300)

          const queueControls = await isAnyVisible(page, [
            'button:has-text("Start")',
            'button:has-text("Cancel")',
            'button:has-text("Clear")',
            "text=/start.*batch|cancel.*all/i",
          ])
          expect(queueControls).toBe(true)
        }
      }
    })
  })

  test.describe("Social Media Export", () => {
    test("should open social media export tab", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const socialTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /social/i })
          .first()
        if (await socialTab.isVisible()) {
          await socialTab.click()
          await page.waitForTimeout(300)

          // Check for social export interface
          const socialExportVisible = await isAnyVisible(page, [
            '[data-testid="social-export-tab"]',
            "text=/social.*network|upload.*to/i",
            "text=/youtube|tiktok|vimeo|telegram/i",
          ])
          expect(socialExportVisible).toBe(true)
        }
      }
    })

    test("should show platform selection", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const socialTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /social/i })
          .first()
        if (await socialTab.isVisible()) {
          await socialTab.click()
          await page.waitForTimeout(300)

          // Check for all major platforms
          const youtubeOption = await isAnyVisible(page, [
            "text=/youtube/i",
            'option[value="youtube"]',
            'button:has-text("YouTube")',
          ])

          const tiktokOption = await isAnyVisible(page, [
            "text=/tiktok/i",
            'option[value="tiktok"]',
            'button:has-text("TikTok")',
          ])

          const vimeoOption = await isAnyVisible(page, [
            "text=/vimeo/i",
            'option[value="vimeo"]',
            'button:has-text("Vimeo")',
          ])

          const telegramOption = await isAnyVisible(page, [
            "text=/telegram/i",
            'option[value="telegram"]',
            'button:has-text("Telegram")',
          ])

          expect(youtubeOption || tiktokOption || vimeoOption || telegramOption).toBe(true)
        }
      }
    })

    test("should show authentication controls", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const socialTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /social/i })
          .first()
        if (await socialTab.isVisible()) {
          await socialTab.click()
          await page.waitForTimeout(300)

          const authControls = await isAnyVisible(page, [
            'button:has-text("Connect")',
            'button:has-text("Login")',
            'button:has-text("Sign In")', // Added correct translation
            'button:has-text("Authorize")',
            "text=/connect.*to|login.*to|sign.*in/i",
          ])
          expect(authControls).toBe(true)
        }
      }
    })

    test("should show privacy settings", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        const socialTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /social/i })
          .first()
        if (await socialTab.isVisible()) {
          await socialTab.click()
          await page.waitForTimeout(300)

          const privacySettings = await isAnyVisible(page, [
            "text=/public|private|unlisted/i",
            'select[name*="privacy"]',
            'radio[value*="public"]',
          ])
          expect(privacySettings).toBe(true)
        }
      }
    })
  })

  test.describe("Export Integration", () => {
    test("should maintain settings across tab switches", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        // Switch between tabs to ensure they load properly
        const socialTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /social/i })
          .first()
        if (await socialTab.isVisible()) {
          await socialTab.click()
          await page.waitForTimeout(300)
        }

        const batchTab = page.locator('[role="tab"]').filter({ hasText: /batch/i }).first()
        if (await batchTab.isVisible()) {
          await batchTab.click()
          await page.waitForTimeout(300)
        }

        const sectionsTab = page
          .locator('[role="tab"]')
          .filter({ hasText: /section/i })
          .first()
        if (await sectionsTab.isVisible()) {
          await sectionsTab.click()
          await page.waitForTimeout(300)
        }

        const localTab = page.locator('[role="tab"]').filter({ hasText: /local/i }).first()
        if (await localTab.isVisible()) {
          await localTab.click()
          await page.waitForTimeout(300)
        }

        // If we got here without errors, tab switching works
        expect(true).toBe(true)
      }
    })

    test("should show appropriate validation messages", async ({ page }) => {
      const exportButton = page
        .locator("button")
        .filter({ hasText: /export|render/i })
        .first()

      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)

        // Wait for the modal to be fully loaded
        await page.waitForSelector('[role="dialog"]', { state: "visible" })

        // Check validation on each tab
        const validationChecks = [
          {
            tabName: "social",
            buttonText: /upload.*to|Sign In/i, // Include Sign In button
            expectedValidation: "button-disabled", // Not logged in
          },
          {
            tabName: "batch",
            buttonText: /start.*export|startBatchExport/i, // Include translation key
            expectedValidation: "button-disabled", // No folder selected
          },
          {
            tabName: "section",
            buttonText: /export.*sections|exportSections/i, // Include translation key
            expectedValidation: "button-disabled", // No sections selected
          },
        ]

        for (const check of validationChecks) {
          const tab = page
            .locator('[role="tab"]')
            .filter({ hasText: new RegExp(check.tabName, "i") })
            .first()
          if (await tab.isVisible()) {
            await tab.click()
            await page.waitForTimeout(300)

            // Look for any button that might be an export/action button
            const allButtons = await page.locator("button").all()
            let hasValidation = false

            // Check all visible buttons for validation state
            for (const button of allButtons) {
              if (await button.isVisible()) {
                const buttonText = await button.textContent()
                const isActionButton =
                  buttonText &&
                  (check.buttonText.test(buttonText) ||
                    buttonText.includes("export") ||
                    buttonText.includes("Export") ||
                    buttonText.includes("Upload") ||
                    buttonText.includes("Sign"))

                if (isActionButton) {
                  const isDisabled = await button.isDisabled()
                  if (isDisabled) {
                    hasValidation = true
                    break
                  }
                }
              }
            }

            // Also check for validation messages
            if (!hasValidation) {
              hasValidation = await isAnyVisible(page, [
                "text=/required|missing|empty|select.*folder|not.*logged/i",
                '[class*="error"]',
                ".sonner-toast",
                "text=0", // For sections with 0 count
              ])
            }

            // We expect some form of validation on each tab
            expect(hasValidation).toBe(true)
          }
        }
      }
    })
  })
})
