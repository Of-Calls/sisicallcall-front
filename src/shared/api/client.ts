import { useAuthStore } from "@/shared/auth/authStore"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

export type ApiErrorResponse = {
  error?: {
    code: string
    message: string
  }
  request_id?: string
}

type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean
}

export type ApiResponseEnvelope<T> = {
  data: T
  request_id?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function unwrapApiResponse<T>(
  response: ApiResponseEnvelope<T> | T,
): T {
  if (isRecord(response) && "data" in response) {
    return (response as ApiResponseEnvelope<T>).data
  }

  return response as T
}

export function warnInDev(message: string, details?: unknown) {
  if (import.meta.env.DEV) {
    console.warn(message, details)
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuth, headers, ...fetchOptions } = options
  const token = useAuthStore.getState().accessToken
  const isFormData = fetchOptions.body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (response.status === 401) {
    useAuthStore.getState().clearAuth()
    if (window.location.pathname !== "/login") {
      window.location.assign("/login")
    }
    throw new Error("로그인이 만료되었습니다. 다시 로그인해 주세요.")
  }

  if (response.status === 403) {
    throw new Error("접근 권한이 없습니다. 관리자에게 문의해 주세요.")
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(body?.error?.message ?? `API request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
