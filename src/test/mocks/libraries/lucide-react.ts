import React from "react"

import { vi } from "vitest"

const createMockIcon = (name: string) => {
  const MockIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(function MockLucideIcon(props, ref) {
    return React.createElement(
      "svg",
      {
        ...props,
        ref,
        "data-testid": `${name.toLowerCase()}-icon`,
        "data-icon": name,
      },
      name,
    )
  })
  MockIcon.displayName = `Mock${name}Icon`
  return MockIcon
}

// Export all commonly used icons
export const AlertCircle = createMockIcon("AlertCircle")
export const AlertTriangle = createMockIcon("AlertTriangle")
export const Clapperboard = createMockIcon("Clapperboard")
export const Blend = createMockIcon("Blend")
export const Bot = createMockIcon("Bot")
export const Check = createMockIcon("Check")
export const CheckCircle2 = createMockIcon("CheckCircle2")
export const CheckIcon = createMockIcon("CheckIcon")
export const ChevronDown = createMockIcon("ChevronDown")
export const Database = createMockIcon("Database")
export const ChevronDownIcon = createMockIcon("ChevronDownIcon")
export const ChevronRight = createMockIcon("ChevronRight")
export const ChevronRightIcon = createMockIcon("ChevronRightIcon")
export const ChevronUpIcon = createMockIcon("ChevronUpIcon")
export const CircleIcon = createMockIcon("CircleIcon")
export const CirclePause = createMockIcon("CirclePause")
export const CirclePlay = createMockIcon("CirclePlay")
export const Clock = createMockIcon("Clock")
export const CopyPlus = createMockIcon("CopyPlus")
export const Cpu = createMockIcon("Cpu")
export const Eye = createMockIcon("Eye")
export const EyeOff = createMockIcon("EyeOff")
export const File = createMockIcon("File")
export const FileText = createMockIcon("FileText")
export const FileVideo = createMockIcon("FileVideo")
export const Film = createMockIcon("Film")
export const Filter = createMockIcon("Filter")
export const FlipHorizontal2 = createMockIcon("FlipHorizontal2")
export const Folder = createMockIcon("Folder")
export const FolderOpen = createMockIcon("FolderOpen")
export const Gauge = createMockIcon("Gauge")
export const Activity = createMockIcon("Activity")
export const AudioLines = createMockIcon("AudioLines")
export const HardDrive = createMockIcon("HardDrive")
export const Grid = createMockIcon("Grid")
export const Grid2x2 = createMockIcon("Grid2x2")
export const Grid2X2 = createMockIcon("Grid2X2")
export const GripVerticalIcon = createMockIcon("GripVerticalIcon")
export const Image = createMockIcon("Image")
export const Info = createMockIcon("Info")
export const Keyboard = createMockIcon("Keyboard")
export const LayoutDashboard = createMockIcon("LayoutDashboard")
export const LayoutTemplate = createMockIcon("LayoutTemplate")
export const List = createMockIcon("List")
export const ListTodo = createMockIcon("ListTodo")
export const Loader2 = createMockIcon("Loader2")
export const Lock = createMockIcon("Lock")
export const Mic = createMockIcon("Mic")
export const Minus = createMockIcon("Minus")
export const MonitorCog = createMockIcon("MonitorCog")
export const Moon = createMockIcon("Moon")
export const MoveHorizontal = createMockIcon("MoveHorizontal")
export const Music = createMockIcon("Music")
export const Package = createMockIcon("Package")
export const Palette = createMockIcon("Palette")
export const PanelBottomClose = createMockIcon("PanelBottomClose")
export const PanelBottomOpen = createMockIcon("PanelBottomOpen")
export const PanelLeftClose = createMockIcon("PanelLeftClose")
export const PanelLeftOpen = createMockIcon("PanelLeftOpen")
export const PanelRightClose = createMockIcon("PanelRightClose")
export const PanelRightOpen = createMockIcon("PanelRightOpen")
export const Pause = createMockIcon("Pause")
export const Play = createMockIcon("Play")
export const PlayCircle = createMockIcon("PlayCircle")
export const Plus = createMockIcon("Plus")
export const Redo2 = createMockIcon("Redo2")
export const RefreshCw = createMockIcon("RefreshCw")
export const RotateCcw = createMockIcon("RotateCcw")
export const Save = createMockIcon("Save")
export const Scissors = createMockIcon("Scissors")
export const SquareMousePointer = createMockIcon("SquareMousePointer")
export const Search = createMockIcon("Search")
export const Send = createMockIcon("Send")
export const SendHorizonal = createMockIcon("SendHorizonal")
export const Settings = createMockIcon("Settings")
export const Sparkles = createMockIcon("Sparkles")
export const Square = createMockIcon("Square")
export const Star = createMockIcon("Star")
export const Sticker = createMockIcon("Sticker")
export const StopCircle = createMockIcon("StopCircle")
export const Subtitles = createMockIcon("Subtitles")
export const Sun = createMockIcon("Sun")
export const Trash2 = createMockIcon("Trash2")
export const Type = createMockIcon("Type")
export const Undo2 = createMockIcon("Undo2")
export const Unlock = createMockIcon("Unlock")
export const Upload = createMockIcon("Upload")
export const User = createMockIcon("User")
export const UserCog = createMockIcon("UserCog")
export const Video = createMockIcon("Video")
export const Volume2 = createMockIcon("Volume2")
export const VolumeX = createMockIcon("VolumeX")
export const Webcam = createMockIcon("Webcam")
export const X = createMockIcon("X")
export const XCircle = createMockIcon("XCircle")
export const XIcon = createMockIcon("XIcon")
export const Zap = createMockIcon("Zap")

// Mock the entire lucide-react module
vi.mock("lucide-react", () => ({
  AlertCircle,
  AlertTriangle,
  Clapperboard,
  Blend,
  Bot,
  Check,
  CheckCircle2,
  CheckIcon,
  ChevronDown,
  Database,
  ChevronDownIcon,
  ChevronRight,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleIcon,
  CirclePause,
  CirclePlay,
  Clock,
  CopyPlus,
  Cpu,
  Eye,
  EyeOff,
  File,
  FileText,
  FileVideo,
  Film,
  Filter,
  FlipHorizontal2,
  Folder,
  FolderOpen,
  Gauge,
  Activity,
  AudioLines,
  HardDrive,
  Grid,
  Grid2x2,
  Grid2X2,
  GripVerticalIcon,
  Image,
  Info,
  Keyboard,
  LayoutDashboard,
  LayoutTemplate,
  List,
  ListTodo,
  Loader2,
  Lock,
  Mic,
  Minus,
  MonitorCog,
  Moon,
  MoveHorizontal,
  Music,
  Package,
  Palette,
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  PlayCircle,
  Plus,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  Scissors,
  SquareMousePointer,
  Search,
  Send,
  SendHorizonal,
  Settings,
  Sparkles,
  Square,
  Star,
  Sticker,
  StopCircle,
  Subtitles,
  Sun,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Upload,
  User,
  UserCog,
  Video,
  Volume2,
  VolumeX,
  Webcam,
  X,
  XCircle,
  XIcon,
  Zap,
}))

// Helper to create custom icons for tests
export { createMockIcon }
