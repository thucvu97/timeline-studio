import { toast as sonnerToast } from "sonner"

type ToastVariant = "default" | "destructive" | "success"

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

/**
 * Custom toast hook that wraps Sonner's toast functionality
 * Provides a consistent API for displaying toast notifications
 */
export function useToast() {
  const toast = ({ title, description, variant = "default", duration, ...props }: ToastOptions) => {
    const message = title || description || ""
    const descriptionText = title && description ? description : undefined

    switch (variant) {
      case "destructive":
        return sonnerToast.error(message, {
          description: descriptionText,
          duration,
          ...props,
        })
      case "success":
        return sonnerToast.success(message, {
          description: descriptionText,
          duration,
          ...props,
        })
      default:
        return sonnerToast(message, {
          description: descriptionText,
          duration,
          ...props,
        })
    }
  }

  return {
    toast,
    // Expose individual toast methods for convenience
    success: (message: string, options?: Omit<ToastOptions, "variant">) =>
      toast({ ...options, title: message, variant: "success" }),
    error: (message: string, options?: Omit<ToastOptions, "variant">) =>
      toast({ ...options, title: message, variant: "destructive" }),
    info: (message: string, options?: Omit<ToastOptions, "variant">) =>
      toast({ ...options, title: message, variant: "default" }),
  }
}
