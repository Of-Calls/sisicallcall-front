import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { getCurrentAdmin, loginAdmin } from "@/features/auth/authApi"
import type { LoginRequest } from "@/features/auth/authTypes"
import { useAuthStore } from "@/shared/auth/authStore"

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const setSession = useAuthStore((state) => state.setSession)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      let tokenStored = false

      try {
        const data = await loginAdmin(payload)
        const accessToken = data.access_token ?? data.accessToken

        if (!accessToken) {
          throw new Error("Login response is missing an access token.")
        }

        setAuth(accessToken, data.user, data.tenant)
        tokenStored = true

        const me = await getCurrentAdmin()
        setSession(me.user, me.tenant)

        return me
      } catch (error) {
        if (tokenStored) {
          clearAuth()
        }

        throw error
      }
    },
    onSuccess: () => {
      navigate("/dashboard", { replace: true })
    },
  })
}
