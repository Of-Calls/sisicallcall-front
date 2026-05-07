import { create } from "zustand"
import type { AdminUser, Tenant } from "@/features/auth/authTypes"

type AuthState = {
  accessToken: string | null
  user: AdminUser | null
  tenant: Tenant | null
  isAuthenticated: boolean
  setAuth: (accessToken: string, user: AdminUser, tenant: Tenant) => void
  setSession: (user: AdminUser, tenant: Tenant) => void
  clearAuth: () => void
}

const ACCESS_TOKEN_KEY = "sisicallcall_access_token"

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  user: null,
  tenant: null,
  isAuthenticated: Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)),

  setAuth: (accessToken, user, tenant) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)

    set({
      accessToken,
      user,
      tenant,
      isAuthenticated: true,
    })
  },

  setSession: (user, tenant) => {
    set({
      user,
      tenant,
      isAuthenticated: true,
    })
  },

  clearAuth: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)

    set({
      accessToken: null,
      user: null,
      tenant: null,
      isAuthenticated: false,
    })
  },
}))