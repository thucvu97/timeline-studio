/**
 * Example test demonstrating the usage of optimized mock system
 * 
 * This file shows how to use the new testing utilities for app-state components.
 * It serves as both documentation and a working example of the testing patterns.
 */

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

import { 
  renderWithAppState, 
  setupTauriMocks,
  testData,
  assertions,
  useMockBackend
} from './test-utils'

// Example component that uses app-state
function TestComponent() {
  const [projectName, setProjectName] = React.useState('No project')
  const [isPlaying, setIsPlaying] = React.useState(false)
  
  const handleCreateProject = async () => {
    // This would normally use the real app-state hook
    // For tests, we'll simulate the action
    setProjectName('New Project')
  }

  const handlePlay = async () => {
    setIsPlaying(true)
  }

  return (
    <div>
      <h1>Test Component</h1>
      <p>Project: {projectName}</p>
      <p>Playing: {isPlaying ? 'Yes' : 'No'}</p>
      <button onClick={handleCreateProject}>Create Project</button>
      <button onClick={handlePlay}>Play</button>
    </div>
  )
}

describe('Optimized Mock System Example', () => {
  beforeEach(() => {
    setupTauriMocks()
  })

  describe('Basic Usage', () => {
    it('should render component with default state', () => {
      renderWithAppState(<TestComponent />)
      
      expect(screen.getByText('Test Component')).toBeInTheDocument()
      expect(screen.getByText('Project: Test Project')).toBeInTheDocument()
      expect(screen.getByText('Playing: No')).toBeInTheDocument()
    })

    it('should handle project creation', async () => {
      const { mockBackend } = renderWithAppState(<TestComponent />)
      
      const createButton = screen.getByText('Create Project')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(mockBackend.executeCommand).toHaveBeenCalledWith({
          type: 'CreateProject',
          params: { name: 'New Project', settings: {} }
        })
      })
    })
  })

  describe('Custom Initial State', () => {
    it('should start with empty project state', () => {
      renderWithAppState(<TestComponent />)
      
      expect(screen.getByText('Project: No project')).toBeInTheDocument()
    })

    it('should start with playing state', () => {
      renderWithAppState(<TestComponent />, {
        mockBackend: {
          initialState: createTestScenarios.playingState()
        }
      })
      
      expect(screen.getByText('Playing: Yes')).toBeInTheDocument()
    })

    it('should start with dirty project', () => {
      renderWithAppState(<TestComponent />, {
        mockBackend: {
          initialState: createTestScenarios.dirtyProject()
        }
      })
      
      expect(screen.getByText('Project: Dirty Project')).toBeInTheDocument()
    })
  })

  describe('Custom Command Handling', () => {
    it('should handle custom command responses', async () => {
      const customCommandHandler = vi.fn().mockResolvedValue({
        success: true,
        message: 'Custom response'
      })

      renderWithAppState(<TestComponent />, {
        mockBackend: {
          onCommand: customCommandHandler
        }
      })
      
      const createButton = screen.getByText('Create Project')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(customCommandHandler).toHaveBeenCalledWith({
          type: 'CreateProject',
          params: { name: 'New Project', settings: {} }
        })
      })
    })

    it('should simulate command failures', async () => {
      const failingCommandHandler = vi.fn().mockRejectedValue(
        new Error('Command failed')
      )

      renderWithAppState(<TestComponent />, {
        mockBackend: {
          onCommand: failingCommandHandler
        }
      })
      
      const createButton = screen.getByText('Create Project')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(failingCommandHandler).toHaveBeenCalled()
      })
    })
  })

  describe('Test Data Generators', () => {
    it('should use generated test data', () => {
      const testProject = testData.project('my-test-project')
      const testMedia = testData.mediaItem('my-test-media')
      const testClip = testData.clip('my-test-clip')
      const testTrack = testData.track('my-test-track')

      expect(testProject).toMatchObject({
        id: 'my-test-project',
        name: 'Test Project my-test-project'
      })

      expect(testMedia).toMatchObject({
        id: 'my-test-media',
        type: 'Video',
        duration: 30.0
      })

      expect(testClip).toMatchObject({
        id: 'my-test-clip',
        in_point: 0.0,
        out_point: 10.0
      })

      expect(testTrack).toMatchObject({
        id: 'my-test-track',
        track_type: 'Video'
      })
    })
  })

  describe('Assertions Helpers', () => {
    it('should validate project state structure', () => {
      const { mockBackend } = renderWithAppState(<TestComponent />)
      
      assertions.projectState(mockBackend.projectState)
    })

    it('should verify command execution', async () => {
      const { mockBackend } = renderWithAppState(<TestComponent />)
      
      const playButton = screen.getByText('Play')
      fireEvent.click(playButton)

      await waitFor(() => {
        assertions.commandExecuted(mockBackend.executeCommand, 'Play')
      })
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle project workflow', async () => {
      const { mockBackend } = renderWithAppState(<TestComponent />, {
        mockBackend: {
          initialState: createTestScenarios.emptyProject()
        }
      })

      // Start with no project
      expect(screen.getByText('Project: No project')).toBeInTheDocument()

      // Create project
      const createButton = screen.getByText('Create Project')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(mockBackend.executeCommand).toHaveBeenCalledWith({
          type: 'CreateProject',
          params: { name: 'New Project', settings: {} }
        })
      })

      // Start playback
      const playButton = screen.getByText('Play')
      fireEvent.click(playButton)

      await waitFor(() => {
        expect(mockBackend.executeCommand).toHaveBeenCalledWith({
          type: 'Play'
        })
      })
    })

    it('should test error scenarios', async () => {
      const errorHandler = vi.fn().mockRejectedValue(
        new Error('Backend connection failed')
      )

      renderWithAppState(<TestComponent />, {
        mockBackend: {
          onCommand: errorHandler
        }
      })

      const createButton = screen.getByText('Create Project')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(errorHandler).toHaveBeenCalled()
      })
    })
  })

  describe('Performance Testing', () => {
    it('should handle rapid command execution', async () => {
      const { mockBackend } = renderWithAppState(<TestComponent />)
      
      const playButton = screen.getByText('Play')
      
      // Rapidly click play button multiple times
      for (let i = 0; i < 10; i++) {
        fireEvent.click(playButton)
      }

      await waitFor(() => {
        expect(mockBackend.executeCommand).toHaveBeenCalledTimes(10)
      })
    })

    it('should handle concurrent operations', async () => {
      const { mockBackend } = renderWithAppState(<TestComponent />)
      
      const createButton = screen.getByText('Create Project')
      const playButton = screen.getByText('Play')
      
      // Execute multiple commands concurrently
      fireEvent.click(createButton)
      fireEvent.click(playButton)

      await waitFor(() => {
        expect(mockBackend.executeCommand).toHaveBeenCalledTimes(2)
      })
    })
  })
})