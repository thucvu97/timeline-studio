/**
 * Hook for working with Timeline clips
 */

import { useMemo } from "react";

import { MediaFile } from "@/features/media/types/media";
import {
  canPlaceClipOnTrack,
  findClipById,
  findNearestClip,
  getAllClips,
  getClipsInTimeRange,
} from "@/lib/timeline/utils";

import { useTimeline } from "../timeline-provider";
import { TimelineClip, TrackType } from "../types";

export interface UseClipsReturn {
  // Данные
  clips: TimelineClip[];
  selectedClips: TimelineClip[];
  clipsByTrack: Record<string, TimelineClip[]>;

  // Поиск и фильтрация
  findClip: (clipId: string) => TimelineClip | null;
  getClipsByTrack: (trackId: string) => TimelineClip[];
  getClipsInRange: (startTime: number, endTime: number) => TimelineClip[];
  getClipsByType: (trackType: TrackType) => TimelineClip[];
  findNearestClipToTime: (
    time: number,
    trackType?: TrackType,
  ) => TimelineClip | null;

  // Действия с клипами
  addClip: (
    trackId: string,
    mediaFile: MediaFile,
    startTime: number,
    duration?: number,
  ) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  splitClip: (clipId: string, splitTime: number) => void;
  trimClip: (clipId: string, newStartTime: number, newDuration: number) => void;
  duplicateClip: (clipId: string, targetTrackId?: string) => void;

  // Выделение
  selectClip: (clipId: string, addToSelection?: boolean) => void;
  selectMultipleClips: (clipIds: string[]) => void;
  selectClipsInArea: (
    startTime: number,
    endTime: number,
    trackIds: string[],
  ) => void;
  clearClipSelection: () => void;

  // Управление свойствами клипов
  setClipVolume: (clipId: string, volume: number) => void;
  setClipSpeed: (clipId: string, speed: number) => void;
  setClipOpacity: (clipId: string, opacity: number) => void;
  toggleClipReverse: (clipId: string) => void;
  setClipPosition: (
    clipId: string,
    position: { x: number; y: number; width: number; height: number },
  ) => void;

  // Валидация и проверки
  canPlaceClip: (
    trackId: string,
    startTime: number,
    duration: number,
    excludeClipId?: string,
  ) => boolean;
  getClipConflicts: (
    trackId: string,
    startTime: number,
    duration: number,
    excludeClipId?: string,
  ) => TimelineClip[];
  isClipSelected: (clipId: string) => boolean;

  // Утилиты
  getClipAtTime: (trackId: string, time: number) => TimelineClip | null;
  getClipStats: () => {
    totalClips: number;
    totalDuration: number;
    selectedCount: number;
    clipsByType: Record<TrackType, number>;
  };
}

