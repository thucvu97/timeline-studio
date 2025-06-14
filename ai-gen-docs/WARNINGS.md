   = note: `RenderPipeline` has a derived impl for the trait `Debug`, but this is intentionally ignored during dead code analysis

warning: methods `cancel` and `get_statistics` are never used
   --> src/video_compiler/pipeline.rs:200:16
    |
37  | impl RenderPipeline {
    | ------------------- methods in this implementation
...
200 |   pub async fn cancel(&mut self) -> Result<()> {
    |                ^^^^^^
...
207 |   pub fn get_statistics(&self) -> PipelineStatistics {
    |          ^^^^^^^^^^^^^^

warning: field `user_data` is never read
   --> src/video_compiler/pipeline.rs:226:7
    |
214 | pub struct PipelineContext {
    |            --------------- field in this struct
...
226 |   pub user_data: HashMap<String, serde_json::Value>,
    |       ^^^^^^^^^
    |
    = note: `PipelineContext` has a derived impl for the trait `Debug`, but this is intentionally ignored during dead code analysis

warning: method `get_intermediate_file` is never used
   --> src/video_compiler/pipeline.rs:259:10
    |
233 | impl PipelineContext {
    | -------------------- method in this implementation
...
259 |   pub fn get_intermediate_file(&self, key: &str) -> Option<&PathBuf> {
    |          ^^^^^^^^^^^^^^^^^^^^^

warning: methods `estimated_duration` and `can_skip` are never used
   --> src/video_compiler/pipeline.rs:299:6
    |
291 | pub trait PipelineStage: Send + Sync + std::fmt::Debug {
    |           ------------- methods in this trait
...
299 |   fn estimated_duration(&self) -> Duration {
    |      ^^^^^^^^^^^^^^^^^^
...
304 |   fn can_skip(&self, _context: &PipelineContext) -> bool {
    |      ^^^^^^^^

warning: method `build_video_composition_command` is never used
   --> src/video_compiler/pipeline.rs:673:6
    |
613 | impl CompositionStage {
    | --------------------- method in this implementation
...
673 |   fn build_video_composition_command(
    |      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: methods `add_error` and `add_warning` are never used
    --> src/video_compiler/pipeline.rs:1200:10
     |
1189 | impl PipelineStatistics {
     | ----------------------- methods in this implementation
...
1200 |   pub fn add_error(&mut self) {
     |          ^^^^^^^^^
...
1205 |   pub fn add_warning(&mut self) {
     |          ^^^^^^^^^^^

warning: associated items `with_settings`, `set_ffmpeg_path`, `generate_preview_batch`, `generate_timeline_previews`, and `clear_cache_for_file` are never used
   --> src/video_compiler/preview.rs:41:10
    |
30  | impl PreviewGenerator {
    | --------------------- associated items in this implementation
...
41  |   pub fn with_settings(cache: Arc<RwLock<RenderCache>>, settings: PreviewSettings) -> Self {
    |          ^^^^^^^^^^^^^
...
50  |   pub fn set_ffmpeg_path<P: AsRef<Path>>(&mut self, path: P) {
    |          ^^^^^^^^^^^^^^^
...
152 |   pub async fn generate_preview_batch(
    |                ^^^^^^^^^^^^^^^^^^^^^^
...
208 |   pub async fn generate_timeline_previews(
    |                ^^^^^^^^^^^^^^^^^^^^^^^^^^
...
240 |   pub async fn clear_cache_for_file(&self) -> Result<()> {
    |                ^^^^^^^^^^^^^^^^^^^^

warning: fields `timeline_resolution`, `timeline_quality`, `timeout_seconds`, and `hardware_acceleration` are never read
   --> src/video_compiler/preview.rs:500:7
    |
492 | pub struct PreviewSettings {
    |            --------------- fields in this struct
...
500 |   pub timeline_resolution: (u32, u32),
    |       ^^^^^^^^^^^^^^^^^^^
501 |   /// Качество для timeline превью
502 |   pub timeline_quality: u8,
    |       ^^^^^^^^^^^^^^^^
...
506 |   pub timeout_seconds: u64,
    |       ^^^^^^^^^^^^^^^
507 |   /// Использовать аппаратное ускорение
508 |   pub hardware_acceleration: bool,
    |       ^^^^^^^^^^^^^^^^^^^^^
    |
    = note: `PreviewSettings` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: field `timestamp` is never read
   --> src/video_compiler/preview.rs:552:7
    |
550 | pub struct PreviewResult {
    |            ------------- field in this struct
551 |   /// Временная метка
552 |   pub timestamp: f64,
    |       ^^^^^^^^^
    |
    = note: `PreviewResult` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: struct `TimelinePreview` is never constructed
   --> src/video_compiler/preview.rs:570:12
    |
570 | pub struct TimelinePreview {
    |            ^^^^^^^^^^^^^^^
    |
    = note: `TimelinePreview` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: field `settings` is never read
  --> src/video_compiler/progress.rs:22:3
   |
16 | pub struct ProgressTracker {
   |            --------------- field in this struct
...
22 |   settings: ProgressSettings,
   |   ^^^^^^^^
   |
   = note: `ProgressTracker` has a derived impl for the trait `Debug`, but this is intentionally ignored during dead code analysis

warning: methods `get_job`, `parse_ffmpeg_progress`, and `parse_progress_line` are never used
   --> src/video_compiler/progress.rs:178:16
    |
25  | impl ProgressTracker {
    | -------------------- methods in this implementation
...
178 |   pub async fn get_job(&self, job_id: &str) -> Option<RenderJob> {
    |                ^^^^^^^
...
190 |   pub fn parse_ffmpeg_progress(&self, output: &str) -> Option<FFmpegProgress> {
    |          ^^^^^^^^^^^^^^^^^^^^^
...
201 |   fn parse_progress_line(&self, line: &str) -> Option<FFmpegProgress> {
    |      ^^^^^^^^^^^^^^^^^^^

warning: method `start` is never used
   --> src/video_compiler/progress.rs:330:10
    |
310 | impl RenderJob {
    | -------------- method in this implementation
...
330 |   pub fn start(&mut self) -> Result<()> {
    |          ^^^^^

warning: fields `update_interval`, `max_concurrent_jobs`, and `job_timeout` are never read
   --> src/video_compiler/progress.rs:527:7
    |
525 | pub struct ProgressSettings {
    |            ---------------- fields in this struct
526 |   /// Интервал обновления прогресса
527 |   pub update_interval: Duration,
    |       ^^^^^^^^^^^^^^^
528 |   /// Максимальное количество активных задач
529 |   pub max_concurrent_jobs: usize,
    |       ^^^^^^^^^^^^^^^^^^^
530 |   /// Таймаут для задач
531 |   pub job_timeout: Duration,
    |       ^^^^^^^^^^^
    |
    = note: `ProgressSettings` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: multiple fields are never read
   --> src/video_compiler/progress.rs:548:7
    |
546 | pub struct FFmpegProgress {
    |            -------------- fields in this struct
547 |   /// Номер кадра
548 |   pub frame: u64,
    |       ^^^^^
549 |   /// FPS
550 |   pub fps: f32,
    |       ^^^
551 |   /// Качество
552 |   pub quality: f32,
    |       ^^^^^^^
553 |   /// Размер выходного файла
554 |   pub size: u64,
    |       ^^^^
555 |   /// Время обработки
556 |   pub time: Duration,
    |       ^^^^
557 |   /// Битрейт
558 |   pub bitrate: f32,
    |       ^^^^^^^
559 |   /// Скорость обработки
560 |   pub speed: f32,
    |       ^^^^^
    |
    = note: `FFmpegProgress` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: function `parse_size` is never used
   --> src/video_compiler/progress.rs:564:4
    |
564 | fn parse_size(size_str: &str) -> u64 {
    |    ^^^^^^^^^^

warning: function `parse_time` is never used
   --> src/video_compiler/progress.rs:578:4
    |
578 | fn parse_time(time_str: &str) -> Duration {
    |    ^^^^^^^^^^

warning: function `parse_bitrate` is never used
   --> src/video_compiler/progress.rs:593:4
    |
593 | fn parse_bitrate(bitrate_str: &str) -> f32 {
    |    ^^^^^^^^^^^^^

warning: field `cache` is never read
  --> src/video_compiler/renderer.rs:29:3
   |
23 | pub struct VideoRenderer {
   |            ------------- field in this struct
...
29 |   cache: Arc<RwLock<RenderCache>>,
   |   ^^^^^
   |
   = note: `VideoRenderer` has a derived impl for the trait `Debug`, but this is intentionally ignored during dead code analysis

warning: methods `render_with_details` and `get_current_memory_usage` are never used
   --> src/video_compiler/renderer.rs:241:16
    |
36  | impl VideoRenderer {
    | ------------------ methods in this implementation
...
241 |   pub async fn render_with_details(&mut self, output_path: &Path) -> DetailedResult<String> {
    |                ^^^^^^^^^^^^^^^^^^^
...
285 |   fn get_current_memory_usage(&self) -> u64 {
    |      ^^^^^^^^^^^^^^^^^^^^^^^^

warning: associated items `new` and `touch` are never used
   --> src/video_compiler/schema.rs:40:10
    |
38  | impl ProjectSchema {
    | ------------------ associated items in this implementation
39  |   /// Создать новый пустой проект
40  |   pub fn new(name: String) -> Self {
    |          ^^^
...
114 |   pub fn touch(&mut self) {
    |          ^^^^^

warning: associated items `new` and `add_clip` are never used
   --> src/video_compiler/schema.rs:197:10
    |
195 | impl Track {
    | ---------- associated items in this implementation
196 |   /// Создать новый трек
197 |   pub fn new(track_type: TrackType, name: String) -> Self {
    |          ^^^
...
229 |   pub fn add_clip(&mut self, clip: Clip) -> Result<(), String> {
    |          ^^^^^^^^

warning: associated function `new` is never used
   --> src/video_compiler/schema.rs:293:10
    |
291 | impl Clip {
    | --------- associated function in this implementation
292 |   /// Создать новый клип
293 |   pub fn new(source_path: PathBuf, start_time: f64, duration: f64) -> Self {
    |          ^^^

warning: associated function `new` is never used
   --> src/video_compiler/schema.rs:407:10
    |
405 | impl Effect {
    | ----------- associated function in this implementation
406 |   /// Создать новый эффект
407 |   pub fn new(effect_type: EffectType, name: String) -> Self {
    |          ^^^

warning: associated function `new` is never used
   --> src/video_compiler/schema.rs:632:10
    |
630 | impl Filter {
    | ----------- associated function in this implementation
631 |   /// Создать новый фильтр
632 |   pub fn new(filter_type: FilterType, name: String) -> Self {
    |          ^^^

warning: associated function `new` is never used
   --> src/video_compiler/schema.rs:704:10
    |
702 | impl Template {
    | ------------- associated function in this implementation
703 |   /// Создать новый шаблон
704 |   pub fn new(template_type: TemplateType, name: String, screens: usize) -> Self {
    |          ^^^

warning: associated function `new` is never used
   --> src/video_compiler/schema.rs:805:10
    |
803 | impl StyleTemplate {
    | ------------------ associated function in this implementation
804 |   /// Создать новый стильный шаблон
805 |   pub fn new(
    |          ^^^

warning: associated items `new`, `validate`, and `get_duration` are never used
    --> src/video_compiler/schema.rs:1488:10
     |
1486 | impl Subtitle {
     | ------------- associated items in this implementation
1487 |   /// Создать новый субтитр
1488 |   pub fn new(text: String, start_time: f64, end_time: f64) -> Self {
     |          ^^^
...
1502 |   pub fn validate(&self) -> Result<(), String> {
     |          ^^^^^^^^
...
1519 |   pub fn get_duration(&self) -> f64 {
     |          ^^^^^^^^^^^^

warning: associated function `new` is never used
    --> src/video_compiler/schema.rs:1722:10
     |
1720 | impl SubtitleAnimation {
     | ---------------------- associated function in this implementation
1721 |   /// Создать новую анимацию субтитра
1722 |   pub fn new(animation_type: SubtitleAnimationType, duration: f64) -> Self {
     |          ^^^

warning: method `process_batch` is never used
   --> src/recognition/recognition_service.rs:261:16
    |
31  | impl RecognitionService {
    | ----------------------- method in this implementation
...
261 |   pub async fn process_batch(
    |                ^^^^^^^^^^^^^

warning: fields `model_path` and `model_type` are never read
  --> src/recognition/yolo_processor.rs:80:3
   |
76 | pub struct YoloProcessor {
   |            ------------- fields in this struct
...
80 |   model_path: PathBuf,
   |   ^^^^^^^^^^
81 |   /// Тип модели
82 |   model_type: YoloModel,
   |   ^^^^^^^^^^

warning: methods `load_model`, `set_target_classes`, `process_batch`, `mock_process_image`, and `get_class_names` are never used
   --> src/recognition/yolo_processor.rs:117:16
    |
91  | impl YoloProcessor {
    | ------------------ methods in this implementation
...
117 |   pub async fn load_model(&mut self) -> Result<()> {
    |                ^^^^^^^^^^
...
143 |   pub fn set_target_classes(&mut self, classes: Vec<String>) {
    |          ^^^^^^^^^^^^^^^^^^
...
371 |   pub async fn process_batch(&mut self, image_paths: Vec<PathBuf>) -> Result<Vec<Vec<Detect...
    |                ^^^^^^^^^^^^^
...
383 |   fn mock_process_image(&self, image: &DynamicImage) -> Vec<Detection> {
    |      ^^^^^^^^^^^^^^^^^^
...
537 |   pub fn get_class_names(&self) -> Vec<String> {
    |          ^^^^^^^^^^^^^^^

warning: redundant pattern matching, consider using `is_ok()`
   --> src/video_compiler/commands.rs:501:16
    |
501 |         if let Ok(_) = fs::remove_file(&path).await {
    |         -------^^^^^------------------------------- help: try: `if (fs::remove_file(&path).await).is_ok()`
    |
    = note: this will change drop order of the result, as well as all temporaries
    = note: add `#[allow(clippy::redundant_pattern_matching)]` if this is important
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#redundant_pattern_matching
    = note: `-D clippy::redundant-pattern-matching` implied by `-D warnings`
    = help: to override `-D warnings` add `#[allow(clippy::redundant_pattern_matching)]`

warning: name `AMF` contains a capitalized acronym
  --> src/video_compiler/gpu.rs:28:3
   |
28 |   AMF,
   |   ^^^ help: consider making the acronym lowercase, except the initial letter: `Amf`
   |
   = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#upper_case_acronyms
   = note: `-D clippy::upper-case-acronyms` implied by `-D warnings`
   = help: to override `-D warnings` add `#[allow(clippy::upper_case_acronyms)]`

warning: all variants have the same prefix: `Processing`
   --> src/recognition/recognition_service.rs:288:1
    |
288 | / pub enum RecognitionEvent {
289 | |   /// Начало обработки
290 | |   ProcessingStarted { file_id: String },
...   |
306 | |   ProcessingError { file_id: String, error: String },
307 | | }
    | |_^
    |
    = help: remove the prefixes and use full paths to the variants instead of glob imports
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#enum_variant_names
    = note: `-D clippy::enum-variant-names` implied by `-D warnings`
    = help: to override `-D warnings` add `#[allow(clippy::enum_variant_names)]`

warning: this operation will always return zero. This is likely not the intended outcome
   --> src/recognition/yolo_processor.rs:248:21
    |
248 |       let cx = data[0 * output_shape[1] as usize * output_shape[2] as usize
    |                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#erasing_op
    = note: `#[warn(clippy::erasing_op)]` on by default

warning: this operation will always return zero. This is likely not the intended outcome
   --> src/recognition/yolo_processor.rs:249:11
    |
249 |         + 0 * output_shape[2] as usize
    |           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#erasing_op

warning: this operation will always return zero. This is likely not the intended outcome
   --> src/recognition/yolo_processor.rs:253:10
    |
253 | ...   [0 * output_shape[1] as usize * output_shape[2] as usize + (output_shape[2] as usize)...
    |        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#erasing_op

warning: this operation will always return zero. This is likely not the intended outcome
   --> src/recognition/yolo_processor.rs:255:20
    |
255 |       let w = data[0 * output_shape[1] as usize * output_shape[2] as usize
    |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#erasing_op

warning: this operation will always return zero. This is likely not the intended outcome
   --> src/recognition/yolo_processor.rs:259:20
    |
259 |       let h = data[0 * output_shape[1] as usize * output_shape[2] as usize
    |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#erasing_op

warning: this operation will always return zero. This is likely not the intended outcome
   --> src/recognition/yolo_processor.rs:269:25
    |
269 |         let conf = data[0 * output_shape[1] as usize * output_shape[2] as usize
    |                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#erasing_op

warning: `timeline-studio` (lib) generated 63 warnings
warning: fields `path`, `format_name`, `fps`, `video_bit_rate`, `audio_bit_rate`, and `is_360` are never read
  --> src/media/test_data.rs:11:9
   |
9  |   pub struct TestMediaFile {
   |              ------------- fields in this struct
10 |     pub filename: &'static str,
11 |     pub path: PathBuf,
   |         ^^^^
12 |     pub format_name: &'static str,
   |         ^^^^^^^^^^^
...
22 |     pub fps: Option<&'static str>,
   |         ^^^
23 |     pub video_bit_rate: u64,
   |         ^^^^^^^^^^^^^^
...
30 |     pub audio_bit_rate: u64,
   |         ^^^^^^^^^^^^^^
...
33 |     pub is_360: bool,
   |         ^^^^^^
   |
   = note: `TestMediaFile` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: function `get_test_image` is never used
   --> src/media/test_data.rs:244:10
    |
244 |   pub fn get_test_image() -> &'static TestMediaFile {
    |          ^^^^^^^^^^^^^^

warning: function `get_longest_video` is never used
   --> src/media/test_data.rs:256:10
    |
256 |   pub fn get_longest_video() -> &'static TestMediaFile {
    |          ^^^^^^^^^^^^^^^^^

warning: variants `RenderProgress`, `RenderCompleted`, `RenderFailed`, `PreviewGenerated`, and `CacheUpdated` are never constructed
  --> src/video_compiler/mod.rs:70:3
   |
66 | pub enum VideoCompilerEvent {
   |          ------------------ variants in this enum
...
70 |   RenderProgress {
   |   ^^^^^^^^^^^^^^
...
75 |   RenderCompleted { job_id: String, output_path: String },
   |   ^^^^^^^^^^^^^^^
76 |   /// Рендеринг завершился с ошибкой
77 |   RenderFailed { job_id: String, error: String },
   |   ^^^^^^^^^^^^
78 |   /// Превью сгенерировано
79 |   PreviewGenerated { timestamp: f64, image_data: Vec<u8> },
   |   ^^^^^^^^^^^^^^^^
80 |   /// Кэш обновлен
81 |   CacheUpdated { cache_size_mb: f64 },
   |   ^^^^^^^^^^^^
   |
   = note: `VideoCompilerEvent` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: fields `cache_key`, `output_path`, and `file_size` are never read
   --> src/video_compiler/cache.rs:280:7
    |
278 | pub struct RenderCacheData {
    |            --------------- fields in this struct
279 |   /// Ключ кэша
280 |   pub cache_key: String,
    |       ^^^^^^^^^
281 |   /// Путь к результирующему файлу
282 |   pub output_path: PathBuf,
    |       ^^^^^^^^^^^
...
288 |   pub file_size: u64,
    |       ^^^^^^^^^
    |
    = note: `RenderCacheData` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: methods `build_video_effect_filter` and `build_color_correction_filter` are never used
    --> src/video_compiler/ffmpeg_builder.rs:1131:12
     |
27   | impl FFmpegBuilder {
     | ------------------ methods in this implementation
...
1131 |   async fn build_video_effect_filter(&self, effect: &Effect) -> Result<String> {
     |            ^^^^^^^^^^^^^^^^^^^^^^^^^
...
1165 |   async fn build_color_correction_filter(&self, effect: &Effect) -> Result<String> {
     |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: fields `start_time` and `duration` are never read
    --> src/video_compiler/ffmpeg_builder.rs:2315:7
     |
2311 | pub struct InputSource {
     |            ----------- fields in this struct
...
2315 |   pub start_time: f64,
     |       ^^^^^^^^^^
2316 |   /// Длительность
2317 |   pub duration: f64,
     |       ^^^^^^^^
     |
     = note: `InputSource` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: field `cache` is never read
   --> src/video_compiler/frame_extraction.rs:114:3
    |
110 | pub struct FrameExtractionManager {
    |            ---------------------- field in this struct
...
114 |   cache: Arc<RwLock<RenderCache>>,
    |   ^^^^^

warning: method `get_statistics` is never used
   --> src/video_compiler/pipeline.rs:207:10
    |
37  | impl RenderPipeline {
    | ------------------- method in this implementation
...
207 |   pub fn get_statistics(&self) -> PipelineStatistics {
    |          ^^^^^^^^^^^^^^

warning: methods `set_ffmpeg_path`, `generate_preview_batch`, and `clear_cache_for_file` are never used
   --> src/video_compiler/preview.rs:50:10
    |
30  | impl PreviewGenerator {
    | --------------------- methods in this implementation
...
50  |   pub fn set_ffmpeg_path<P: AsRef<Path>>(&mut self, path: P) {
    |          ^^^^^^^^^^^^^^^
...
152 |   pub async fn generate_preview_batch(
    |                ^^^^^^^^^^^^^^^^^^^^^^
...
240 |   pub async fn clear_cache_for_file(&self) -> Result<()> {
    |                ^^^^^^^^^^^^^^^^^^^^

warning: fields `timeout_seconds` and `hardware_acceleration` are never read
   --> src/video_compiler/preview.rs:506:7
    |
492 | pub struct PreviewSettings {
    |            --------------- fields in this struct
...
506 |   pub timeout_seconds: u64,
    |       ^^^^^^^^^^^^^^^
507 |   /// Использовать аппаратное ускорение
508 |   pub hardware_acceleration: bool,
    |       ^^^^^^^^^^^^^^^^^^^^^
    |
    = note: `PreviewSettings` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: fields `timestamp` and `image_data` are never read
   --> src/video_compiler/preview.rs:572:7
    |
570 | pub struct TimelinePreview {
    |            --------------- fields in this struct
571 |   /// Временная метка
572 |   pub timestamp: f64,
    |       ^^^^^^^^^
573 |   /// Данные изображения (None если ошибка)
574 |   pub image_data: Option<Vec<u8>>,
    |       ^^^^^^^^^^
    |
    = note: `TimelinePreview` has derived impls for the traits `Clone` and `Debug`, but these are intentionally ignored during dead code analysis

warning: method `get_job` is never used
   --> src/video_compiler/progress.rs:178:16
    |
25  | impl ProgressTracker {
    | -------------------- method in this implementation
...
178 |   pub async fn get_job(&self, job_id: &str) -> Option<RenderJob> {
    |                ^^^^^^^

warning: method `touch` is never used
   --> src/video_compiler/schema.rs:114:10
    |
38  | impl ProjectSchema {
    | ------------------ method in this implementation
...
114 |   pub fn touch(&mut self) {
    |          ^^^^^

warning: method `add_clip` is never used
   --> src/video_compiler/schema.rs:229:10
    |
195 | impl Track {
    | ---------- method in this implementation
...
229 |   pub fn add_clip(&mut self, clip: Clip) -> Result<(), String> {
    |          ^^^^^^^^

warning: field `model_type` is never read
  --> src/recognition/yolo_processor.rs:82:3
   |
76 | pub struct YoloProcessor {
   |            ------------- field in this struct
...
82 |   model_type: YoloModel,
   |   ^^^^^^^^^^

warning: methods `mock_process_image` and `get_class_names` are never used
   --> src/recognition/yolo_processor.rs:383:6
    |
91  | impl YoloProcessor {
    | ------------------ methods in this implementation
...
383 |   fn mock_process_image(&self, image: &DynamicImage) -> Vec<Detection> {
    |      ^^^^^^^^^^^^^^^^^^
...
537 |   pub fn get_class_names(&self) -> Vec<String> {
    |          ^^^^^^^^^^^^^^^

warning: function `extract_frames_for_recognition` is never used
  --> src/recognition/real_data_tests.rs:20:12
   |
20 |   async fn extract_frames_for_recognition(
   |            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: module has the same name as its containing module
   --> src/media/tests.rs:2:1
    |
2   | / mod tests {
3   | |   use crate::media::types::{MediaFile, ProbeData};
4   | |   use crate::{get_media_files, get_media_metadata};
5   | |   use tempfile::TempDir;
...   |
132 | | }
    | |_^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#module_inception
    = note: `-D clippy::module-inception` implied by `-D warnings`
    = help: to override `-D warnings` add `#[allow(clippy::module_inception)]`

warning: module has the same name as its containing module
   --> src/media/test_data.rs:5:1
    |
5   | / pub mod test_data {
6   | |   use std::path::PathBuf;
7   | |
8   | |   #[derive(Debug, Clone)]
...   |
262 | | }
    | |_^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#module_inception

warning: module has the same name as its containing module
   --> src/media/real_data_tests.rs:4:1
    |
4   | / mod real_data_tests {
5   | |   use super::super::metadata::extract_metadata;
6   | |   use super::super::test_data::test_data::*;
7   | |   use super::super::thumbnail::generate_thumbnail;
...   |
661 | | }
    | |_^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#module_inception

warning: module has the same name as its containing module
   --> src/video_compiler/commands/tests.rs:2:1
    |
2   | / mod tests {
3   | |   use crate::video_compiler::{
4   | |     commands::*,
5   | |     progress::{RenderProgress, RenderStatus},
...   |
701 | | }
    | |_^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#module_inception

warning: this comparison involving the minimum or maximum element for this type contains a case that is always true or always false
   --> src/video_compiler/commands/tests.rs:141:13
    |
141 |     assert!(info.total_size >= 0);
    |             ^^^^^^^^^^^^^^^^^^^^
    |
    = help: because `0` is the minimum value for this type, this comparison is always true
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#absurd_extreme_comparisons
    = note: `#[warn(clippy::absurd_extreme_comparisons)]` on by default

warning: this comparison involving the minimum or maximum element for this type contains a case that is always true or always false
   --> src/video_compiler/commands/tests.rs:150:13
    |
150 |     assert!(deleted_size >= 0);
    |             ^^^^^^^^^^^^^^^^^
    |
    = help: because `0` is the minimum value for this type, this comparison is always true
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#absurd_extreme_comparisons

warning: this boolean expression contains a logic bug
   --> src/video_compiler/commands/tests.rs:507:13
    |
507 |     assert!(hw_enabled || !hw_enabled); // Either value is valid
    |             ^^^^^^^^^^^^^^^^^^^^^^^^^ help: it would look like the following: `true`
    |
help: this expression can be optimized out by applying boolean operations to the outer expression
   --> src/video_compiler/commands/tests.rs:507:13
    |
507 |     assert!(hw_enabled || !hw_enabled); // Either value is valid
    |             ^^^^^^^^^^
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#overly_complex_bool_expr
    = note: `#[warn(clippy::overly_complex_bool_expr)]` on by default

warning: this comparison involving the minimum or maximum element for this type contains a case that is always true or always false
   --> src/video_compiler/commands/tests.rs:689:13
    |
689 |     assert!(info.total_size >= 0);
    |             ^^^^^^^^^^^^^^^^^^^^
    |
    = help: because `0` is the minimum value for this type, this comparison is always true
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#absurd_extreme_comparisons

warning: this comparison involving the minimum or maximum element for this type contains a case that is always true or always false
   --> src/video_compiler/commands/tests.rs:699:13
    |
699 |     assert!(deleted_size >= 0);
    |             ^^^^^^^^^^^^^^^^^
    |
    = help: because `0` is the minimum value for this type, this comparison is always true
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#absurd_extreme_comparisons

warning: approximate value of `f{32, 64}::consts::PI` found
    --> src/video_compiler/ffmpeg_builder.rs:2427:41
     |
2427 |     let effect = create_vignette_effect(3.14);
     |                                         ^^^^
     |
     = help: consider using the constant directly
     = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#approx_constant
     = note: `#[warn(clippy::approx_constant)]` on by default

warning: field assignment outside of initializer for an instance created with Default::default()
    --> src/video_compiler/ffmpeg_builder.rs:2476:5
     |
2476 |     settings.ffmpeg_path = "/custom/path/ffmpeg".to_string();
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     |
note: consider initializing the variable with `video_compiler::ffmpeg_builder::FFmpegBuilderSettings { ffmpeg_path: "/custom/path/ffmpeg".to_string(), threads: Some(8), prefer_nvenc: false, prefer_quicksync: true, global_args: vec!["-hide_banner".to_string()] }` and removing relevant reassignments
    --> src/video_compiler/ffmpeg_builder.rs:2475:5
     |
2475 |     let mut settings = FFmpegBuilderSettings::default();
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#field_reassign_with_default
     = note: `-D clippy::field-reassign-with-default` implied by `-D warnings`
     = help: to override `-D warnings` add `#[allow(clippy::field_reassign_with_default)]`

warning: field assignment outside of initializer for an instance created with Default::default()
    --> src/video_compiler/ffmpeg_builder.rs:2775:5
     |
2775 |     settings.prefer_nvenc = true;
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     |
note: consider initializing the variable with `video_compiler::ffmpeg_builder::FFmpegBuilderSettings { prefer_nvenc: true, ..Default::default() }` and removing relevant reassignments
    --> src/video_compiler/ffmpeg_builder.rs:2774:5
     |
2774 |     let mut settings = FFmpegBuilderSettings::default();
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#field_reassign_with_default

warning: field assignment outside of initializer for an instance created with Default::default()
    --> src/video_compiler/ffmpeg_builder.rs:2790:5
     |
2790 |     settings.threads = Some(4);
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^
     |
note: consider initializing the variable with `video_compiler::ffmpeg_builder::FFmpegBuilderSettings { threads: Some(4), global_args: vec![
            "-hide_banner".to_string(),
            "-loglevel".to_string(),
            "error".to_string(),
          ], ..Default::default() }` and removing relevant reassignments
    --> src/video_compiler/ffmpeg_builder.rs:2789:5
     |
2789 |     let mut settings = FFmpegBuilderSettings::default();
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#field_reassign_with_default

warning: field assignment outside of initializer for an instance created with Default::default()
   --> src/video_compiler/preview.rs:694:5
    |
694 |     settings.format = PreviewFormat::Jpeg;
    |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    |
note: consider initializing the variable with `video_compiler::preview::PreviewSettings { format: PreviewFormat::Jpeg, ..Default::default() }` and removing relevant reassignments
   --> src/video_compiler/preview.rs:692:5
    |
692 |     let mut settings = PreviewSettings::default();
    |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#field_reassign_with_default

warning: module has the same name as its containing module
   --> src/video_server/tests.rs:2:1
    |
2   | / mod tests {
3   | |   use super::super::*;
4   | |   use axum::body::Body;
5   | |   use axum::http::{Request, StatusCode};
...   |
205 | | }
    | |_^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#module_inception

warning: module has the same name as its containing module
   --> src/recognition/tests.rs:2:1
    |
2   | / mod tests {
3   | |   use crate::media::preview_data::DetectedObject;
4   | |   use crate::recognition::recognition_service::RecognitionService;
5   | |   use crate::recognition::yolo_processor::{YoloModel, YoloProcessor};
...   |
335 | | }
    | |_^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#module_inception

warning: `assert!(true)` will be optimized out by the compiler
  --> src/recognition/tests.rs:45:5
   |
45 |     assert!(true); // Заглушка
   |     ^^^^^^^^^^^^^
   |
   = help: remove it
   = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#assertions_on_constants
   = note: `-D clippy::assertions-on-constants` implied by `-D warnings`
   = help: to override `-D warnings` add `#[allow(clippy::assertions_on_constants)]`

warning: `assert!(true)` will be optimized out by the compiler
  --> src/recognition/tests.rs:61:5
   |
61 |     assert!(true); // Заглушка
   |     ^^^^^^^^^^^^^
   |
   = help: remove it
   = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#assertions_on_constants

warning: module has the same name as its containing module
   --> src/recognition/real_data_tests.rs:2:1
    |
2   | / mod real_data_tests {
3   | |   use crate::media::preview_data::{DetectedObject, RecognitionResults};
4   | |   use crate::recognition::recognition_service::RecognitionService;
5   | |   use crate::recognition::yolo_processor::{YoloModel, YoloProcessor};
...   |
447 | | }
    | |_^
    |
    = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#module_inception

warning: writing `&PathBuf` instead of `&Path` involves a new object where a slice will do
  --> src/recognition/real_data_tests.rs:22:17
   |
22 |     output_dir: &PathBuf,
   |                 ^^^^^^^^ help: change this to: `&Path`
   |
   = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#ptr_arg
   = note: `-D clippy::ptr-arg` implied by `-D warnings`
   = help: to override `-D warnings` add `#[allow(clippy::ptr_arg)]`

warning: comparison is useless due to type limits
   --> src/video_compiler/commands/tests.rs:141:13
    |
141 |     assert!(info.total_size >= 0);
    |             ^^^^^^^^^^^^^^^^^^^^
    |
    = note: `-D unused-comparisons` implied by `-D warnings`
    = help: to override `-D warnings` add `#[allow(unused_comparisons)]`

warning: comparison is useless due to type limits
   --> src/video_compiler/commands/tests.rs:150:13
    |
150 |     assert!(deleted_size >= 0);
    |             ^^^^^^^^^^^^^^^^^

warning: comparison is useless due to type limits
   --> src/video_compiler/commands/tests.rs:689:13
    |
689 |     assert!(info.total_size >= 0);
    |             ^^^^^^^^^^^^^^^^^^^^

warning: comparison is useless due to type limits
   --> src/video_compiler/commands/tests.rs:699:13
    |
699 |     assert!(deleted_size >= 0);
    |             ^^^^^^^^^^^^^^^^^

warning: unused `std::result::Result` that must be used
    --> src/video_compiler/ffmpeg_builder.rs:2780:5
     |
2780 |     builder.add_hardware_acceleration(&mut cmd).await;
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     |
     = note: this `Result` may be an `Err` variant, which should be handled
     = note: `-D unused-must-use` implied by `-D warnings`
     = help: to override `-D warnings` add `#[allow(unused_must_use)]`
help: use `let _ = ...` to ignore the resulting value
     |
2780 |     let _ = builder.add_hardware_acceleration(&mut cmd).await;
     |     +++++++

warning: `timeline-studio` (lib test) generated 73 warnings (30 duplicates)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1m 26s
⋊> ~/A/timeline-studio on main ⨯                                                            02:55:52