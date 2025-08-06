"""
Faster Whisper transcription service for Timeline Studio.
Provides high-performance speech recognition using CTranslate2 optimized models.
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass, asdict

try:
    from faster_whisper import WhisperModel, download_model
except ImportError:
    print("faster-whisper not installed. Please run: pip install faster-whisper", file=sys.stderr)
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class TranscriptionWord:
    """Word-level transcription data"""
    word: str
    start: float
    end: float
    probability: float


@dataclass
class TranscriptionSegment:
    """Segment of transcribed text with timing"""
    id: int
    start: float
    end: float
    text: str
    words: Optional[List[TranscriptionWord]] = None
    avg_logprob: float = 0.0
    compression_ratio: float = 0.0
    no_speech_prob: float = 0.0


@dataclass
class TranscriptionResult:
    """Complete transcription result"""
    segments: List[TranscriptionSegment]
    language: str
    language_probability: float
    duration: float
    text: str


class TranscriptionService:
    """
    Manages Faster Whisper model loading and transcription operations.
    Supports multiple model sizes and hardware acceleration.
    """
    
    # Available model sizes with their characteristics
    MODEL_SIZES = {
        "tiny": {"size": "39M", "params": "39M", "english_only": False},
        "tiny.en": {"size": "39M", "params": "39M", "english_only": True},
        "base": {"size": "74M", "params": "74M", "english_only": False},
        "base.en": {"size": "74M", "params": "74M", "english_only": True},
        "small": {"size": "244M", "params": "244M", "english_only": False},
        "small.en": {"size": "244M", "params": "244M", "english_only": True},
        "medium": {"size": "769M", "params": "769M", "english_only": False},
        "medium.en": {"size": "769M", "params": "769M", "english_only": True},
        "large-v1": {"size": "1550M", "params": "1550M", "english_only": False},
        "large-v2": {"size": "1550M", "params": "1550M", "english_only": False},
        "large-v3": {"size": "1550M", "params": "1550M", "english_only": False},
    }
    
    def __init__(self, 
                 model_size: str = "base", 
                 device: str = "auto",
                 compute_type: str = "auto",
                 num_workers: int = 1,
                 download_root: Optional[str] = None):
        """
        Initialize transcription service with specified model.
        
        Args:
            model_size: Size of the Whisper model to use
            device: Device to run on (auto, cpu, cuda, mps)
            compute_type: Computation type (auto, int8, float16, float32)
            num_workers: Number of parallel workers
            download_root: Directory to cache downloaded models
        """
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.num_workers = num_workers
        self.download_root = download_root or os.path.expanduser("~/.cache/whisper")
        self.model = None
        
        # Ensure download directory exists
        os.makedirs(self.download_root, exist_ok=True)
        
    def load_model(self) -> bool:
        """Load the Whisper model"""
        try:
            logger.info(f"Loading Whisper model: {self.model_size}")
            
            # Download model if needed
            model_path = download_model(
                self.model_size,
                output_dir=self.download_root,
                local_files_only=False
            )
            
            # Initialize model
            self.model = WhisperModel(
                model_path,
                device=self.device,
                compute_type=self.compute_type,
                num_workers=self.num_workers
            )
            
            logger.info(f"Model loaded successfully: {self.model_size}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            return False
    
    def transcribe(self,
                   audio_path: str,
                   language: Optional[str] = None,
                   task: str = "transcribe",
                   beam_size: int = 5,
                   best_of: int = 5,
                   patience: float = 1.0,
                   temperature: Union[float, List[float]] = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
                   compression_ratio_threshold: float = 2.4,
                   log_prob_threshold: float = -1.0,
                   no_speech_threshold: float = 0.6,
                   word_timestamps: bool = True,
                   prepend_punctuations: str = "\"'"¿([{-",
                   append_punctuations: str = "\"'.。,，!！?？:：")]}、",
                   vad_filter: bool = True,
                   vad_parameters: Optional[Dict] = None,
                   max_new_tokens: Optional[int] = None,
                   hotwords: Optional[str] = None,
                   **kwargs) -> Dict:
        """
        Transcribe audio file using Faster Whisper.
        
        Args:
            audio_path: Path to audio/video file
            language: Language code (e.g., 'en', 'ru') or None for auto-detection
            task: 'transcribe' or 'translate' (to English)
            beam_size: Beam search width
            best_of: Number of candidates to consider
            patience: Beam search patience factor
            temperature: Temperature for sampling
            compression_ratio_threshold: Threshold for filtering based on compression
            log_prob_threshold: Threshold for filtering based on log probability
            no_speech_threshold: Threshold for detecting silence
            word_timestamps: Generate word-level timestamps
            prepend_punctuations: Punctuations to merge with next word
            append_punctuations: Punctuations to merge with previous word
            vad_filter: Use voice activity detection filter
            vad_parameters: VAD parameters dict
            max_new_tokens: Maximum tokens per segment
            hotwords: Comma-separated list of words to boost
            
        Returns:
            Dictionary with transcription results
        """
        if not self.model:
            if not self.load_model():
                raise RuntimeError("Failed to load Whisper model")
        
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        try:
            logger.info(f"Starting transcription of: {audio_path}")
            
            # Set up VAD parameters
            if vad_filter and vad_parameters is None:
                vad_parameters = {
                    "threshold": 0.5,
                    "min_speech_duration_ms": 250,
                    "max_speech_duration_s": float('inf'),
                    "min_silence_duration_ms": 2000,
                    "window_size_samples": 1024,
                    "speech_pad_ms": 400
                }
            
            # Perform transcription
            segments, info = self.model.transcribe(
                audio_path,
                language=language,
                task=task,
                beam_size=beam_size,
                best_of=best_of,
                patience=patience,
                temperature=temperature,
                compression_ratio_threshold=compression_ratio_threshold,
                log_prob_threshold=log_prob_threshold,
                no_speech_threshold=no_speech_threshold,
                word_timestamps=word_timestamps,
                prepend_punctuations=prepend_punctuations,
                append_punctuations=append_punctuations,
                vad_filter=vad_filter,
                vad_parameters=vad_parameters,
                max_new_tokens=max_new_tokens,
                hotwords=hotwords,
                **kwargs
            )
            
            # Format results
            result_segments = []
            full_text = []
            
            for i, segment in enumerate(segments):
                # Extract words if available
                words = None
                if word_timestamps and hasattr(segment, 'words'):
                    words = [
                        TranscriptionWord(
                            word=w.word,
                            start=w.start,
                            end=w.end,
                            probability=w.probability
                        )
                        for w in segment.words
                    ]
                
                # Create segment
                seg = TranscriptionSegment(
                    id=i,
                    start=segment.start,
                    end=segment.end,
                    text=segment.text.strip(),
                    words=words,
                    avg_logprob=segment.avg_logprob,
                    compression_ratio=segment.compression_ratio,
                    no_speech_prob=segment.no_speech_prob
                )
                
                result_segments.append(seg)
                full_text.append(segment.text.strip())
            
            # Calculate duration
            duration = result_segments[-1].end if result_segments else 0.0
            
            # Create result
            result = TranscriptionResult(
                segments=result_segments,
                language=info.language,
                language_probability=info.language_probability,
                duration=duration,
                text=" ".join(full_text)
            )
            
            logger.info(f"Transcription completed: {len(result_segments)} segments, {duration:.1f}s duration")
            
            # Convert to dict for JSON serialization
            return self._result_to_dict(result)
            
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            raise
    
    def _result_to_dict(self, result: TranscriptionResult) -> Dict:
        """Convert TranscriptionResult to dictionary"""
        return {
            "segments": [
                {
                    "id": seg.id,
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text,
                    "words": [asdict(w) for w in seg.words] if seg.words else None,
                    "avg_logprob": seg.avg_logprob,
                    "compression_ratio": seg.compression_ratio,
                    "no_speech_prob": seg.no_speech_prob
                }
                for seg in result.segments
            ],
            "language": result.language,
            "language_probability": result.language_probability,
            "duration": result.duration,
            "text": result.text
        }
    
    def get_available_models(self) -> List[Dict[str, any]]:
        """Get list of available models with their info"""
        models = []
        for name, info in self.MODEL_SIZES.items():
            model_path = os.path.join(self.download_root, name)
            models.append({
                "name": name,
                "size": info["size"],
                "params": info["params"],
                "english_only": info["english_only"],
                "is_downloaded": os.path.exists(model_path)
            })
        return models
    
    def download_model_with_progress(self, model_size: str, progress_callback=None):
        """Download model with progress reporting"""
        try:
            logger.info(f"Downloading model: {model_size}")
            
            # Download with progress tracking
            model_path = download_model(
                model_size,
                output_dir=self.download_root,
                local_files_only=False
            )
            
            logger.info(f"Model downloaded: {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"Model download failed: {str(e)}")
            return False


# CLI interface for testing
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Transcribe audio using Faster Whisper")
    parser.add_argument("audio_file", help="Path to audio/video file")
    parser.add_argument("--model", default="base", help="Model size (tiny, base, small, medium, large)")
    parser.add_argument("--language", help="Language code (e.g., en, ru)")
    parser.add_argument("--device", default="auto", help="Device (auto, cpu, cuda, mps)")
    parser.add_argument("--task", default="transcribe", help="Task (transcribe, translate)")
    parser.add_argument("--output", help="Output file path")
    parser.add_argument("--format", default="json", help="Output format (json, srt, vtt, txt)")
    
    args = parser.parse_args()
    
    # Create service
    service = TranscriptionService(
        model_size=args.model,
        device=args.device
    )
    
    # Transcribe
    try:
        result = service.transcribe(
            args.audio_file,
            language=args.language,
            task=args.task
        )
        
        # Output result
        if args.format == "json":
            output = json.dumps(result, indent=2, ensure_ascii=False)
        elif args.format == "txt":
            output = result["text"]
        elif args.format == "srt":
            output = ""
            for i, seg in enumerate(result["segments"]):
                output += f"{i+1}\n"
                output += f"{format_srt_time(seg['start'])} --> {format_srt_time(seg['end'])}\n"
                output += f"{seg['text']}\n\n"
        elif args.format == "vtt":
            output = "WEBVTT\n\n"
            for seg in result["segments"]:
                output += f"{format_vtt_time(seg['start'])} --> {format_vtt_time(seg['end'])}\n"
                output += f"{seg['text']}\n\n"
        else:
            output = str(result)
        
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output)
            print(f"Output written to: {args.output}")
        else:
            print(output)
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


def format_srt_time(seconds: float) -> str:
    """Format time for SRT subtitles"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_vtt_time(seconds: float) -> str:
    """Format time for WebVTT subtitles"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"