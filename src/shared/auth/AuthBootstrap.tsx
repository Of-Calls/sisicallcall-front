import type { PropsWithChildren } from "react"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getCurrentAdmin } from "@/features/auth/authApi"
import { useAuthStore } from "@/shared/auth/authStore"

export function AuthBootstrap({ children }: PropsWithChildren) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const shouldCheckMe = Boolean(accessToken && !user)

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentAdmin,
    enabled: shouldCheckMe,
    retry: false,
  })

  useEffect(() => {
    if (query.data) {
      setSession(query.data.user, query.data.tenant)
    }
  }, [query.data, setSession])

  useEffect(() => {
    if (query.isError) {
      clearAuth()
    }
  }, [query.isError, clearAuth])

  if (shouldCheckMe && query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">로그인 상태를 확인하고 있습니다...</p>
      </div>
    )
  }

  return <>{children}</>
}
