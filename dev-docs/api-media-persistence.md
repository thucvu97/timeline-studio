# API Reference: Media Persistence System

## Overview

The Media Persistence System provides APIs for saving and restoring media files in Timeline Studio projects. This document covers all public APIs, types, and integration patterns.

## Core Types

### SavedMediaFile

```typescript
interface SavedMediaFile {
  id: string; // Unique file identifier
  originalPath: string; // Original file path
  relativePath?: string; // Relative path if within project directory
  name: string; // File name
  size: number; // File size in bytes
  lastModified: number; // Last modification timestamp
  isVideo: boolean; // File type flags
  isAudio: boolean;
  isImage: boolean;
  metadata: SavedMediaMetadata; // File metadata
  status: FileStatus; // Current file status
  lastChecked: number; // Last check timestamp
}
```

### SavedMusicFile

```typescript
interface SavedMusicFile extends SavedMediaFile {
  musicMetadata: MusicMetadata; // Additional music-specific metadata
}

interface MusicMetadata {
  artist?: string;
  album?: string;
  title?: string;
  genre?: string;
  year?: number;
  track?: number;
}
```

### ProjectFile

```typescript
interface ProjectFile {
  settings: ProjectSettings;
  mediaLibrary: ProjectMediaLibrary;
  browserState: SavedBrowserState;
  projectFavorites: ProjectFavorites;
  meta: ProjectMeta;
}

interface ProjectMediaLibrary {
  mediaFiles: SavedMediaFile[];
  musicFiles: SavedMusicFile[];
  lastUpdated: number;
  version: string;
}
```

## Core Services

### ProjectFileService

Static service for project file operations.

#### Methods

```typescript
class ProjectFileService {
  // Load project from file
  static async loadProject(projectPath: string): Promise<ProjectFile>;

  // Save project to file
  static async saveProject(
    projectPath: string,
    projectData: ProjectFile,
  ): Promise<void>;

  // Create new project structure
  static createNewProject(name: string): ProjectFile;

  // Update media library in project
  static updateMediaLibrary(
    project: ProjectFile,
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
  ): ProjectFile;

  // Validate project structure
  private static validateProjectStructure(project: any): void;

  // Get project statistics
  static getProjectStats(project: ProjectFile): {
    totalMediaFiles: number;
    totalMusicFiles: number;
    totalSize: number;
    lastModified: number;
  };
}
```

#### Usage Example

```typescript
// Load project
const projectData = await ProjectFileService.loadProject(
  "/path/to/project.tlsp",
);

// Create new project
const newProject = ProjectFileService.createNewProject("My Project");

// Update media library
const updatedProject = ProjectFileService.updateMediaLibrary(
  project,
  mediaFiles,
  musicFiles,
);

// Save project
await ProjectFileService.saveProject("/path/to/project.tlsp", updatedProject);
```

### MediaRestorationService

Static service for media file restoration.

#### Methods

```typescript
class MediaRestorationService {
  // Restore all project media files
  static async restoreProjectMedia(
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
    projectPath: string,
  ): Promise<ProjectRestorationResult>;

  // Restore single file
  static async restoreFile(
    savedFile: SavedMediaFile,
    projectDir: string,
  ): Promise<FileRestorationResult>;

  // Prompt user to find missing file
  static async promptUserToFindFile(
    savedFile: SavedMediaFile,
  ): Promise<string | null>;

  // Handle missing files with user interaction
  static async handleMissingFiles(
    missingFiles: SavedMediaFile[],
    onProgress?: (current: number, total: number, fileName: string) => void,
  ): Promise<{
    found: Array<{
      original: SavedMediaFile;
      newPath: string;
      restoredFile: MediaFile;
    }>;
    stillMissing: SavedMediaFile[];
    userCancelled: SavedMediaFile[];
  }>;

  // Generate restoration report
  static generateRestorationReport(result: ProjectRestorationResult): string;
}
```

#### Usage Example

```typescript
// Restore project media
const result = await MediaRestorationService.restoreProjectMedia(
  mediaFiles,
  musicFiles,
  projectPath,
);

// Handle missing files
if (result.missingFiles.length > 0) {
  const userResult = await MediaRestorationService.handleMissingFiles(
    result.missingFiles,
    (current, total, fileName) => {
      console.log(`Processing ${current}/${total}: ${fileName}`);
    },
  );
}

// Generate report
const report = MediaRestorationService.generateRestorationReport(result);
console.log(report);
```

## Utility Functions

### saved-media-utils.ts

#### File ID Generation

```typescript
function generateFileId(filePath: string, metadata: any): string;
```

