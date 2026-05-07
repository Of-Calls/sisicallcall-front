import { createBrowserRouter, Navigate } from "react-router-dom"
import { LoginPage } from "@/features/auth/LoginPage"
import { LandingLayout } from "@/pages/landing/LandingLayout"
import { LandingPage } from "@/pages/landing/LandingPage"
import { DashboardLayout } from "@/pages/dashboard/DashboardLayout"
import { DashboardAccessGate } from "@/pages/dashboard/DashboardAccessGate"
import { DashboardHomePage } from "@/pages/dashboard/DashboardHomePage"
import { IntegrationsPage } from "@/pages/dashboard/IntegrationsPage"
import { CallsPage } from "@/pages/calls/CallsPage"
import { VocPage } from "@/pages/voc/VocPage"
import { KnowledgePage } from "@/pages/knowledge/KnowledgePage"
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "intro", element: <LandingPage /> },
      { path: "about", element: <LandingPage /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <DashboardAccessGate />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHomePage /> },
              { path: "integrations", element: <IntegrationsPage /> },
              { path: "calls", element: <CallsPage /> },
              { path: "voc", element: <VocPage /> },
              { path: "knowledge", element: <KnowledgePage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
])
