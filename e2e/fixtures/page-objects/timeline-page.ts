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
    
    // Основные элементы таймлайна
    this.timeline = page.locator('[data-testid="timeline"]');
    this.playButton = page.locator('[data-testid="play-button"]');
    this.pauseButton = page.locator('[data-testid="pause-button"]');
    this.zoomSlider = page.locator('[data-testid="zoom-slider"]');
    this.timeIndicator = page.locator('[data-testid="time-indicator"]');
    this.tracks = page.locator('[data-testid="timeline-track"]');
    this.clips = page.locator('[data-testid="timeline-clip"]');
    this.playhead = page.locator('[data-testid="playhead"]');
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