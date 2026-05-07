import { useEffect } from "react"
import {
  type BeforeInstallPromptEvent,
  usePwaInstallStore,
} from "@/shared/pwa/pwaStore"

export function PwaInstallBridge() {
  const setDeferredPrompt = usePwaInstallStore((state) => state.setDeferredPrompt)
  const setInstalled = usePwaInstallStore((state) => state.setInstalled)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setInstalled(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [setDeferredPrompt, setInstalled])

  return null
}
