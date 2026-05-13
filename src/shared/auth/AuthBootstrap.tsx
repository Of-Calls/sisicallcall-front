import type { PropsWithChildren } from "react"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getCurrentAdmin } from "@/features/auth/authApi"
import { useAuthStore } from "@/shared/auth/authStore"

export function AuthBootstrap({ children }: PropsWithChildren) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const setLoading = useAuthStore((state) => state.setLoading)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const shouldCheckMe = Boolean(accessToken && !user)

  const query = useQuery({
    queryKey: ["auth", "me", accessToken],
    queryFn: getCurrentAdmin,
    enabled: shouldCheckMe,
    retry: false,
  })

  useEffect(() => {
    setLoading(shouldCheckMe)
  }, [shouldCheckMe, setLoading])

  useEffect(() => {
    if (!query.data) {
      return
    }

    setSession(query.data.user, query.data.tenant)
  }, [query.data, setSession])

  useEffect(() => {
    if (!query.isError) {
      return
    }

    clearAuth()
    setLoading(false)
  }, [query.isError, clearAuth, setLoading])

  return <>{children}</>
}
