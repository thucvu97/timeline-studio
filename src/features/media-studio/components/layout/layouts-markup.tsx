import { MessageCircle, Play } from "lucide-react"
import { useTranslation } from "react-i18next"

interface LayoutProps {
  isActive: boolean
  onClick: () => void
}

export function DefaultLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${isActive ? "bg-muted/40" : "hover:bg-muted/40"} p-2 pb-1`}
      onClick={onClick}
    >
      <div className=" mb-1 flex h-24 w-40 flex-row border-2 border-gray-700">
        <div className="flex h-full w-[100%] flex-col">
          <div className="flex h-[60%] w-full border-b-2 border-gray-700">
            <div className="w-[30%] border-r-2 border-gray-700 p-1">
              <div className="w-full">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" />
                </div>
              </div>
            </div>
            <div className="flex w-[70%] items-center justify-center border-gray-700">
              <div className="bg-muted flex h-[90%] w-[95%] items-center justify-center border-2 border-gray-700">
                <Play className="text-primary h-3 w-3" />
              </div>
            </div>
          </div>
          <div className="flex h-[40%] w-full">
            <div className="w-[20%] border-r-2 border-gray-700 p-1">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
            </div>
            <div className="relative w-[60%] border-r-2 px-2 py-1">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm" />
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm" />
            </div>
            <div className="w-[20%] border-gray-700 p-1">
              <div className="bg-primary/70 h-0.5 w-full rounded-sm" />
              <div className="bg-primary/70 mt-6 h-1 w-full rounded-sm" />
            </div>
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium">{t("topBar.layouts.default")}</span>
    </div>
  )
}

export function OptionsLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${isActive ? "bg-muted/40" : "hover:bg-muted/40"} p-2 pb-1`}
      onClick={onClick}
    >
      <div className=" mb-1 flex h-24 w-40 flex-row border-2 border-gray-700">
        <div className="flex h-full w-[75%] flex-col">
          <div className="flex h-[60%] w-full border-b-2 border-gray-700">
            <div className="w-[30%] border-r-2 border-gray-700 p-1">
              <div className="w-full">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" />
                </div>
              </div>
            </div>
            <div className="flex w-[70%] items-center justify-center border-gray-700">
              <div className="bg-muted flex h-[90%] w-[90%] items-center justify-center border-2 border-gray-700">
                <Play className="text-primary h-3 w-3" />
              </div>
            </div>
          </div>
          <div className="flex h-[40%] w-full">
            <div className="w-[20%] border-r-2 border-gray-700 p-1">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
            </div>
            <div className="relative w-[60%] border-r-2 px-2 py-1">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm" />
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm" />
            </div>
            <div className="w-[20%] border-gray-700 p-1">
              <div className="bg-primary/70 h-0.5 w-full rounded-sm" />
              <div className="bg-primary/70 mt-6 h-1 w-full rounded-sm" />
            </div>
          </div>
        </div>
        <div className="h-full w-[25%] border-l-2 border-gray-700 p-1">
          <div className="bg-primary/70 mb-2 h-1 w-full rounded-sm" />
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
          <div className="bg-primary/70 h-1 w-full rounded-sm" />
        </div>
      </div>
      <span className="text-[10px] font-medium">{t("topBar.layouts.options")}</span>
    </div>
  )
}

export function VerticalLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${isActive ? "bg-muted/40" : "hover:bg-muted/40"} p-2 pb-1`}
      onClick={onClick}
    >
      <div className=" mb-1 flex h-24 w-40 flex-row border-2 border-gray-700">
        <div className="flex h-full w-[70%] flex-col">
          <div className="flex h-[50%] w-full border-b-2 border-gray-700">
            <div className="w-[65%] p-1">
              <div className="w-full">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                </div>
              </div>
            </div>
            <div className="w-[35%] border-l-2 border-gray-700 p-1">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 h-1 w-full rounded-sm" />
            </div>
          </div>
          <div className="flex h-[50%] w-full">
            <div className="w-[25%] border-r-2 border-gray-700 p-1">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
            </div>
            <div className="relative w-[50%] border-r-2 px-2 py-1">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm" />
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm" />
            </div>
            <div className="w-[25%] border-gray-700 p-1">
              <div className="bg-primary/70 h-0.5 w-full rounded-sm" />
              <div className="bg-primary/70 mt-6 h-1 w-full rounded-sm" />
            </div>
          </div>
        </div>
        <div className="flex w-[30%] items-center justify-center border-l-2 border-gray-700">
          <div className="bg-muted flex h-[95%] w-[85%] items-center justify-center border-2 border-gray-700">
            <Play className="text-primary h-4 w-4" />
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium">{t("topBar.layouts.vertical")}</span>
    </div>
  )
}

export function ChatLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${isActive ? "bg-muted/40" : "hover:bg-muted/40"} p-2 pb-1`}
      onClick={onClick}
    >
      <div className=" mb-1 flex h-24 w-40 flex-row border-2 border-gray-700">
        <div className="flex h-full w-[75%] flex-col">
          <div className="flex h-[60%] w-full border-b-2 border-gray-700">
            <div className="w-[30%] border-r-2 border-gray-700 p-1">
              <div className="w-full">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" />
                </div>
              </div>
            </div>
            <div className="flex w-[70%] items-center justify-center border-gray-700">
              <div className="bg-muted flex h-[90%] w-[90%] items-center justify-center border-2 border-gray-700">
                <Play className="text-primary h-3 w-3" />
              </div>
            </div>
          </div>
          <div className="flex h-[40%] w-full">
            <div className="w-[30%] border-r-2 border-gray-700 p-1">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
            </div>
            <div className="relative w-[70%] px-2 py-1">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm" />
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm" />
            </div>
          </div>
        </div>
        <div className="h-full w-[25%] border-l-2 border-gray-700 p-1">
          <div className="flex items-center justify-center mb-2">
            <MessageCircle className="text-primary h-3 w-3" />
          </div>
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" />
          <div className="bg-primary/70 mb-1 h-1 w-[80%] rounded-sm" />
          <div className="bg-primary/70 mb-1 h-1 w-[60%] rounded-sm" />
          <div className="bg-primary/70 mb-1 h-1 w-[90%] rounded-sm" />
          <div className="bg-primary/70 h-1 w-[70%] rounded-sm" />
        </div>
      </div>
      <span className="text-[10px] font-medium">{t("topBar.layouts.chat")}</span>
    </div>
  )
}
