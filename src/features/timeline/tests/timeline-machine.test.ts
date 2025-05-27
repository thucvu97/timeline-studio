/**
 * Tests for Timeline Machine v2
 */

import { beforeEach, describe, expect, it } from "vitest";
import { createActor } from "xstate";

import { createTimelineProject } from "@/types/timeline";

import { timelineMachine } from "../services/timeline-machine";

describe("Timeline Machine", () => {
  let actor: any;

  beforeEach(() => {
    actor = createActor(timelineMachine);
    actor.start();
  });

  describe("Initial State", () => {
    it("should start in idle state", () => {
      expect(actor.getSnapshot().value).toBe("idle");
    });

    it("should have null project initially", () => {
      expect(actor.getSnapshot().context.project).toBeNull();
    });

    it("should not be playing initially", () => {
      expect(actor.getSnapshot().context.isPlaying).toBe(false);
    });
  });

  describe("Project Management", () => {
    it("should create a new project", () => {
      actor.send({ type: "CREATE_PROJECT", name: "Test Project" });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("ready");
      expect(snapshot.context.project).not.toBeNull();
      expect(snapshot.context.project?.name).toBe("Test Project");
      expect(snapshot.context.lastAction).toBe("CREATE_PROJECT");
    });

    it("should load an existing project", () => {
      const project = createTimelineProject("Loaded Project");
      actor.send({ type: "LOAD_PROJECT", project });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("ready");
      expect(snapshot.context.project).toBe(project);
      expect(snapshot.context.lastAction).toBe("LOAD_PROJECT");
    });

    it("should close project and return to idle", () => {
      // Сначала создаем проект
      actor.send({ type: "CREATE_PROJECT", name: "Test Project" });
      expect(actor.getSnapshot().value).toBe("ready");

      // Затем закрываем
      actor.send({ type: "CLOSE_PROJECT" });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("idle");
      expect(snapshot.context.project).toBeNull();
      expect(snapshot.context.isPlaying).toBe(false);
      expect(snapshot.context.currentTime).toBe(0);
    });
  });

  describe("Section Management", () => {
    beforeEach(() => {
      actor.send({ type: "CREATE_PROJECT", name: "Test Project" });
    });

    it("should add a section to project", () => {
      actor.send({
        type: "ADD_SECTION",
        name: "Morning",
        startTime: 0,
        duration: 300,
      });

      const snapshot = actor.getSnapshot();
      const project = snapshot.context.project;

      expect(project?.sections).toHaveLength(1);
      expect(project?.sections[0].name).toBe("Morning");
      expect(project?.sections[0].startTime).toBe(0);
      expect(project?.sections[0].duration).toBe(300);
      expect(project?.sections[0].endTime).toBe(300);
    });

    it("should not add section without project", () => {
      actor.send({ type: "CLOSE_PROJECT" });
      actor.send({
        type: "ADD_SECTION",
        name: "Test",
        startTime: 0,
        duration: 100,
      });

      // Событие должно быть проигнорировано
      expect(actor.getSnapshot().value).toBe("idle");
    });
  });

  describe("Track Management", () => {
    beforeEach(() => {
      actor.send({ type: "CREATE_PROJECT", name: "Test Project" });
      actor.send({
        type: "ADD_SECTION",
        name: "Test Section",
        startTime: 0,
        duration: 300,
      });
    });

    it("should add track to section", () => {
      const sectionId = actor.getSnapshot().context.project?.sections[0].id;

      actor.send({
        type: "ADD_TRACK",
        trackType: "video",
        sectionId,
        name: "Main Video",
      });

      const snapshot = actor.getSnapshot();
      const section = snapshot.context.project?.sections[0];

      expect(section?.tracks).toHaveLength(1);
      expect(section?.tracks[0].name).toBe("Main Video");
      expect(section?.tracks[0].type).toBe("video");
      expect(section?.tracks[0].sectionId).toBe(sectionId);
    });

    it("should add global track", () => {
      actor.send({
        type: "ADD_TRACK",
        trackType: "music",
        name: "Background Music",
      });

      const snapshot = actor.getSnapshot();
      const project = snapshot.context.project;

      expect(project?.globalTracks).toHaveLength(1);
      expect(project?.globalTracks[0].name).toBe("Background Music");
      expect(project?.globalTracks[0].type).toBe("music");
      expect(project?.globalTracks[0].sectionId).toBeUndefined();
    });
  });

  describe("Clip Management", () => {
    beforeEach(() => {
      actor.send({ type: "CREATE_PROJECT", name: "Test Project" });
      actor.send({
        type: "ADD_SECTION",
        name: "Test Section",
        startTime: 0,
        duration: 300,
      });

      const sectionId = actor.getSnapshot().context.project?.sections[0].id;
      actor.send({
        type: "ADD_TRACK",
        trackType: "video",
        sectionId,
        name: "Video Track",
      });
    });

    it("should add clip to track", () => {
      const trackId =
        actor.getSnapshot().context.project?.sections[0].tracks[0].id;
      const mockMediaFile = {
        id: "media-1",
        name: "test-video.mp4",
        path: "/path/to/video.mp4",
        duration: 120,
        isVideo: true,
      };

      actor.send({
        type: "ADD_CLIP",
        trackId,
        mediaFile: mockMediaFile,
        startTime: 0,
        duration: 60,
      });

      const snapshot = actor.getSnapshot();
      const track = snapshot.context.project?.sections[0].tracks[0];

      expect(track?.clips).toHaveLength(1);
      expect(track?.clips[0].name).toBe("test-video.mp4");
      expect(track?.clips[0].mediaId).toBe("media-1");
      expect(track?.clips[0].startTime).toBe(0);
      expect(track?.clips[0].duration).toBe(60);
    });
  });

  describe("Selection Management", () => {
    beforeEach(() => {
      actor.send({ type: "CREATE_PROJECT", name: "Test Project" });
    });

    it("should select clips", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1", "clip-2"] });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.uiState.selectedClipIds).toEqual([
        "clip-1",
        "clip-2",
      ]);
    });

    it("should add to selection", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1"] });
      actor.send({
        type: "SELECT_CLIPS",
        clipIds: ["clip-2"],
        addToSelection: true,
      });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.uiState.selectedClipIds).toEqual([
        "clip-1",
        "clip-2",
      ]);
    });

    it("should clear selection", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip-1", "clip-2"] });
      actor.send({ type: "CLEAR_SELECTION" });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.uiState.selectedClipIds).toEqual([]);
      expect(snapshot.context.uiState.selectedTrackIds).toEqual([]);
      expect(snapshot.context.uiState.selectedSectionIds).toEqual([]);
    });
  });

  describe("Playback Control", () => {
    beforeEach(() => {
      actor.send({ type: "CREATE_PROJECT", name: "Test Project" });
    });

    it("should start playing", () => {
      actor.send({ type: "PLAY" });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("playing");
      expect(snapshot.context.isPlaying).toBe(true);
    });

    it("should pause playback", () => {
      actor.send({ type: "PLAY" });
      actor.send({ type: "PAUSE" });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("ready");
      expect(snapshot.context.isPlaying).toBe(false);
    });

    it("should seek to time", () => {
      actor.send({ type: "SEEK", time: 45.5 });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.currentTime).toBe(45.5);
      expect(snapshot.context.uiState.currentTime).toBe(45.5);
    });
  });

  describe("UI State Management", () => {
    beforeEach(() => {
      actor.send({ type: "CREATE_PROJECT", name: "Test Project" });
    });

    it("should set time scale", () => {
      actor.send({ type: "SET_TIME_SCALE", scale: 200 });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.uiState.timeScale).toBe(200);
    });

    it("should update playhead position when time scale changes", () => {
      actor.send({ type: "SEEK", time: 10 });
      actor.send({ type: "SET_TIME_SCALE", scale: 50 });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.uiState.playheadPosition).toBe(500); // 10 * 50
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", () => {
      actor.send({ type: "CLEAR_ERROR" });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.error).toBeNull();
    });
  });
});
