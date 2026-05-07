import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { loginAdmin } from "@/features/auth/authApi"
import type { LoginRequest } from "@/features/auth/authTypes"
import { useAuthStore } from "@/shared/auth/authStore"

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: LoginRequest) => loginAdmin(payload),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user, data.tenant)
      navigate("/dashboard", { replace: true })
    },
  })
}