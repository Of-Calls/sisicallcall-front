import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  Bug,
  CalendarDays,
  FileText,
  Link2,
  Mail,
  MessageSquareText,
  Phone,
} from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { API_BASE_URL, apiFetch } from "@/shared/api/client"
import { useAuthStore } from "@/shared/auth/authStore"
import { cn } from "@/lib/utils"

// ── provider 매핑 ──────────────────────────────────────────────────────────────
//
// 프론트 카드 id ↔ 백엔드 OAuth provider 명을 명확히 분리한다.
// notion / sms 는 OAuth provider 가 아니라 서버 설정 기반(env/secret manager).

type CardId = "gmail" | "google-calendar" | "slack" | "jira" | "notion" | "sms"
type OAuthProvider = "google_gmail" | "google_calendar" | "slack" | "jira"

const OAUTH_PROVIDER_MAP: Partial<Record<CardId, OAuthProvider>> = {
  gmail: "google_gmail",
  "google-calendar": "google_calendar",
  slack: "slack",
  jira: "jira",
}

// ── 백엔드 응답 타입 ────────────────────────────────────────────────────────────

type ProviderStatus =
  | "not_connected"
  | "connected"
  | "disconnected"
  | "expired"
  | "error"

type StatusResponse = {
  status: ProviderStatus
  tenant_id: string
  provider: string
  account_email?: string | null
  workspace_name?: string | null
  expires_at?: string | null
  scopes?: string[]
  workspace_selection_required?: boolean
  workspace_id?: string | null
}

type JiraResource = {
  id: string
  name: string
  url: string
  scopes: string[]
}

type JiraResourcesResponse = {
  tenant_id: string
  provider: "jira"
  workspace_selection_required: boolean
  resources: JiraResource[]
  selected_resource: JiraResource | null
}

// ── 카드 메타 ──────────────────────────────────────────────────────────────────

type IntegrationCard = {
  id: CardId
  name: string
  description: string
  icon: LucideIcon
  /** OAuth 연동 대상이 아닌 경우 (서버 설정으로만 관리) */
  serverManaged?: boolean
}

const integrations: IntegrationCard[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "통화 요약 메일 발송에 사용됩니다.",
    icon: Mail,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "예약 일정 생성에 사용됩니다.",
    icon: CalendarDays,
  },
  {
    id: "slack",
    name: "Slack",
    description: "상담 알림과 운영 이슈 공유에 사용됩니다.",
    icon: MessageSquareText,
  },
  {
    id: "jira",
    name: "Jira",
    description: "이슈 생성과 후속 작업 관리에 사용됩니다.",
    icon: Bug,
  },
  {
    id: "notion",
    name: "Notion",
    description: "상담 기록과 운영 문서를 동기화합니다. (서버 설정 기반)",
    icon: FileText,
    serverManaged: true,
  },
  {
    id: "sms",
    name: "SMS",
    description: "통화 후 SMS 안내 발송에 사용됩니다. (서버 설정 기반)",
    icon: Phone,
    serverManaged: true,
  },
]

// ── 표시 상태 ──────────────────────────────────────────────────────────────────

type DisplayState =
  | "loading"
  | "not_connected"
  | "connected"
  | "needs_reconnect"
  | "incomplete"
  | "server_managed"
  | "unavailable"

type DisplayMeta = {
  badgeLabel: string
  badgeClassName: string
  buttonLabel: string
  buttonVariant: "default" | "outline" | "secondary" | "ghost"
  disabled: boolean
  helperText: string
}

const displayMetaFor = (state: DisplayState): DisplayMeta => {
  switch (state) {
    case "loading":
      return {
        badgeLabel: "확인 중",
        badgeClassName: "border-slate-200 bg-slate-100 text-slate-600",
        buttonLabel: "확인 중...",
        buttonVariant: "outline",
        disabled: true,
        helperText: "연결 상태를 확인하는 중입니다.",
      }
    case "connected":
      return {
        badgeLabel: "연결됨",
        badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
        buttonLabel: "연결됨",
        buttonVariant: "secondary",
        disabled: true,
        helperText: "정상적으로 연결되어 있습니다.",
      }
    case "needs_reconnect":
      return {
        badgeLabel: "다시 연결 필요",
        badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
        buttonLabel: "다시 연결",
        buttonVariant: "default",
        disabled: false,
        helperText: "토큰이 만료되었거나 오류가 발생했습니다.",
      }
    case "incomplete":
      return {
        badgeLabel: "추가 설정 필요",
        badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
        buttonLabel: "다시 연결",
        buttonVariant: "default",
        disabled: false,
        helperText: "워크스페이스 선택이 필요합니다.",
      }
    case "not_connected":
      return {
        badgeLabel: "미연결",
        badgeClassName: "border-teal-200 bg-teal-100 text-teal-700",
        buttonLabel: "연결하기",
        buttonVariant: "default",
        disabled: false,
        helperText: "버튼을 누르면 권한 허용 페이지로 이동합니다.",
      }
    case "server_managed":
      return {
        badgeLabel: "서버 설정",
        badgeClassName: "border-slate-200 bg-slate-100 text-slate-600",
        buttonLabel: "서버 설정",
        buttonVariant: "outline",
        disabled: true,
        helperText: "서버에서 관리하는 연동입니다. 운영자에게 문의해 주세요.",
      }
    case "unavailable":
    default:
      return {
        badgeLabel: "비활성화",
        badgeClassName: "border-slate-200 bg-slate-100 text-slate-600",
        buttonLabel: "비활성화",
        buttonVariant: "ghost",
        disabled: true,
        helperText: "현재 연결을 사용할 수 없습니다.",
      }
  }
}

