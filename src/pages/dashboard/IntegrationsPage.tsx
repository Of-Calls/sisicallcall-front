import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bug,
  CalendarDays,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  MessageSquareText,
  Phone,
} from "lucide-react";
import {
  CountChip,
  PageShell,
  PageTopbar,
  SectionHeader,
  StatusBadge,
} from "@/components/dashboard/page-chrome";
import { API_BASE_URL, apiFetch } from "@/shared/api/client";
import { useAuthStore } from "@/shared/auth/authStore";
import { cn } from "@/lib/utils";

// ── provider 매핑 ──────────────────────────────────────────────────────────────

type CardId = "gmail" | "google-calendar" | "slack" | "jira" | "notion" | "sms";
type OAuthProvider = "google_gmail" | "google_calendar" | "slack" | "jira";

const OAUTH_PROVIDER_MAP: Partial<Record<CardId, OAuthProvider>> = {
  gmail: "google_gmail",
  "google-calendar": "google_calendar",
  slack: "slack",
  jira: "jira",
};

// ── 백엔드 응답 타입 ────────────────────────────────────────────────────────────

type ProviderStatus =
  | "not_connected"
  | "connected"
  | "disconnected"
  | "expired"
  | "error";

type StatusResponse = {
  status: ProviderStatus;
  tenant_id: string;
  provider: string;
  account_email?: string | null;
  workspace_name?: string | null;
  expires_at?: string | null;
  scopes?: string[];
  workspace_selection_required?: boolean;
  workspace_id?: string | null;
};

type JiraResource = {
  id: string;
  name: string;
  url: string;
  scopes: string[];
};

type JiraResourcesResponse = {
  tenant_id: string;
  provider: "jira";
  workspace_selection_required: boolean;
  resources: JiraResource[];
  selected_resource: JiraResource | null;
};

// ── 카드 메타 ──────────────────────────────────────────────────────────────────

type IntegrationCard = {
  id: CardId;
  name: string;
  description: string;
  icon: LucideIcon;
  /** OAuth 연동 대상이 아닌 경우 (서버 설정으로만 관리) */
  serverManaged?: boolean;
};

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
];

// ── 표시 상태 ──────────────────────────────────────────────────────────────────

type DisplayState =
  | "loading"
  | "not_connected"
  | "connected"
  | "needs_reconnect"
  | "incomplete"
  | "server_managed"
  | "unavailable";

type BadgeTone = "info" | "success" | "warning" | "error" | "neutral";
type ButtonVariant = "primary" | "neutral" | "ghost";

type DisplayMeta = {
  badgeLabel: string;
  badgeTone: BadgeTone;
  buttonLabel: string;
  buttonVariant: ButtonVariant;
  disabled: boolean;
  helperText: string;
};

const displayMetaFor = (state: DisplayState): DisplayMeta => {
  switch (state) {
    case "loading":
      return {
        badgeLabel: "확인 중",
        badgeTone: "neutral",
        buttonLabel: "확인 중...",
        buttonVariant: "neutral",
        disabled: true,
        helperText: "연결 상태를 확인하는 중입니다.",
      };
    case "connected":
      return {
        badgeLabel: "연결됨",
        badgeTone: "success",
        buttonLabel: "연결됨",
        buttonVariant: "ghost",
        disabled: true,
        helperText: "정상적으로 연결되어 있습니다.",
      };
    case "needs_reconnect":
      return {
        badgeLabel: "다시 연결 필요",
        badgeTone: "warning",
        buttonLabel: "다시 연결",
        buttonVariant: "primary",
        disabled: false,
        helperText: "토큰이 만료되었거나 오류가 발생했습니다.",
      };
    case "incomplete":
      return {
        badgeLabel: "추가 설정 필요",
        badgeTone: "warning",
        buttonLabel: "다시 연결",
        buttonVariant: "primary",
        disabled: false,
        helperText: "워크스페이스 선택이 필요합니다.",
      };
    case "not_connected":
      return {
        badgeLabel: "미연결",
        badgeTone: "info",
        buttonLabel: "연결하기",
        buttonVariant: "primary",
        disabled: false,
        helperText: "버튼을 누르면 권한 허용 페이지로 이동합니다.",
      };
    case "server_managed":
      return {
        badgeLabel: "서버 설정",
        badgeTone: "neutral",
        buttonLabel: "서버 설정",
        buttonVariant: "neutral",
        disabled: true,
        helperText: "서버에서 관리하는 연동입니다. 운영자에게 문의해 주세요.",
      };
    case "unavailable":
    default:
      return {
        badgeLabel: "비활성화",
        badgeTone: "neutral",
        buttonLabel: "비활성화",
        buttonVariant: "ghost",
        disabled: true,
        helperText: "현재 연결을 사용할 수 없습니다.",
      };
  }
};

