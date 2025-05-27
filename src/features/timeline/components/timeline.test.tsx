import { beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "@/test/test-utils";

import { Timeline } from "./timeline";

// Мокаем дочерние компоненты
vi.mock("@/features/resources", () => ({
  ResourcesPanel: () => (
    <div data-testid="resources-panel">Resources Panel</div>
  ),
}));

vi.mock("./timeline-top-panel", () => ({
  TimelineTopPanel: () => (
    <div data-testid="timeline-top-panel">Timeline Top Panel</div>
  ),
}));

vi.mock("@/features/ai-chat/components/ai-chat", () => ({
  AiChat: () => <div data-testid="ai-chat">AI Chat</div>,
}));

// Мокаем UI компоненты
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, direction, className, ...props }: any) => (
    <div
      data-testid="resizable-panel-group"
      data-direction={direction}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  ResizablePanel: ({
    children,
    defaultSize,
    minSize,
    maxSize,
    className,
    ...props
  }: any) => (
    <div
      data-testid="resizable-panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  ResizableHandle: (props: any) => (
    <div data-testid="resizable-handle" {...props} />
  ),
}));

describe("Timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен корректно рендериться", () => {
    // Проверяем что компонент рендерится без ошибок
    expect(() => render(<Timeline />)).not.toThrow();
  });

  it("должен рендериться без ошибок", () => {
    const renderResult = render(<Timeline />);
    expect(renderResult.container).toBeInTheDocument();
  });
});
