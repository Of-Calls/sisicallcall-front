import { Outlet } from "react-router-dom";
import {
  DashboardMobileNav,
  DashboardSidebar,
} from "@/components/dashboard/sidebar";

export function DashboardLayout() {
  return (
    <div
      className="flex h-screen flex-col lg:flex-row"
      style={{
        backgroundColor: "#ffffff",
        fontFamily: "var(--hds-font-body)",
        color: "#061b31",
      }}
    >
      <DashboardMobileNav />
      <DashboardSidebar />
      <main
        className="min-w-0 flex-1 overflow-auto"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