const PROVIDER_LABEL: Record<string, string> = {
  google_gmail: "Gmail",
  google_calendar: "Google Calendar",
  slack: "Slack",
  jira: "Jira",
};

// ── primary/neutral/ghost button helper (HDS tokens) ──────────────────────────

function getButtonStyle(
  variant: ButtonVariant,
  disabled: boolean,
): React.CSSProperties {
  if (disabled) {
    return {
      color: "#94a3b8",
      backgroundColor: "#ffffff",
      border: "1px solid #e5edf5",
      cursor: "not-allowed",
      fontFamily: "var(--hds-font-body)",
      fontWeight: 500,
    };
  }

  switch (variant) {
    case "primary":
      return {
        color: "#ffffff",
        backgroundColor: "#533afd",
        border: "1px solid #533afd",
        boxShadow:
          "rgba(50,50,93,0.18) 0px 8px 18px -10px, rgba(0,0,0,0.08) 0px 4px 8px -4px",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 600,
      };
    case "neutral":
      return {
        color: "#273951",
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 500,
      };
    case "ghost":
    default:
      return {
        color: "#64748d",
        backgroundColor: "transparent",
        border: "1px solid transparent",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 500,
      };
  }
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const tenant = useAuthStore((state) => state.tenant);
  const tenantId = tenant?.id ?? null;

  const [statusMap, setStatusMap] = useState<
    Partial<Record<OAuthProvider, StatusResponse>>
  >({});
  const [statusLoading, setStatusLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const handledQueryRef = useRef<string | null>(null);

  // ── status 조회 ──────────────────────────────────────────────────────────────
  const fetchAllStatus = useCallback(async () => {
    if (!tenantId) {
      setStatusLoading(false);
      return;
    }
    setStatusLoading(true);
    const providers = Object.values(OAUTH_PROVIDER_MAP) as OAuthProvider[];
    try {
      const results = await Promise.all(
        providers.map(async (provider) => {
          try {
            const data = await apiFetch<StatusResponse>(
              `/api/v1/oauth/${provider}/status?tenant_id=${encodeURIComponent(
                tenantId,
              )}`,
            );
            return [provider, data] as const;
          } catch (err) {
            console.error(
              `[integrations] status 조회 실패 provider=${provider}`,
              err,
            );
            return [
              provider,
              {
                status: "error" as ProviderStatus,
                tenant_id: tenantId,
                provider,
              } satisfies StatusResponse,
            ] as const;
          }
        }),
      );
      const next: Partial<Record<OAuthProvider, StatusResponse>> = {};
      for (const [provider, data] of results) {
        next[provider] = data;
      }
      setStatusMap(next);
    } finally {
      setStatusLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void fetchAllStatus();
  }, [fetchAllStatus]);

  // ── OAuth 완료 query 처리 ────────────────────────────────────────────────────
  useEffect(() => {
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");
    if (!provider || !status) return;

    const queryKey = `${provider}:${status}:${searchParams.get("reason") ?? ""}`;
    if (handledQueryRef.current === queryKey) return;
    handledQueryRef.current = queryKey;

    const providerName = PROVIDER_LABEL[provider] ?? provider;
    if (status === "connected") {
      toast.success(`${providerName} 연동이 완료되었습니다.`);
    } else if (status === "incomplete") {
      const reason = searchParams.get("reason");
      if (reason === "workspace_selection_required") {
        toast.message(`${providerName} 워크스페이스를 선택해 주세요.`);
      } else {
        toast.message(`${providerName} 연동이 완료되지 않았습니다.`);
      }
    } else if (status === "error") {
      toast.error(`${providerName} 연동 중 오류가 발생했습니다.`);
    }

    const next = new URLSearchParams(searchParams);
    next.delete("provider");
    next.delete("status");
    next.delete("reason");
    next.delete("workspace_selection_required");
    setSearchParams(next, { replace: true });

    void fetchAllStatus();
  }, [searchParams, setSearchParams, fetchAllStatus]);

  // ── 카드별 표시 상태 결정 ────────────────────────────────────────────────────
  const getDisplayState = useCallback(
    (card: IntegrationCard): DisplayState => {
      if (card.serverManaged) return "server_managed";
      if (!tenantId) return "unavailable";
      const oauthProvider = OAUTH_PROVIDER_MAP[card.id];
      if (!oauthProvider) return "unavailable";
      const data = statusMap[oauthProvider];
      if (statusLoading && !data) return "loading";
      if (!data) return "loading";
      if (data.status === "connected") {
        if (oauthProvider === "jira" && data.workspace_selection_required) {
          return "incomplete";
        }
        return "connected";
      }
      if (data.status === "expired" || data.status === "error") {
        return "needs_reconnect";
      }
      return "not_connected";
    },
    [statusMap, statusLoading, tenantId],
  );

  // ── 연결하기 ─────────────────────────────────────────────────────────────────
  const handleConnect = useCallback(
    (card: IntegrationCard) => {
      if (!tenantId) {
        toast.error("테넌트 정보를 불러오지 못했습니다. 다시 로그인해 주세요.");
        return;
      }
      const oauthProvider = OAUTH_PROVIDER_MAP[card.id];
      if (!oauthProvider) return;

      const returnUrl = `${window.location.origin}/dashboard/integrations`;
      const url =
        `${API_BASE_URL}/api/v1/oauth/${oauthProvider}/authorize` +
        `?tenant_id=${encodeURIComponent(tenantId)}` +
        `&return_url=${encodeURIComponent(returnUrl)}`;
      window.location.href = url;
    },
    [tenantId],
  );

  // ── Jira workspace 선택 ─────────────────────────────────────────────────────
  const jiraStatus = statusMap["jira"];
  const jiraNeedsWorkspace =
    !!jiraStatus &&
    jiraStatus.status === "connected" &&
    !!jiraStatus.workspace_selection_required;

  const connectedCount = Object.values(statusMap).filter(
    (status) => status?.status === "connected",
  ).length;

  return (
    <PageShell>
      <PageTopbar
        eyebrow="설정"
        title="연동 설정"
        description="상담 요약 발송, 일정 생성, 업무 처리에 사용할 외부 서비스를 관리합니다."
        rightSlot={
          tenantId ? (
            <CountChip tone="primary">{connectedCount}개 연결됨</CountChip>
          ) : null
        }
      />

      <div className="space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {/* Inline notices */}
        {!tenantId ? (
          <InfoCallout
            tone="warning"
            icon={<AlertCircle className="h-4 w-4" />}
            title="테넌트 정보 없음"
            body="테넌트 정보를 불러오지 못했습니다. 다시 로그인한 뒤 다시 시도해 주세요."
          />
        ) : (
          <InfoCallout
            tone="info"
            icon={<Link2 className="h-4 w-4" />}
            title="OAuth 연동"
            body="연결하기 버튼을 누르면 해당 서비스의 권한 허용 페이지로 이동합니다. 허용 후 자동으로 이 페이지로 돌아옵니다."
          />
        )}

        {jiraNeedsWorkspace && tenantId ? (
          <JiraWorkspacePicker
            tenantId={tenantId}
            onUpdated={() => {
              void fetchAllStatus();
            }}
          />
        ) : null}

        {/* Cards */}
        <section className="space-y-3">
          <SectionHeader
            eyebrow="외부 서비스"
            title="사용 가능한 연동"
            description="연결한 서비스만 통화 처리 자동화 흐름에 활용됩니다."
          />

          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {integrations.map((item, index) => {
              const state = getDisplayState(item);
              const meta = displayMetaFor(state);
              const Icon = item.icon;
              const oauthProvider = OAUTH_PROVIDER_MAP[item.id];
              const data = oauthProvider ? statusMap[oauthProvider] : undefined;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.05 + index * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex h-full min-w-0 flex-col rounded-[12px] p-5 transition-all duration-200"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5edf5",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d6d9fc";
                    e.currentTarget.style.boxShadow =
                      "rgba(50,50,93,0.10) 0px 18px 30px -18px, rgba(0,0,0,0.06) 0px 10px 20px -10px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5edf5";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px]"
                      style={{
                        color: "#533afd",
                        backgroundColor: "rgba(83,58,253,0.08)",
                        border: "1px solid rgba(83,58,253,0.20)",
                      }}
                    >
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <StatusBadge tone={meta.badgeTone}>
                      {meta.badgeLabel}
                    </StatusBadge>
                  </div>

                  <div className="mt-4 min-w-0 space-y-1">
                    <h3
                      className="text-soft-wrap text-[15px] tracking-[-0.01em]"
                      style={{
                        color: "#061b31",
                        fontFamily: "var(--hds-font-display)",
                        fontWeight: 700,
                      }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="text-soft-wrap min-h-[40px] text-[13px] leading-[1.55]"
                      style={{ color: "#64748d", fontWeight: 500 }}
                    >
                      {item.description}
                    </p>

                    {data?.account_email ? (
                      <p
                        className="hds-tnum truncate text-[12px]"
                        style={{
                          color: "#273951",
                          fontWeight: 500,
                          fontFamily: "var(--hds-font-mono)",
                        }}
                      >
                        {data.account_email}
                      </p>
                    ) : null}
                    {data?.workspace_name ? (
                      <p
                        className="truncate text-[11.5px]"
                        style={{ color: "#94a3b8", fontWeight: 500 }}
                      >
                        워크스페이스 · {data.workspace_name}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                    <p
                      className="text-soft-wrap min-w-[160px] flex-1 text-[11.5px] leading-[1.5]"
                      style={{ color: "#94a3b8", fontWeight: 500 }}
                    >
                      {meta.helperText}
                    </p>
                    <button
                      type="button"
                      disabled={meta.disabled}
                      onClick={() => handleConnect(item)}
                      className={cn(
                        "no-text-break inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] px-3 text-[12.5px] transition-all",
                      )}
                      style={getButtonStyle(meta.buttonVariant, meta.disabled)}
                    >
                      {meta.buttonLabel}
                      {!meta.disabled && meta.buttonVariant === "primary" ? (
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      ) : null}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

// ── 보조: Info Callout (info / warning / error) ──────────────────────────────

function InfoCallout({
  tone,
  icon,
  title,
  body,
}: {
  tone: "info" | "warning" | "error";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const styles =
    tone === "warning"
      ? {
          backgroundColor: "rgba(155,104,41,0.06)",
          borderColor: "rgba(155,104,41,0.25)",
          iconColor: "#9b6829",
          titleColor: "#9b6829",
          bodyColor: "#273951",
        }
      : tone === "error"
        ? {
            backgroundColor: "rgba(234,34,97,0.04)",
            borderColor: "rgba(234,34,97,0.25)",
            iconColor: "#ea2261",
            titleColor: "#ea2261",
            bodyColor: "#273951",
          }
        : {
            backgroundColor: "rgba(83,58,253,0.04)",
            borderColor: "rgba(83,58,253,0.20)",
            iconColor: "#533afd",
            titleColor: "#533afd",
            bodyColor: "#273951",
          };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="text-soft-wrap flex items-start gap-3 rounded-[8px] px-4 py-3"
      style={{
        backgroundColor: styles.backgroundColor,
        border: `1px solid ${styles.borderColor}`,
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
        style={{ color: styles.iconColor }}
      >
        {icon}
      </span>
      <div className="min-w-0 space-y-1">
        <p
          className="text-[13px]"
          style={{ color: styles.titleColor, fontWeight: 600 }}
        >
          {title}
        </p>
        <p
          className="text-[12.5px] leading-[1.55]"
          style={{ color: styles.bodyColor, fontWeight: 500 }}
        >
          {body}
        </p>
      </div>
    </motion.div>
  );
}

// ── Jira workspace 선택 UI ─────────────────────────────────────────────────────

type JiraWorkspacePickerProps = {
  tenantId: string;
  onUpdated: () => void;
};

function JiraWorkspacePicker({
  tenantId,
  onUpdated,
}: JiraWorkspacePickerProps) {
  const [resources, setResources] = useState<JiraResource[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<JiraResourcesResponse>(
          `/api/v1/oauth/jira/resources?tenant_id=${encodeURIComponent(tenantId)}`,
        );
        if (cancelled) return;
        setResources(data.resources);
        setSelected(
          data.selected_resource?.id ?? data.resources[0]?.id ?? null,
        );
      } catch (err) {
        if (!cancelled) {
          console.error("[integrations] Jira resources 조회 실패", err);
          toast.error("Jira 워크스페이스 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/oauth/jira/select-workspace", {
        method: "POST",
        body: JSON.stringify({ tenant_id: tenantId, cloud_id: selected }),
      });
      toast.success("Jira 워크스페이스가 저장되었습니다.");
      onUpdated();
    } catch (err) {
      console.error("[integrations] Jira workspace 저장 실패", err);
      toast.error("Jira 워크스페이스 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[12px] p-5"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(155,104,41,0.25)",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Bug className="h-4 w-4" style={{ color: "#9b6829" }} />
        <h3
          className="text-soft-wrap text-[15px] tracking-[-0.01em]"
          style={{
            color: "#061b31",
            fontFamily: "var(--hds-font-display)",
            fontWeight: 700,
          }}
        >
          Jira 워크스페이스 선택
        </h3>
      </div>
      <p
        className="text-soft-wrap mt-1 text-[12.5px] leading-[1.55]"
        style={{ color: "#64748d", fontWeight: 500 }}
      >
        연결된 Atlassian 계정에 여러 워크스페이스가 있습니다. 사용할
        워크스페이스를 하나 선택해 주세요.
      </p>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-[13px]" style={{ color: "#64748d" }}>
            목록을 불러오는 중...
          </p>
        ) : resources.length === 0 ? (
          <p className="text-[13px]" style={{ color: "#64748d" }}>
            사용 가능한 워크스페이스가 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {resources.map((resource) => {
              const isSelected = selected === resource.id;
              return (
                <li key={resource.id}>
                  <label
                    className="flex min-w-0 cursor-pointer items-start gap-3 rounded-[8px] p-3 transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(83,58,253,0.05)"
                        : "#ffffff",
                      border: isSelected
                        ? "1px solid #533afd"
                        : "1px solid #e5edf5",
                    }}
                  >
                    <input
                      type="radio"
                      name="jira-workspace"
                      value={resource.id}
                      checked={isSelected}
                      onChange={() => setSelected(resource.id)}
                      className="mt-1 accent-[#533afd]"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[13px]"
                        style={{ color: "#061b31", fontWeight: 600 }}
                      >
                        {resource.name || resource.id}
                      </div>
                      {resource.url ? (
                        <div
                          className="truncate text-[11.5px]"
                          style={{
                            color: "#64748d",
                            fontFamily: "var(--hds-font-mono)",
                            fontWeight: 500,
                          }}
                        >
                          {resource.url}
                        </div>
                      ) : null}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || submitting || resources.length === 0}
            className="no-text-break inline-flex h-9 items-center rounded-[6px] px-4 text-[13px] transition-all"
            style={getButtonStyle(
              "primary",
              !selected || submitting || resources.length === 0,
            )}
          >
            {submitting ? "저장 중..." : "워크스페이스 저장"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default IntegrationsPage;
