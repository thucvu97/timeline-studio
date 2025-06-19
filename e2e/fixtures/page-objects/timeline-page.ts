import { Page, Locator } from '@playwright/test';

export class TimelinePage {
  readonly page: Page;
  readonly timeline: Locator;
  readonly playButton: Locator;
  readonly pauseButton: Locator;
  readonly zoomSlider: Locator;
  readonly timeIndicator: Locator;
  readonly tracks: Locator;
  readonly clips: Locator;
  readonly playhead: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Основные элементы таймлайна - используем гибкие селекторы
    this.timeline = page.locator('[data-testid="timeline"], [class*="timeline"]').first();
    this.playButton = page.locator('[data-testid="play-button"], button:has-text("▶"), button[aria-label*="play" i]').first();
    this.pauseButton = page.locator('[data-testid="pause-button"], button:has-text("⏸"), button[aria-label*="pause" i]').first();
    this.zoomSlider = page.locator('[data-testid="zoom-slider"], input[type="range"], [class*="zoom"]').first();
    this.timeIndicator = page.locator('[data-testid="time-indicator"], [class*="time"], text=/\\d{1,2}:\\d{2}/').first();
    this.tracks = page.locator('[data-testid="timeline-track"], [class*="track"], [class*="layer"]');
    this.clips = page.locator('[data-testid="timeline-clip"], [class*="clip"], [class*="segment"]');
    this.playhead = page.locator('[data-testid="playhead"], [class*="playhead"], [class*="cursor"]').first();
  }

  async addClipToTimeline(mediaItemSelector: Locator, trackIndex: number = 0) {
    // Перетаскиваем медиа элемент на таймлайн
    const track = this.tracks.nth(trackIndex);
    await mediaItemSelector.dragTo(track);
  }

  async play() {
    await this.playButton.click();
  }

  async pause() {
    await this.pauseButton.click();
  }

  async setZoom(value: number) {
    // Устанавливаем значение зума
    await this.zoomSlider.fill(value.toString());
  }

  async getClipCount() {
    return this.clips.count();
  }

  async selectClip(index: number) {
    await this.clips.nth(index).click();
  }

  async deleteSelectedClip() {
    await this.page.keyboard.press('Delete');
  }

  async splitClipAtPlayhead() {
    await this.page.keyboard.press('s');
  }

  async movePlayhead(timeInSeconds: number) {
    // Кликаем на нужную позицию на таймлайне
    const timelineBox = await this.timeline.boundingBox();
    if (timelineBox) {
      const x = timelineBox.x + (timeInSeconds * 100); // Примерный расчет
      const y = timelineBox.y + timelineBox.height / 2;
      await this.page.mouse.click(x, y);
    }
  }
}