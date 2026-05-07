import { Navigate, Outlet } from "react-router-dom"
import { isStandaloneDisplayMode } from "@/shared/pwa/displayMode"
import { usePwaInstallStore } from "@/shared/pwa/pwaStore"

export function DashboardAccessGate() {
  const allowWebDashboard = usePwaInstallStore((state) => state.allowWebDashboard)

  if (isStandaloneDisplayMode() || allowWebDashboard) {
    return <Outlet />
  }

  return <Navigate to="/" replace />
}
