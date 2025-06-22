//! Mock FFmpeg responses for testing

use std::collections::HashMap;

/// Мок ответы FFmpeg для различных команд
pub struct FFmpegMocks;

impl FFmpegMocks {
  /// Получить мок вывод для прогресса рендеринга
  pub fn get_render_progress_output() -> String {
    r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
  built with Apple clang version 14.0.0 (clang-1400.0.29.202)
  configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/5.1.2_6 --enable-shared --enable-pthreads
  libavutil      57. 28.100 / 57. 28.100
  libavcodec     59. 37.100 / 59. 37.100
  libavformat    59. 27.100 / 59. 27.100
  libavdevice    59.  7.100 / 59.  7.100
  libavfilter     8. 44.100 /  8. 44.100
  libswscale      6.  7.100 /  6.  7.100
  libswresample   4.  7.100 /  4.  7.100
  libpostproc    56.  6.100 / 56.  6.100
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':
  Metadata:
    major_brand     : mp42
    minor_version   : 0
    compatible_brands: mp42mp41isomavc1
    creation_time   : 2023-01-15T10:30:45.000000Z
  Duration: 00:02:30.00, start: 0.000000, bitrate: 5000 kb/s
  Stream #0:0[0x1](eng): Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709, progressive), 1920x1080 [SAR 1:1 DAR 16:9], 4800 kb/s, 30 fps, 30 tbr, 30k tbn (default)
    Metadata:
      creation_time   : 2023-01-15T10:30:45.000000Z
      handler_name    : ?Mainconcept Video Media Handler
      vendor_id       : [0][0][0][0]
      encoder         : AVC Coding
  Stream #0:1[0x2](eng): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 192 kb/s (default)
    Metadata:
      creation_time   : 2023-01-15T10:30:45.000000Z
      handler_name    : #Mainconcept MP4 Sound Media Handler
      vendor_id       : [0][0][0][0]
Stream mapping:
  Stream #0:0 -> #0:0 (h264 (native) -> h264 (libx264))
  Stream #0:1 -> #0:1 (aac (native) -> aac (native))
Press [q] to stop, [?] for help
frame=  100 fps=25.0 q=28.0 size=     512kB time=00:00:03.33 bitrate=1258.3kbits/s speed=0.83x    
frame=  200 fps=26.7 q=28.0 size=    1024kB time=00:00:06.67 bitrate=1258.3kbits/s speed=0.89x    
frame=  300 fps=27.3 q=28.0 size=    1536kB time=00:00:10.00 bitrate=1258.3kbits/s speed=0.91x    
frame=  400 fps=28.6 q=28.0 size=    2048kB time=00:00:13.33 bitrate=1258.3kbits/s speed=0.95x    
frame=  500 fps=29.4 q=28.0 size=    2560kB time=00:00:16.67 bitrate=1258.3kbits/s speed=0.98x    
frame=  600 fps=30.0 q=28.0 size=    3072kB time=00:00:20.00 bitrate=1258.3kbits/s speed=1.00x    
frame=  700 fps=30.4 q=28.0 size=    3584kB time=00:00:23.33 bitrate=1258.3kbits/s speed=1.01x    
frame=  800 fps=30.8 q=28.0 size=    4096kB time=00:00:26.67 bitrate=1258.3kbits/s speed=1.03x    
frame=  900 fps=31.0 q=28.0 size=    4608kB time=00:00:30.00 bitrate=1258.3kbits/s speed=1.03x    
frame= 1000 fps=31.3 q=28.0 size=    5120kB time=00:00:33.33 bitrate=1258.3kbits/s speed=1.04x    
frame= 1000 fps=31.3 q=-1.0 Lsize=    5632kB time=00:00:33.33 bitrate=1384.1kbits/s speed=1.04x    
video:5120kB audio:489kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: 0.415497%
[libx264 @ 0x7f8b1c604000] frame I:4     Avg QP:22.00  size: 38400
[libx264 @ 0x7f8b1c604000] frame P:996   Avg QP:28.00  size:  5120
[libx264 @ 0x7f8b1c604000] mb I  I16..4: 100.0%  0.0%  0.0%
[libx264 @ 0x7f8b1c604000] mb P  I16..4:  0.1%  0.2%  0.0%  P16..4: 24.9% 10.2%  4.6%  0.0%  0.0%    skip:60.0%
[libx264 @ 0x7f8b1c604000] 8x8 transform intra:0.2% inter:12.1%
[libx264 @ 0x7f8b1c604000] coded y,uvDC,uvAC intra: 22.2% 23.4% 2.3% inter: 7.8% 8.9% 0.1%
[libx264 @ 0x7f8b1c604000] i16 v,h,dc,p: 71% 17%  6%  6%
[libx264 @ 0x7f8b1c604000] i8 v,h,dc,ddl,ddr,vr,hd,vl,hu: 29% 17% 31%  3%  3%  4%  4%  5%  4%
[libx264 @ 0x7f8b1c604000] i4 v,h,dc,ddl,ddr,vr,hd,vl,hu: 32% 24% 16%  4%  5%  5%  5%  5%  4%
[libx264 @ 0x7f8b1c604000] i8c dc,h,v,p: 62% 17% 18%  3%
[libx264 @ 0x7f8b1c604000] Weighted P-Frames: Y:0.2% UV:0.1%
[libx264 @ 0x7f8b1c604000] ref P L0: 62.4% 37.6%
[libx264 @ 0x7f8b1c604000] kb/s:1230.72"#.to_string()
  }

