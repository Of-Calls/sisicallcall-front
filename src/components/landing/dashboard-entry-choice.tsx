import { LayoutDashboard, Monitor } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isStandaloneDisplayMode } from "@/shared/pwa/displayMode"
import { usePwaInstallStore } from "@/shared/pwa/pwaStore"

type DashboardEntryActionsProps = {
  className?: string
  primaryClassName?: string
  secondaryClassName?: string
  size?: "default" | "lg"
  stackedOnMobile?: boolean
}

export function useDashboardEntryActions() {
  const navigate = useNavigate()
  const deferredPrompt = usePwaInstallStore((state) => state.deferredPrompt)
  const setDeferredPrompt = usePwaInstallStore((state) => state.setDeferredPrompt)
  const setInstalled = usePwaInstallStore((state) => state.setInstalled)
  const setAllowWebDashboard = usePwaInstallStore(
    (state) => state.setAllowWebDashboard,
  )

  const openInBrowser = () => {
    setAllowWebDashboard(true)
    navigate("/dashboard")
  }

  const openAsApp = async () => {
    if (isStandaloneDisplayMode()) {
      navigate("/dashboard")
      return
    }

    if (!deferredPrompt) {
      toast.info("이미 설치되어 있거나 이 브라우저에서는 설치 프롬프트를 제공하지 않습니다.", {
        description: "설치된 앱은 홈 화면 또는 앱 목록에서 실행해주세요.",
        duration: 6000,
      })
      return
    }

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)

    if (choice.outcome === "accepted") {
      setInstalled(true)
      toast.success("앱 설치가 완료되었습니다.", {
        description: "설치된 앱이 자동으로 열리지 않으면 홈 화면 또는 앱 목록에서 실행해주세요.",
        duration: 6000,
      })
      return
    }

    toast.info("앱 설치가 취소되었습니다.", {
      description: "브라우저에서 보려면 웹에서 보기를 선택해주세요.",
      duration: 5000,
    })
  }

  return {
    openInBrowser,
    openAsApp,
  }
}

export function DashboardEntryActions({
  className,
  primaryClassName,
  secondaryClassName,
  size = "default",
  stackedOnMobile = true,
}: DashboardEntryActionsProps) {
  const { openInBrowser, openAsApp } = useDashboardEntryActions()

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        stackedOnMobile && "flex-col sm:flex-row",
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size={size}
        className={cn("rounded-full", secondaryClassName)}
        onClick={openInBrowser}
      >
        <Monitor className="h-4 w-4" aria-hidden="true" />
        웹에서 보기
      </Button>
      <Button
        type="button"
        size={size}
        className={cn(
          "rounded-full bg-[#0D9488] text-white hover:bg-[#0f766e]",
          primaryClassName,
        )}
        onClick={openAsApp}
      >
        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
        앱으로 보기
      </Button>
    </div>
  )
}
