import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecordingControls } from "./recording-controls";

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Мокируем компонент Button из @/components/ui/button
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

describe("RecordingControls", () => {
  // Моки для обработчиков событий
  const mockOnStartRecording = vi.fn();
  const mockOnStopRecording = vi.fn();
  const mockFormatRecordingTime = vi.fn().mockReturnValue("00:00:10");

  // Пропсы по умолчанию
  const defaultProps = {
    isRecording: false,
    recordingTime: 10000, // 10 секунд
    isDeviceReady: true,
    onStartRecording: mockOnStartRecording,
    onStopRecording: mockOnStopRecording,
    formatRecordingTime: mockFormatRecordingTime,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders start recording button when not recording", () => {
    render(<RecordingControls {...defaultProps} />);

    // Проверяем, что отображается кнопка начала записи
    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute(
      "title",
      "dialogs.cameraCapture.startRecording",
    );
    expect(button).toHaveAttribute(
      "aria-label",
      "dialogs.cameraCapture.startRecording",
    );

    // Проверяем, что отображается время записи
    expect(
      screen.getByText("dialogs.cameraCapture.recordingTime 00:00:10"),
    ).toBeInTheDocument();
  });

  it("renders stop recording button when recording", () => {
    render(<RecordingControls {...defaultProps} isRecording />);

    // Проверяем, что отображается кнопка остановки записи
    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute(
      "title",
      "dialogs.cameraCapture.stopRecording",
    );
    expect(button).toHaveAttribute(
      "aria-label",
      "dialogs.cameraCapture.stopRecording",
    );
  });

  it("disables start button when device is not ready", () => {
    render(<RecordingControls {...defaultProps} isDeviceReady={false} />);

    // Проверяем, что кнопка начала записи отключена
    const button = screen.getByTestId("button");
    expect(button).toBeDisabled();
  });

  it("calls onStartRecording when start button is clicked", () => {
    render(<RecordingControls {...defaultProps} />);

    // Находим кнопку начала записи и кликаем по ней
    const button = screen.getByTestId("button");
    fireEvent.click(button);

    // Проверяем, что обработчик был вызван
    expect(mockOnStartRecording).toHaveBeenCalledTimes(1);
  });

  it("calls onStopRecording when stop button is clicked", () => {
    render(<RecordingControls {...defaultProps} isRecording />);

    // Находим кнопку остановки записи и кликаем по ней
    const button = screen.getByTestId("button");
    fireEvent.click(button);

    // Проверяем, что обработчик был вызван
    expect(mockOnStopRecording).toHaveBeenCalledTimes(1);
  });

  it("formats recording time correctly", () => {
    render(<RecordingControls {...defaultProps} />);

    // Проверяем, что функция форматирования времени была вызвана с правильным аргументом
    expect(mockFormatRecordingTime).toHaveBeenCalledWith(10000);

    // Проверяем, что отформатированное время отображается
    expect(
      screen.getByText("dialogs.cameraCapture.recordingTime 00:00:10"),
    ).toBeInTheDocument();
  });
});