const PROVIDER_LABEL: Record<string, string> = {
  google_gmail: "Gmail",
  google_calendar: "Google Calendar",
  slack: "Slack",
  jira: "Jira",
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const tenant = useAuthStore((state) => state.tenant)
  const tenantId = tenant?.id ?? null

  const [statusMap, setStatusMap] = useState<
    Partial<Record<OAuthProvider, StatusResponse>>
  >({})
  const [statusLoading, setStatusLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const handledQueryRef = useRef<string | null>(null)

  // ── status 조회 ──────────────────────────────────────────────────────────────
  const fetchAllStatus = useCallback(async () => {
    if (!tenantId) {
      setStatusLoading(false)
      return
    }
    setStatusLoading(true)
    const providers = Object.values(OAUTH_PROVIDER_MAP) as OAuthProvider[]
    try {
      const results = await Promise.all(
        providers.map(async (provider) => {
          try {
            const data = await apiFetch<StatusResponse>(
              `/api/v1/oauth/${provider}/status?tenant_id=${encodeURIComponent(
                tenantId,
              )}`,
            )
            return [provider, data] as const
          } catch (err) {
            console.error(`[integrations] status 조회 실패 provider=${provider}`, err)
            return [
              provider,
              {
                status: "error" as ProviderStatus,
                tenant_id: tenantId,
                provider,
              } satisfies StatusResponse,
            ] as const
          }
        }),
      )
      const next: Partial<Record<OAuthProvider, StatusResponse>> = {}
      for (const [provider, data] of results) {
        next[provider] = data
      }
      setStatusMap(next)
    } finally {
      setStatusLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void fetchAllStatus()
  }, [fetchAllStatus])

  // ── OAuth 완료 query 처리 ────────────────────────────────────────────────────
  useEffect(() => {
    const provider = searchParams.get("provider")
    const status = searchParams.get("status")
    if (!provider || !status) return

    const queryKey = `${provider}:${status}:${searchParams.get("reason") ?? ""}`
    if (handledQueryRef.current === queryKey) return
    handledQueryRef.current = queryKey

    const providerName = PROVIDER_LABEL[provider] ?? provider
    if (status === "connected") {
      toast.success(`${providerName} 연동이 완료되었습니다.`)
    } else if (status === "incomplete") {
      const reason = searchParams.get("reason")
      if (reason === "workspace_selection_required") {
        toast.message(`${providerName} 워크스페이스를 선택해 주세요.`)
      } else {
        toast.message(`${providerName} 연동이 완료되지 않았습니다.`)
      }
    } else if (status === "error") {
      toast.error(`${providerName} 연동 중 오류가 발생했습니다.`)
    }

    // 처리 후 query 정리 — 새로고침 시 재안내 방지.
    const next = new URLSearchParams(searchParams)
    next.delete("provider")
    next.delete("status")
    next.delete("reason")
    next.delete("workspace_selection_required")
    setSearchParams(next, { replace: true })

    // 상태를 다시 가져와서 카드 표시를 갱신.
    void fetchAllStatus()
  }, [searchParams, setSearchParams, fetchAllStatus])

  // ── 카드별 표시 상태 결정 ────────────────────────────────────────────────────
  const getDisplayState = useCallback(
    (card: IntegrationCard): DisplayState => {
      if (card.serverManaged) return "server_managed"
      if (!tenantId) return "unavailable"
      const oauthProvider = OAUTH_PROVIDER_MAP[card.id]
      if (!oauthProvider) return "unavailable"
      const data = statusMap[oauthProvider]
      if (statusLoading && !data) return "loading"
      if (!data) return "loading"
      if (data.status === "connected") {
        if (
          oauthProvider === "jira" &&
          data.workspace_selection_required
        ) {
          return "incomplete"
        }
        return "connected"
      }
      if (data.status === "expired" || data.status === "error") {
        return "needs_reconnect"
      }
      return "not_connected"
    },
    [statusMap, statusLoading, tenantId],
  )

  // ── 연결하기 ─────────────────────────────────────────────────────────────────
  const handleConnect = useCallback(
    (card: IntegrationCard) => {
      if (!tenantId) {
        toast.error("테넌트 정보를 불러오지 못했습니다. 다시 로그인해 주세요.")
        return
      }
      const oauthProvider = OAUTH_PROVIDER_MAP[card.id]
      if (!oauthProvider) return

      const returnUrl = `${window.location.origin}/dashboard/integrations`
      const url =
        `${API_BASE_URL}/api/v1/oauth/${oauthProvider}/authorize` +
        `?tenant_id=${encodeURIComponent(tenantId)}` +
        `&return_url=${encodeURIComponent(returnUrl)}`
      window.location.href = url
    },
    [tenantId],
  )

  // ── Jira workspace 선택 ─────────────────────────────────────────────────────
  const jiraStatus = statusMap["jira"]
  const jiraNeedsWorkspace =
    !!jiraStatus &&
    jiraStatus.status === "connected" &&
    !!jiraStatus.workspace_selection_required

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">연동 설정</h1>
          <p className="text-sm text-muted-foreground">
            상담 요약 발송, 일정 생성, 업무 처리에 사용할 외부 서비스를 관리합니다.
          </p>
        </div>
      </motion.div>

      {!tenantId ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <AlertTitle>테넌트 정보 없음</AlertTitle>
            <AlertDescription className="text-amber-800">
              테넌트 정보를 불러오지 못했습니다. 다시 로그인한 뒤 다시 시도해
              주세요.
            </AlertDescription>
          </Alert>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <Alert className="border-teal-200 bg-teal-50 text-teal-900">
            <Link2 className="h-4 w-4 text-teal-700" />
            <AlertTitle>OAuth 연동</AlertTitle>
            <AlertDescription className="text-teal-800">
              연결하기 버튼을 누르면 해당 서비스의 권한 허용 페이지로 이동합니다.
              허용 후 자동으로 이 페이지로 돌아옵니다.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {jiraNeedsWorkspace && tenantId ? (
        <JiraWorkspacePicker
          tenantId={tenantId}
          onUpdated={() => {
            void fetchAllStatus()
          }}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((item, index) => {
          const state = getDisplayState(item)
          const meta = displayMetaFor(state)
          const Icon = item.icon
          const oauthProvider = OAUTH_PROVIDER_MAP[item.id]
          const data = oauthProvider ? statusMap[oauthProvider] : undefined

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.08 + index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("font-normal", meta.badgeClassName)}
                    >
                      {meta.badgeLabel}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <CardDescription className="min-h-10 text-sm leading-6">
                      {item.description}
                    </CardDescription>
                    {data?.account_email ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {data.account_email}
                      </p>
                    ) : null}
                    {data?.workspace_name ? (
                      <p className="truncate text-xs text-muted-foreground">
                        워크스페이스: {data.workspace_name}
                      </p>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="flex items-end justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {meta.helperText}
                  </p>
                  <Button
                    type="button"
                    variant={meta.buttonVariant}
                    disabled={meta.disabled}
                    onClick={() => handleConnect(item)}
                  >
                    {meta.buttonLabel}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Jira workspace 선택 UI ─────────────────────────────────────────────────────

type JiraWorkspacePickerProps = {
  tenantId: string
  onUpdated: () => void
}

function JiraWorkspacePicker({ tenantId, onUpdated }: JiraWorkspacePickerProps) {
  const [resources, setResources] = useState<JiraResource[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await apiFetch<JiraResourcesResponse>(
          `/api/v1/oauth/jira/resources?tenant_id=${encodeURIComponent(tenantId)}`,
        )
        if (cancelled) return
        setResources(data.resources)
        setSelected(data.selected_resource?.id ?? data.resources[0]?.id ?? null)
      } catch (err) {
        if (!cancelled) {
          console.error("[integrations] Jira resources 조회 실패", err)
          toast.error("Jira 워크스페이스 목록을 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [tenantId])

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await apiFetch("/api/v1/oauth/jira/select-workspace", {
        method: "POST",
        body: JSON.stringify({ tenant_id: tenantId, cloud_id: selected }),
      })
      toast.success("Jira 워크스페이스가 저장되었습니다.")
      onUpdated()
    } catch (err) {
      console.error("[integrations] Jira workspace 저장 실패", err)
      toast.error("Jira 워크스페이스 저장에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-amber-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-amber-700" />
            <CardTitle className="text-base">Jira 워크스페이스 선택</CardTitle>
          </div>
          <CardDescription>
            연결된 Atlassian 계정에 여러 워크스페이스가 있습니다. 사용할
            워크스페이스를 하나 선택해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">목록을 불러오는 중...</p>
          ) : resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              사용 가능한 워크스페이스가 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {resources.map((resource) => (
                <li key={resource.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      selected === resource.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="jira-workspace"
                      value={resource.id}
                      checked={selected === resource.id}
                      onChange={() => setSelected(resource.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {resource.name || resource.id}
                      </div>
                      {resource.url ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {resource.url}
                        </div>
                      ) : null}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!selected || submitting || resources.length === 0}
            >
              {submitting ? "저장 중..." : "워크스페이스 저장"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default IntegrationsPage