  /// Получить мок вывод для генерации миниатюр
  pub fn get_thumbnails_output() -> String {
    r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':
  Duration: 00:01:00.00, start: 0.000000, bitrate: 5000 kb/s
Output #0, image2, to 'thumb_%03d.jpg':
  Stream #0:0: Video: mjpeg, yuvj420p(pc), 320x180 [SAR 1:1 DAR 16:9], q=2-31, 200 kb/s, 0.17 fps, 0.17 tbn
Stream mapping:
  Stream #0:0 -> #0:0 (h264 (native) -> mjpeg (native))
Press [q] to stop, [?] for help
frame=    1 fps=0.0 q=24.8 size=N/A time=00:00:06.00 bitrate=N/A speed=12.0x    
frame=    2 fps=2.0 q=24.8 size=N/A time=00:00:12.00 bitrate=N/A speed=12.0x    
frame=    3 fps=2.0 q=24.8 size=N/A time=00:00:18.00 bitrate=N/A speed=12.0x    
frame=    4 fps=2.0 q=24.8 size=N/A time=00:00:24.00 bitrate=N/A speed=12.0x    
frame=    5 fps=2.0 q=24.8 size=N/A time=00:00:30.00 bitrate=N/A speed=12.0x    
frame=    5 fps=2.0 q=24.8 Lsize=N/A time=00:00:30.00 bitrate=N/A speed=12.0x    
video:125kB audio:0kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: unknown"#.to_string()
  }

  /// Получить мок вывод для генерации waveform
  pub fn get_waveform_output() -> String {
    r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
Input #0, mp3, from 'audio.mp3':
  Duration: 00:03:45.00, start: 0.000000, bitrate: 192 kb/s
  Stream #0:0: Audio: mp3, 44100 Hz, stereo, fltp, 192 kb/s
Stream mapping:
  Stream #0:0 (mp3) -> showwavespic
  showwavespic -> Stream #0:0 (png)
Press [q] to stop, [?] for help
Output #0, image2, to 'waveform.png':
  Stream #0:0: Video: png, rgba, 1920x200 [SAR 1:1 DAR 48:5], q=2-31, 200 kb/s, 1 fps, 1 tbn
[Parsed_showwavespic_0 @ 0x7f8b1c604000] Processing audio frame
[Parsed_showwavespic_0 @ 0x7f8b1c604000] Creating waveform image
frame=    1 fps=0.0 q=-0.0 Lsize=N/A time=00:00:01.00 bitrate=N/A speed=2.00x    
video:48kB audio:0kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: unknown"#
      .to_string()
  }

