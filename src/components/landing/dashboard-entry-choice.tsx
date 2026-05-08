import { LayoutDashboard, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isStandaloneDisplayMode } from "@/shared/pwa/displayMode";
import { usePwaInstallStore } from "@/shared/pwa/pwaStore";

type DashboardEntryActionsProps = {
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  size?: "default" | "lg";
  stackedOnMobile?: boolean;
};

export function useDashboardEntryActions() {
  const navigate = useNavigate();
  const deferredPrompt = usePwaInstallStore((state) => state.deferredPrompt);
  const setDeferredPrompt = usePwaInstallStore(
    (state) => state.setDeferredPrompt,
  );
  const setInstalled = usePwaInstallStore((state) => state.setInstalled);
  const setAllowWebDashboard = usePwaInstallStore(
    (state) => state.setAllowWebDashboard,
  );

  const openInBrowser = () => {
    setAllowWebDashboard(true);
    navigate("/dashboard");
  };

  const openAsApp = async () => {
    if (isStandaloneDisplayMode()) {
      navigate("/dashboard");
      return;
    }

    if (!deferredPrompt) {
      toast.info(
        "이미 설치되어 있거나 이 브라우저에서는 설치 프롬프트를 제공하지 않습니다.",
        {
          description: "설치된 앱은 홈 화면 또는 앱 목록에서 실행해주세요.",
          duration: 6000,
        },
      );
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      setInstalled(true);
      toast.success("앱 설치가 완료되었습니다.", {
        description:
          "설치된 앱이 자동으로 열리지 않으면 홈 화면 또는 앱 목록에서 실행해주세요.",
        duration: 6000,
      });
      return;
    }

    toast.info("앱 설치가 취소되었습니다.", {
      description: "브라우저에서 보려면 웹에서 보기를 선택해주세요.",
      duration: 5000,
    });
  };

  return {
    openInBrowser,
    openAsApp,
  };
}

export function DashboardEntryActions({
  className,
  primaryClassName,
  secondaryClassName,
  size = "default",
  stackedOnMobile = true,
}: DashboardEntryActionsProps) {
  const { openInBrowser, openAsApp } = useDashboardEntryActions();

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
        className={cn(
          // Ghost / Outlined per spec — purple text, soft purple border, 4px radius
          "rounded-[4px] border-[#b9b9f9] bg-white text-[#533afd] font-semibold",
          "hover:bg-[rgba(83,58,253,0.05)] hover:text-[#533afd] hover:border-[#533afd]",
          "shadow-none transition-colors",
          secondaryClassName,
        )}
        onClick={openInBrowser}
      >
        <Monitor className="h-4 w-4" aria-hidden="true" />
        웹에서 보기
      </Button>
      <Button
        type="button"
        size={size}
        className={cn(
          // Primary Purple per spec — #533afd, 4px radius, semibold
          "rounded-[4px] bg-[#533afd] text-white font-semibold",
          "hover:bg-[#4434d4]",
          "shadow-[rgba(50,50,93,0.25)_0px_8px_20px_-10px,rgba(0,0,0,0.1)_0px_4px_10px_-4px]",
          "hover:shadow-[rgba(50,50,93,0.35)_0px_18px_30px_-15px,rgba(0,0,0,0.12)_0px_10px_20px_-8px]",
          "transition-all",
          primaryClassName,
        )}
        onClick={openAsApp}
      >
        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
        앱으로 보기
      </Button>
    </div>
  );
}
