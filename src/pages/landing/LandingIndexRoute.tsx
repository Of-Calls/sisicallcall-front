import { Navigate } from "react-router-dom"
import { LandingPage } from "@/pages/landing/LandingPage"
import { Spinner } from "@/components/ui/spinner"
import { useAuthStore } from "@/shared/auth/authStore"

export function LandingIndexRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          <span>Authenticating...</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <LandingPage />
}
