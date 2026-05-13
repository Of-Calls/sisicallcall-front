import { create } from "zustand"
import type { AdminUser, Tenant } from "@/features/auth/authTypes"

type AuthState = {
  accessToken: string | null
  user: AdminUser | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (accessToken: string, user: AdminUser, tenant: Tenant) => void
  setSession: (user: AdminUser, tenant: Tenant) => void
  setLoading: (isLoading: boolean) => void
  clearAuth: () => void
}

export const ACCESS_TOKEN_KEY = "sisicallcall_access_token"

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

const initialAccessToken = getStoredAccessToken()

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialAccessToken,
  user: null,
  tenant: null,
  isAuthenticated: Boolean(initialAccessToken),
  isLoading: Boolean(initialAccessToken),

  setAuth: (accessToken, user, tenant) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    }

    set({
      accessToken,
      user,
      tenant,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  setSession: (user, tenant) => {
    set({
      user,
      tenant,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  setLoading: (isLoading) => {
    set({
      isLoading,
    })
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    }

    set({
      accessToken: null,
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },
}))
