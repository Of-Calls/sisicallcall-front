import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export function DashboardLayout() {
  return (
    <div
      className="flex h-screen"
      style={{
        backgroundColor: "#ffffff",
        fontFamily: "var(--hds-font-body)",
        color: "#061b31",
      }}
    >
      <DashboardSidebar />
      <main
        className="flex-1 overflow-auto"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
