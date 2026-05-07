import { Outlet } from "react-router-dom"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
