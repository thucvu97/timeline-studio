import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

export function CameraCaptureModal() {
  const { t } = useTranslation()

  return (
    <div className="flex justify-end border-t border-[#333] p-4">
      <Button className="bg-[#0CC] px-6 font-medium text-black hover:bg-[#0AA]">
        {t("common.ok")}
      </Button>
    </div>
  )
}
