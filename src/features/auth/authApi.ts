import { apiFetch } from "@/shared/api/client"
import { endpoints } from "@/shared/api/endpoints"
import type {
  ApiResponse,
  LoginRequest,
  LoginResponseData,
  MeResponseData,
} from "@/features/auth/authTypes"

export async function loginAdmin(payload: LoginRequest) {
  const response = await apiFetch<ApiResponse<LoginResponseData>>(
    endpoints.auth.login,
    {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    },
  )

  return response.data
}

export async function getCurrentAdmin() {
  const response = await apiFetch<ApiResponse<MeResponseData>>(
    endpoints.auth.me,
    {
      method: "GET",
    },
  )

  return response.data
}