Generates unique file ID based on path, size, and modification time.

#### Path Utilities

```typescript
// Calculate relative path from project to file
async function calculateRelativePath(
  filePath: string,
  projectPath: string | null,
): Promise<string | undefined>;

// Generate alternative search paths
async function generateAlternativePaths(
  originalPath: string,
  projectDir: string,
): Promise<string[]>;

// Search for files by name in directory (system search)
async function searchFilesByName(
  directory: string,
  filename: string,
  maxDepth?: number,
): Promise<string[]>;

// Get absolute path for a file
async function getAbsolutePath(path: string): Promise<string | null>;
```

#### File System Operations

```typescript
// Check if file exists
async function fileExists(filePath: string): Promise<boolean>;

// Get file statistics
async function getFileStats(filePath: string): Promise<{
  size: number;
  lastModified: number;
} | null>;

// Validate file integrity
async function validateFileIntegrity(
  filePath: string,
  saved: SavedMediaFile,
): Promise<{
  isValid: boolean;
  confidence: number;
  issues: string[];
}>;
```

#### Type Conversion

```typescript
// Convert MediaFile to SavedMediaFile
async function convertToSavedMediaFile(
  file: MediaFile,
  projectPath?: string,
): Promise<SavedMediaFile>;

// Convert MediaFile to SavedMusicFile
async function convertToSavedMusicFile(
  file: MediaFile,
  projectPath?: string,
): Promise<SavedMusicFile>;

// Convert SavedMediaFile back to MediaFile
function convertFromSavedMediaFile(saved: SavedMediaFile): MediaFile;
```

## React Hooks

### useMediaRestoration

Hook for managing media restoration process.

#### Interface

```typescript
interface RestorationState {
  isRestoring: boolean;
  progress: number;
  currentFile?: string;
  phase: "scanning" | "restoring" | "user_input" | "completed" | "error";
  error?: string;
}

function useMediaRestoration(): {
  // State
  state: RestorationState;
  restorationResult: ProjectRestorationResult | null;
  showMissingFilesDialog: boolean;

  // Functions
  restoreProjectMedia: (
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
    projectPath: string,
    options?: {
      autoResolve?: boolean;
      showDialog?: boolean;
    },
  ) => Promise<{
    restoredMedia: MediaFile[];
    restoredMusic: MediaFile[];
    needsUserInput: boolean;
    result: ProjectRestorationResult;
  }>;

  handleMissingFilesResolution: (
    resolved: Array<{
      file: SavedMediaFile;
      newPath?: string;
      action: "found" | "remove";
    }>,
  ) => Promise<{
    foundFiles: MediaFile[];
    removedFiles: SavedMediaFile[];
  }>;

  cancelMissingFilesDialog: () => void;
  resetRestoration: () => void;

  // Getters
  getRestorationStats: () => ProjectRestorationResult["stats"] | null;
  getMissingFiles: () => SavedMediaFile[];
  getRelocatedFiles: () => Array<{ original: SavedMediaFile; newPath: string }>;
  getRestorationReport: () => string | null;

  // Utilities
  isRestoring: boolean;
  progress: number;
  currentPhase: RestorationState["phase"];
  error?: string;
};
```

#### Usage Example

```typescript
function ProjectManager() {
  const {
    restoreProjectMedia,
    handleMissingFilesResolution,
    showMissingFilesDialog,
    getMissingFiles,
    isRestoring,
    progress
  } = useMediaRestoration()

  const handleOpenProject = async (projectPath: string) => {
    const projectData = await ProjectFileService.loadProject(projectPath)

    if (projectData.mediaLibrary) {
      const result = await restoreProjectMedia(
        projectData.mediaLibrary.mediaFiles,
        projectData.mediaLibrary.musicFiles,
        projectPath,
        { showDialog: true }
      )

      // Handle restored files...
    }
  }

  return (
    <div>
      {isRestoring && <ProgressBar progress={progress} />}

      <MissingFilesDialog
        open={showMissingFilesDialog}
        missingFiles={getMissingFiles()}
        onResolve={handleMissingFilesResolution}
      />
    </div>
  )
}
```

## UI Components

### MissingFilesDialog

Dialog component for handling missing files.

#### Props

```typescript
interface MissingFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingFiles: SavedMediaFile[];
  onResolve: (
    resolved: Array<{
      file: SavedMediaFile;
      newPath?: string;
      action: "found" | "remove";
    }>,
  ) => void;
}
```

#### Usage