  /// Получить мок вывод для probe
  pub fn get_probe_output() -> String {
    r#"{
    "streams": [
        {
            "index": 0,
            "codec_name": "h264",
            "codec_long_name": "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10",
            "profile": "High",
            "codec_type": "video",
            "codec_tag_string": "avc1",
            "codec_tag": "0x31637661",
            "width": 1920,
            "height": 1080,
            "coded_width": 1920,
            "coded_height": 1088,
            "closed_captions": 0,
            "film_grain": 0,
            "has_b_frames": 2,
            "sample_aspect_ratio": "1:1",
            "display_aspect_ratio": "16:9",
            "pix_fmt": "yuv420p",
            "level": 40,
            "chroma_location": "left",
            "field_order": "progressive",
            "refs": 1,
            "is_avc": "true",
            "nal_length_size": "4",
            "r_frame_rate": "30/1",
            "avg_frame_rate": "30/1",
            "time_base": "1/30000",
            "start_pts": 0,
            "start_time": "0.000000",
            "duration_ts": 90000,
            "duration": "3.000000",
            "bit_rate": "4800000",
            "bits_per_raw_sample": "8",
            "nb_frames": "90",
            "disposition": {
                "default": 1,
                "dub": 0,
                "original": 0,
                "comment": 0,
                "lyrics": 0,
                "karaoke": 0,
                "forced": 0,
                "hearing_impaired": 0,
                "visual_impaired": 0,
                "clean_effects": 0,
                "attached_pic": 0,
                "timed_thumbnails": 0,
                "captions": 0,
                "descriptions": 0,
                "metadata": 0,
                "dependent": 0,
                "still_image": 0
            },
            "tags": {
                "creation_time": "2023-01-15T10:30:45.000000Z",
                "language": "eng",
                "handler_name": "VideoHandler",
                "vendor_id": "[0][0][0][0]",
                "encoder": "Lavc59.37.100 libx264"
            }
        },
        {
            "index": 1,
            "codec_name": "aac",
            "codec_long_name": "AAC (Advanced Audio Coding)",
            "profile": "LC",
            "codec_type": "audio",
            "codec_tag_string": "mp4a",
            "codec_tag": "0x6134706d",
            "sample_fmt": "fltp",
            "sample_rate": "48000",
            "channels": 2,
            "channel_layout": "stereo",
            "bits_per_sample": 0,
            "r_frame_rate": "0/0",
            "avg_frame_rate": "0/0",
            "time_base": "1/48000",
            "start_pts": 0,
            "start_time": "0.000000",
            "duration_ts": 144000,
            "duration": "3.000000",
            "bit_rate": "192000",
            "nb_frames": "141",
            "disposition": {
                "default": 1,
                "dub": 0,
                "original": 0,
                "comment": 0,
                "lyrics": 0,
                "karaoke": 0,
                "forced": 0,
                "hearing_impaired": 0,
                "visual_impaired": 0,
                "clean_effects": 0,
                "attached_pic": 0,
                "timed_thumbnails": 0,
                "captions": 0,
                "descriptions": 0,
                "metadata": 0,
                "dependent": 0,
                "still_image": 0
            },
            "tags": {
                "creation_time": "2023-01-15T10:30:45.000000Z",
                "language": "eng",
                "handler_name": "SoundHandler",
                "vendor_id": "[0][0][0][0]"
            }
        }
    ],
    "format": {
        "filename": "input.mp4",
        "nb_streams": 2,
        "nb_programs": 0,
        "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
        "format_long_name": "QuickTime / MOV",
        "start_time": "0.000000",
        "duration": "3.000000",
        "size": "1800000",
        "bit_rate": "4800000",
        "probe_score": 100,
        "tags": {
            "major_brand": "isom",
            "minor_version": "512",
            "compatible_brands": "isomiso2avc1mp41",
            "creation_time": "2023-01-15T10:30:45.000000Z",
            "encoder": "Lavf59.27.100"
        }
    }
}"#
      .to_string()
  }

  /// Получить мок вывод для теста hardware acceleration
  #[allow(dead_code)]
  pub fn get_hwaccel_test_output() -> String {
    r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
Supported hardware acceleration methods:
videotoolbox
cuda
nvenc
vaapi
dxva2
qsv
d3d11va
opencl"#
      .to_string()
  }

  /// Получить мок ошибку FFmpeg
  pub fn get_error_output(error_type: &str) -> String {
    match error_type {
      "file_not_found" => r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'nonexistent.mp4':
nonexistent.mp4: No such file or directory"#
        .to_string(),

      "invalid_codec" => r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
Unknown encoder 'invalid_codec'"#
        .to_string(),

      "permission_denied" => r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
[NULL @ 0x7f8b1c604000] Unable to find a suitable output format for '/protected/output.mp4'
/protected/output.mp4: Permission denied"#
        .to_string(),

      "invalid_format" => r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x7f8b1c604000] moov atom not found
invalid.mp4: Invalid data found when processing input"#
        .to_string(),

      _ => r#"ffmpeg version 5.1.2 Copyright (c) 2000-2022 the FFmpeg developers
Error: Unknown error occurred"#
        .to_string(),
    }
  }

  /// Получить мок данные для различных типов медиа
  pub fn get_mock_media_data(media_type: &str) -> Vec<u8> {
    match media_type {
      "jpeg_thumbnail" => {
        // Минимальный валидный JPEG (1x1 черный пиксель)
        vec![
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
          0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
          0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B,
          0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
          0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31,
          0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF,
          0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00,
          0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B,
          0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05,
          0x04, 0x04, 0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21,
          0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
          0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0A,
          0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35, 0x36, 0x37,
          0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56,
          0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
          0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93,
          0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9,
          0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6,
          0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
          0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7,
          0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD0,
          0x03, 0xFF, 0xD9,
        ]
      }
      "png_waveform" => {
        // Минимальный валидный PNG (1x1 черный пиксель)
        vec![
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44,
          0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90,
          0x77, 0x53, 0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0x60,
          0x60, 0x60, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01, 0x5C, 0x0B, 0x4B, 0x00, 0x00, 0x00, 0x00,
          0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
        ]
      }
      "gif_preview" => {
        // Минимальный валидный GIF (1x1 черный пиксель)
        vec![
          0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0xF0, 0x00, 0x00, 0x00, 0x00,
          0x00, 0xFF, 0xFF, 0xFF, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
          0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B,
        ]
      }
      _ => vec![0; 1024], // Пустой буфер для неизвестных типов
    }
  }

  /// Создать карту прогресса для тестирования
  pub fn create_progress_map() -> HashMap<String, Vec<String>> {
    let mut map = HashMap::new();

    // Прогресс для обычного рендеринга
    map.insert("render".to_string(), vec![
            "frame=  100 fps=25.0 q=28.0 size=     512kB time=00:00:03.33 bitrate=1258.3kbits/s speed=0.83x".to_string(),
            "frame=  500 fps=29.4 q=28.0 size=    2560kB time=00:00:16.67 bitrate=1258.3kbits/s speed=0.98x".to_string(),
            "frame= 1000 fps=31.3 q=28.0 size=    5120kB time=00:00:33.33 bitrate=1258.3kbits/s speed=1.04x".to_string(),
        ]);

    // Прогресс для миниатюр
    map.insert(
      "thumbnails".to_string(),
      vec![
        "frame=    1 fps=0.0 q=24.8 size=N/A time=00:00:06.00 bitrate=N/A speed=12.0x".to_string(),
        "frame=    3 fps=2.0 q=24.8 size=N/A time=00:00:18.00 bitrate=N/A speed=12.0x".to_string(),
        "frame=    5 fps=2.0 q=24.8 size=N/A time=00:00:30.00 bitrate=N/A speed=12.0x".to_string(),
      ],
    );

    // Прогресс для конкатенации
    map.insert("concat".to_string(), vec![
            "frame=    0 fps=0.0 q=0.0 size=       0kB time=-577014:32:22.77 bitrate=  -0.0kbits/s speed=N/A".to_string(),
            "frame=  250 fps=125 q=28.0 size=    1280kB time=00:00:08.33 bitrate=1258.3kbits/s speed=4.17x".to_string(),
            "frame=  500 fps=125 q=28.0 size=    2560kB time=00:00:16.67 bitrate=1258.3kbits/s speed=4.17x".to_string(),
        ]);

    map
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_render_progress_output() {
    let output = FFmpegMocks::get_render_progress_output();
    assert!(output.contains("frame= 1000"));
    assert!(output.contains("speed=1.04x"));
    assert!(output.contains("[libx264 @"));
  }

  #[test]
  fn test_thumbnails_output() {
    let output = FFmpegMocks::get_thumbnails_output();
    assert!(output.contains("Output #0, image2"));
    assert!(output.contains("frame=    5"));
    assert!(output.contains("video:125kB"));
  }

  #[test]
  fn test_waveform_output() {
    let output = FFmpegMocks::get_waveform_output();
    assert!(output.contains("showwavespic"));
    assert!(output.contains("Video: png, rgba, 1920x200"));
    assert!(output.contains("video:48kB"));
  }

  #[test]
  fn test_probe_output() {
    let output = FFmpegMocks::get_probe_output();
    assert!(output.contains("\"codec_name\": \"h264\""));
    assert!(output.contains("\"width\": 1920"));
    assert!(output.contains("\"sample_rate\": \"48000\""));
  }

  #[test]
  fn test_error_outputs() {
    let file_not_found = FFmpegMocks::get_error_output("file_not_found");
    assert!(file_not_found.contains("No such file or directory"));

    let invalid_codec = FFmpegMocks::get_error_output("invalid_codec");
    assert!(invalid_codec.contains("Unknown encoder"));

    let permission_denied = FFmpegMocks::get_error_output("permission_denied");
    assert!(permission_denied.contains("Permission denied"));
  }

  #[test]
  fn test_mock_media_data() {
    let jpeg = FFmpegMocks::get_mock_media_data("jpeg_thumbnail");
    assert!(jpeg.starts_with(&[0xFF, 0xD8])); // JPEG header
    assert!(jpeg.ends_with(&[0xFF, 0xD9])); // JPEG footer

    let png = FFmpegMocks::get_mock_media_data("png_waveform");
    assert!(png.starts_with(&[0x89, 0x50, 0x4E, 0x47])); // PNG header

    let gif = FFmpegMocks::get_mock_media_data("gif_preview");
    assert!(gif.starts_with(&[0x47, 0x49, 0x46])); // GIF header
  }

  #[test]
  fn test_progress_map() {
    let map = FFmpegMocks::create_progress_map();

    assert!(map.contains_key("render"));
    assert!(map.contains_key("thumbnails"));
    assert!(map.contains_key("concat"));

    let render_progress = &map["render"];
    assert_eq!(render_progress.len(), 3);
    assert!(render_progress[0].contains("frame=  100"));
    assert!(render_progress[2].contains("frame= 1000"));
  }
}