export function useClips(): UseClipsReturn {
  const {
    project,
    uiState,
    addClip,
    removeClip,
    updateClip,
    moveClip,
    splitClip,
    trimClip,
    selectClips,
    clearSelection,
  } = useTimeline();

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const clips = useMemo(() => {
    if (!project) return [];
    return getAllClips(project);
  }, [project]);

  const selectedClips = useMemo(() => {
    return clips.filter((clip) => uiState.selectedClipIds.includes(clip.id));
  }, [clips, uiState.selectedClipIds]);

  const clipsByTrack = useMemo(() => {
    return clips.reduce<Record<string, TimelineClip[]>>((acc, clip) => {
      if (!acc[clip.trackId]) {
        acc[clip.trackId] = [];
      }
      acc[clip.trackId].push(clip);
      return acc;
    }, {});
  }, [clips]);

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  const findClip = useMemo(
    () => (clipId: string) => {
      if (!project) return null;
      return findClipById(project, clipId);
    },
    [project],
  );

  const getClipsByTrack = useMemo(
    () => (trackId: string) => {
      return clips.filter((clip) => clip.trackId === trackId);
    },
    [clips],
  );

  const getClipsInRange = useMemo(
    () => (startTime: number, endTime: number) => {
      if (!project) return [];
      return getClipsInTimeRange(project, startTime, endTime);
    },
    [project],
  );

  const getClipsByType = useMemo(
    () => (trackType: TrackType) => {
      if (!project) return [];

      // Получаем все треки указанного типа
      const tracks = project.sections
        .flatMap((s) => s.tracks)
        .concat(project.globalTracks)
        .filter((track) => track.type === trackType);

      // Получаем все клипы с этих треков
      return tracks.flatMap((track) => track.clips);
    },
    [project],
  );

  const findNearestClipToTime = useMemo(
    () => (time: number, trackType?: TrackType) => {
      if (!project) return null;
      return findNearestClip(project, time, trackType);
    },
    [project],
  );

  // ============================================================================
  // CLIP ACTIONS
  // ============================================================================

  const duplicateClip = (clipId: string, targetTrackId?: string) => {
    const clip = findClip(clipId);
    if (!clip || !clip.mediaFile) return;

    const trackId = targetTrackId || clip.trackId;
    const startTime = clip.startTime + clip.duration + 1; // Размещаем после оригинала

    addClip(trackId, clip.mediaFile, startTime, clip.duration);
  };

  // ============================================================================
  // SELECTION MANAGEMENT
  // ============================================================================

  const selectClip = (clipId: string, addToSelection = false) => {
    if (addToSelection) {
      const currentSelection = uiState.selectedClipIds;
      const newSelection = currentSelection.includes(clipId)
        ? currentSelection.filter((id) => id !== clipId)
        : [...currentSelection, clipId];
      selectClips(newSelection);
    } else {
      selectClips([clipId]);
    }
  };

  const selectMultipleClips = (clipIds: string[]) => {
    selectClips(clipIds);
  };

  const selectClipsInArea = (
    startTime: number,
    endTime: number,
    trackIds: string[],
  ) => {
    const clipsInArea = clips.filter((clip) => {
      if (!trackIds.includes(clip.trackId)) return false;

      const clipEndTime = clip.startTime + clip.duration;
      return !(clipEndTime <= startTime || clip.startTime >= endTime);
    });

    selectClips(clipsInArea.map((clip) => clip.id));
  };

  const clearClipSelection = () => {
    clearSelection();
  };

  // ============================================================================
  // CLIP PROPERTIES
  // ============================================================================

  const setClipVolume = (clipId: string, volume: number) => {
    updateClip(clipId, { volume: Math.max(0, Math.min(1, volume)) });
  };

  const setClipSpeed = (clipId: string, speed: number) => {
    updateClip(clipId, { speed: Math.max(0.1, Math.min(10, speed)) });
  };

  const setClipOpacity = (clipId: string, opacity: number) => {
    updateClip(clipId, { opacity: Math.max(0, Math.min(1, opacity)) });
  };

  const toggleClipReverse = (clipId: string) => {
    const clip = findClip(clipId);
    if (clip) {
      updateClip(clipId, { isReversed: !clip.isReversed });
    }
  };

  const setClipPosition = (
    clipId: string,
    position: { x: number; y: number; width: number; height: number },
  ) => {
    updateClip(clipId, {
      position: {
        x: Math.max(0, Math.min(1, position.x)),
        y: Math.max(0, Math.min(1, position.y)),
        width: Math.max(0, Math.min(1, position.width)),
        height: Math.max(0, Math.min(1, position.height)),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
    });
  };

  // ============================================================================
  // VALIDATION AND CHECKS
  // ============================================================================

  const canPlaceClip = (
    trackId: string,
    startTime: number,
    duration: number,
    excludeClipId?: string,
  ): boolean => {
    if (!project) return false;

    // Находим трек
    const allTracks = project.sections
      .flatMap((s) => s.tracks)
      .concat(project.globalTracks);
    const track = allTracks.find((t) => t.id === trackId);

    if (!track) return false;

    return canPlaceClipOnTrack(track, startTime, duration, excludeClipId);
  };

  const getClipConflicts = (
    trackId: string,
    startTime: number,
    duration: number,
    excludeClipId?: string,
  ): TimelineClip[] => {
    const trackClips = getClipsByTrack(trackId);
    const endTime = startTime + duration;

    return trackClips.filter((clip) => {
      if (excludeClipId && clip.id === excludeClipId) return false;

      const clipEndTime = clip.startTime + clip.duration;
      return !(endTime <= clip.startTime || startTime >= clipEndTime);
    });
  };

  const isClipSelected = (clipId: string): boolean => {
    return uiState.selectedClipIds.includes(clipId);
  };

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const getClipAtTime = (
    trackId: string,
    time: number,
  ): TimelineClip | null => {
    const trackClips = getClipsByTrack(trackId);
    return (
      trackClips.find(
        (clip) =>
          time >= clip.startTime && time <= clip.startTime + clip.duration,
      ) || null
    );
  };

  const getClipStats = () => {
    const totalClips = clips.length;
    const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
    const selectedCount = selectedClips.length;

    const clipsByType: Record<TrackType, number> = {
      video: 0,
      audio: 0,
      image: 0,
      title: 0,
      subtitle: 0,
      music: 0,
      voiceover: 0,
      sfx: 0,
      ambient: 0,
    };

    // Подсчитываем клипы по типам треков
    if (project) {
      const allTracks = project.sections
        .flatMap((s) => s.tracks)
        .concat(project.globalTracks);
      clips.forEach((clip) => {
        const track = allTracks.find((t) => t.id === clip.trackId);
        if (track) {
          clipsByType[track.type]++;
        }
      });
    }

    return { totalClips, totalDuration, selectedCount, clipsByType };
  };

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    // Данные
    clips,
    selectedClips,
    clipsByTrack,

    // Поиск и фильтрация
    findClip,
    getClipsByTrack,
    getClipsInRange,
    getClipsByType,
    findNearestClipToTime,

    // Действия с клипами
    addClip,
    removeClip,
    updateClip,
    moveClip,
    splitClip,
    trimClip,
    duplicateClip,

    // Выделение
    selectClip,
    selectMultipleClips,
    selectClipsInArea,
    clearClipSelection,

    // Управление свойствами клипов
    setClipVolume,
    setClipSpeed,
    setClipOpacity,
    toggleClipReverse,
    setClipPosition,

    // Валидация и проверки
    canPlaceClip,
    getClipConflicts,
    isClipSelected,

    // Утилиты
    getClipAtTime,
    getClipStats,
  };
}