```typescript
<MissingFilesDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  missingFiles={missingFiles}
  onResolve={(resolved) => {
    // Handle user resolution
    resolved.forEach(({ file, newPath, action }) => {
      if (action === 'found' && newPath) {
        // File found at new location
        updateFileLocation(file.id, newPath)
      } else if (action === 'remove') {
        // Remove file from project
        removeFileFromProject(file.id)
      }
    })
  }}
/>
```

## Integration Patterns

### Import Hook Integration

```typescript
// In useMediaImport
const saveFilesToProject = useCallback(
  async (files: MediaFile[]) => {
    if (!currentProject.path || files.length === 0) return;

    const savedFiles = await Promise.all(
      files.map((file) => convertToSavedMediaFile(file, currentProject.path)),
    );

    // Update project state
    setProjectDirty(true);
  },
  [currentProject.path, setProjectDirty],
);

// Call after successful import
await saveFilesToProject(processedFiles);
```

### Project Provider Integration

```typescript
// In AppSettingsProvider
const openProject = async () => {
  const projectData = await ProjectFileService.loadProject(path);

  // Restore media files
  if (projectData.mediaLibrary) {
    const restorationResult = await restoreProjectMedia(
      projectData.mediaLibrary.mediaFiles || [],
      projectData.mediaLibrary.musicFiles || [],
      path,
      { showDialog: true },
    );

    // Update media providers with restored files
    updateMediaFiles(restorationResult.restoredMedia);
    updateMusicFiles(restorationResult.restoredMusic);
  }

  return { path, name, projectData };
};
```

## Error Handling

### Common Error Types

```typescript
// Project loading errors
class ProjectLoadError extends Error {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(message);
  }
}

// File restoration errors
class FileRestorationError extends Error {
  constructor(
    message: string,
    public readonly fileId: string,
  ) {
    super(message);
  }
}

// Validation errors
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: string[],
  ) {
    super(message);
  }
}
```

### Error Handling Patterns

```typescript
try {
  const projectData = await ProjectFileService.loadProject(path);
} catch (error) {
  if (error instanceof ProjectLoadError) {
    // Handle project loading error
    showErrorDialog(`Failed to load project: ${error.message}`);
  } else {
    // Handle unexpected error
    console.error("Unexpected error:", error);
  }
}
```

## Performance Considerations

### Batch Operations

```typescript
// Process files in batches to avoid blocking UI
const BATCH_SIZE = 10;

const processBatch = async (files: SavedMediaFile[], startIndex: number) => {
  const batch = files.slice(startIndex, startIndex + BATCH_SIZE);
  const results = await Promise.all(
    batch.map((file) => MediaRestorationService.restoreFile(file, projectDir)),
  );
  return results;
};
```

### Caching

```typescript
// Cache file existence checks
const fileExistsCache = new Map<string, boolean>();

const cachedFileExists = async (path: string): Promise<boolean> => {
  if (fileExistsCache.has(path)) {
    return fileExistsCache.get(path)!;
  }

  const exists = await fileExists(path);
  fileExistsCache.set(path, exists);
  return exists;
};
```

## Testing

### Unit Test Examples

```typescript
describe("MediaRestorationService", () => {
  it("should restore file from original path", async () => {
    mockFileExists.mockResolvedValue(true);
    mockValidateFileIntegrity.mockResolvedValue({
      isValid: true,
      confidence: 1.0,
      issues: [],
    });

    const result = await MediaRestorationService.restoreFile(
      savedFile,
      projectDir,
    );

    expect(result.status).toBe("found");
    expect(result.restoredFile).toBeDefined();
  });

  it("should find file in alternative location", async () => {
    mockFileExists.mockResolvedValueOnce(false); // Original path
    mockFileExists.mockResolvedValueOnce(true); // Alternative path

    const result = await MediaRestorationService.restoreFile(
      savedFile,
      projectDir,
    );

    expect(result.status).toBe("relocated");
    expect(result.newPath).toBeDefined();
  });
});
```

### Integration Test Examples

```typescript
describe("Project Media Persistence", () => {
  it("should save and restore media files", async () => {
    // Create project with media files
    const project = ProjectFileService.createNewProject("Test");
    const updatedProject = ProjectFileService.updateMediaLibrary(
      project,
      [savedMediaFile],
      [savedMusicFile],
    );

    // Save project
    await ProjectFileService.saveProject(projectPath, updatedProject);

    // Load project
    const loadedProject = await ProjectFileService.loadProject(projectPath);

    // Verify media library
    expect(loadedProject.mediaLibrary.mediaFiles).toHaveLength(1);
    expect(loadedProject.mediaLibrary.musicFiles).toHaveLength(1);
  });
});
```
