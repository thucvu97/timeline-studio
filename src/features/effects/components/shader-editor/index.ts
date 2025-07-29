/**
 * Shader Editor components
 *
 * A complete GLSL shader editing system with:
 * - Code editor with syntax highlighting
 * - Live preview with WebGL2
 * - Uniform controls with animations
 * - Shader compilation and validation
 * - Example library
 * - Export to effect format
 */

export {
  getShaderCategories,
  getShaderExamplesByCategory,
  SHADER_EXAMPLES,
  searchShaderExamples,
} from "../../data/shader-examples"
export { useShaderEditor } from "../../hooks/use-shader-editor"
// Re-export utilities
export { ShaderCompiler } from "../../services/shader-compiler"
// Re-export types
export type {
  CodeCompletionItem,
  CodeDiagnostic,
  ShaderAttribute,
  ShaderCompilationResult,
  ShaderEditorState,
  ShaderError,
  ShaderExportOptions,
  ShaderPreset,
  ShaderProject,
  ShaderType,
  ShaderUniform,
  ShaderVarying,
  ShaderWarning,
  UniformType,
} from "../../types/shader-system"
export { GLSLCodeEditor } from "./glsl-code-editor"
export { ShaderEditor } from "./shader-editor"
export { ShaderExportDialog } from "./shader-export-dialog"
export { ShaderPreview } from "./shader-preview"
export { UniformsPanel } from "./uniforms-panel"
