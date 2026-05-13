export type AdminRole = "owner" | "admin" | "staff"

export type TenantIndustry = "hospital" | "restaurant" | "finance" | "appliance"

export type TenantPlan = "basic" | "vertical"

export type AdminUser = {
  id: string
  email: string
  name: string
  role: AdminRole
}

export type Tenant = {
  id: string
  name: string
  industry: TenantIndustry
  plan: TenantPlan
  twilio_number: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponseData = {
  access_token?: string
  accessToken?: string
  token_type: "bearer"
  user: AdminUser
  tenant: Tenant
}

export type MeResponseData = {
  user: AdminUser
  tenant: Tenant
}

export type ApiResponse<T> = {
  data: T
  request_id: string
}
