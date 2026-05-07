import { create } from "zustand"

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed"
  platform: string
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<BeforeInstallPromptChoice>
}

type PwaInstallState = {
  deferredPrompt: BeforeInstallPromptEvent | null
  isInstalled: boolean
  allowWebDashboard: boolean
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void
  setInstalled: (isInstalled: boolean) => void
  setAllowWebDashboard: (allowWebDashboard: boolean) => void
}

export const usePwaInstallStore = create<PwaInstallState>((set) => ({
  deferredPrompt: null,
  isInstalled: false,
  allowWebDashboard: false,
  setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
  setInstalled: (isInstalled) => set({ isInstalled }),
  setAllowWebDashboard: (allowWebDashboard) => set({ allowWebDashboard }),
}))
