import { useState } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  Bug,
  CalendarDays,
  FileText,
  Link2,
  Mail,
  MessageSquareText,
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
import { cn } from "@/lib/utils"

type IntegrationStatus = "connected" | "available" | "coming_soon" | "disabled"

type IntegrationItem = {
  id: string
  name: string
  description: string
  status: IntegrationStatus
  icon: LucideIcon
}

const integrations: IntegrationItem[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "통화 요약 메일 발송에 사용됩니다.",
    status: "available",
    icon: Mail,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "예약 일정 생성에 사용됩니다.",
    status: "available",
    icon: CalendarDays,
  },
  {
    id: "slack",
    name: "Slack",
    description: "상담 알림과 운영 이슈 공유에 사용할 수 있습니다.",
    status: "coming_soon",
    icon: MessageSquareText,
  },
  {
    id: "notion",
    name: "Notion",
    description: "상담 기록과 운영 문서 관리에 사용할 수 있습니다.",
    status: "coming_soon",
    icon: FileText,
  },
  {
    id: "jira",
    name: "Jira",
    description: "이슈 생성과 후속 작업 관리에 사용할 수 있습니다.",
    status: "coming_soon",
    icon: Bug,
  },
]

const statusMeta: Record<
  IntegrationStatus,
  {
    badgeLabel: string
    badgeClassName: string
    buttonLabel: string
    buttonVariant: "default" | "outline" | "secondary" | "ghost"
    disabled: boolean
  }
> = {
  connected: {
    badgeLabel: "연결됨",
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
    buttonLabel: "연결됨",
    buttonVariant: "secondary",
    disabled: true,
  },
  available: {
    badgeLabel: "연동 가능",
    badgeClassName: "border-teal-200 bg-teal-100 text-teal-700",
    buttonLabel: "연동 준비",
    buttonVariant: "outline",
    disabled: false,
  },
  coming_soon: {
    badgeLabel: "준비 중",
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
    buttonLabel: "준비 중",
    buttonVariant: "outline",
    disabled: true,
  },
  disabled: {
    badgeLabel: "비활성화",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    buttonLabel: "비활성화",
    buttonVariant: "ghost",
    disabled: true,
  },
}

export function IntegrationsPage() {
  const [notice, setNotice] = useState<string | null>(null)

  const handleAvailableClick = (item: IntegrationItem) => {
    setNotice(`${item.name} 연동은 백엔드 OAuth 연동 준비 후 활성화됩니다.`)
  }

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

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <Alert className="border-teal-200 bg-teal-50 text-teal-900">
          <Link2 className="h-4 w-4 text-teal-700" />
          <AlertTitle>연동 UI 사전 구성</AlertTitle>
          <AlertDescription className="text-teal-800">
            현재 단계에서는 실제 OAuth 연결 없이 화면과 상태만 제공합니다. 백엔드
            연동이 준비되면 같은 위치에서 연결 흐름을 활성화할 수 있습니다.
          </AlertDescription>
        </Alert>
      </motion.div>

      {notice ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Alert className="border-blue-200 bg-blue-50 text-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-700" />
            <AlertTitle>안내</AlertTitle>
            <AlertDescription className="text-blue-800">
              {notice}
            </AlertDescription>
          </Alert>
        </motion.div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((item, index) => {
          const meta = statusMeta[item.status]
          const Icon = item.icon

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
                  </div>
                </CardHeader>

                <CardContent className="flex items-end justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {item.status === "available"
                      ? "백엔드 OAuth 연동 준비 후 버튼이 활성 흐름으로 전환됩니다."
                      : "현재는 상태 확인용 UI만 제공됩니다."}
                  </p>
                  <Button
                    type="button"
                    variant={meta.buttonVariant}
                    disabled={meta.disabled}
                    onClick={() => handleAvailableClick(item)}
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

export default IntegrationsPage
