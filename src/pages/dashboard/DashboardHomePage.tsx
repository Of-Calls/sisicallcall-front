import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { AlertBanner } from "@/components/dashboard/alert-banner"
import { CallList } from "@/components/dashboard/call-list"
import { IntentChart } from "@/components/dashboard/intent-chart"
import { PdfUpload } from "@/components/dashboard/pdf-upload"
import { SentimentChart } from "@/components/dashboard/sentiment-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedSection } from "@/components/ui/animated-section"
import {
  useDashboardEmotionDistribution,
  useDashboardIntentDistribution,
  useDashboardPriorityQueue,
  useDashboardRecentCalls,
  useDashboardStats,
} from "@/features/dashboard/dashboardQueries"
import type {
  DashboardAlert,
  EmotionDistribution,
  DashboardOverview,
} from "@/features/dashboard/dashboardTypes"

const recentCallsQueryParams = {
  limit: 10,
  offset: 0,
} as const

const intentDistributionQueryParams = {
  limit: 5,
} as const

const emptyStats: DashboardOverview = {
  totalCalls: 0,
  resolvedCount: 0,
  resolvedRate: 0,
  escalationCount: 0,
  actionRequiredCount: 0,
  mcpSuccessCount: 0,
  mcpFailedCount: 0,
  partialSuccessCount: 0,
}

const emptyEmotionDistribution: EmotionDistribution = {
  positive: 0,
  neutral: 0,
  negative: 0,
  angry: 0,
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatDateTime(value: string) {
  if (!value) {
    return "시간 정보 없음"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("ko-KR")
}

function StatsGrid({
  stats,
  isLoading,
  error,
}: {
  stats: DashboardOverview
  isLoading: boolean
  error: Error | null
}) {
  const items = [
    { label: "총 통화 수", value: stats.totalCalls.toLocaleString("ko-KR") },
    { label: "해결 완료", value: stats.resolvedCount.toLocaleString("ko-KR") },
    { label: "해결률", value: formatPercent(stats.resolvedRate) },
    { label: "상담원 연결", value: stats.escalationCount.toLocaleString("ko-KR") },
    { label: "조치 필요", value: stats.actionRequiredCount.toLocaleString("ko-KR") },
    { label: "MCP 성공", value: stats.mcpSuccessCount.toLocaleString("ko-KR") },
    { label: "MCP 실패", value: stats.mcpFailedCount.toLocaleString("ko-KR") },
    { label: "부분 성공", value: stats.partialSuccessCount.toLocaleString("ko-KR") },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          대시보드 통계를 불러오지 못했습니다. {error.message}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PriorityQueuePanel({
  alerts,
  isLoading,
  error,
}: {
  alerts: DashboardAlert[]
  isLoading: boolean
  error: Error | null
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          우선순위 알림을 불러오지 못했습니다. {error.message}
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          현재 우선순위 알림이 없습니다.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">우선순위 알림</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className="rounded-lg border bg-background px-3 py-3 text-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-foreground">{alert.reason}</p>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {alert.priority}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              {alert.callerNumber}
              {alert.callId ? ` · ${alert.callId}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateTime(alert.createdAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function DashboardHomePage() {
  const [showAlert, setShowAlert] = useState(true)
  const statsQuery = useDashboardStats()
  const priorityQueueQuery = useDashboardPriorityQueue()
  const recentCallsQuery = useDashboardRecentCalls(recentCallsQueryParams)
  const intentDistributionQuery = useDashboardIntentDistribution(
    intentDistributionQueryParams,
  )
  const emotionDistributionQuery = useDashboardEmotionDistribution()

  const stats = statsQuery.data ?? emptyStats
  const alerts = priorityQueueQuery.data ?? []
  const recentCalls = recentCallsQuery.data?.items ?? []
  const intentDistribution = intentDistributionQuery.data ?? []
  const emotionDistribution =
    emotionDistributionQuery.data ?? emptyEmotionDistribution
  const visibleAlertCount = alerts.length

  return (
    <div className="space-y-6 p-6">
      <AnimatedSection className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
          <p className="text-sm text-muted-foreground">
            실시간 AI 상담 현황을 확인하세요.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          마지막 업데이트: {new Date().toLocaleTimeString("ko-KR")}
        </motion.div>
      </AnimatedSection>

      <StatsGrid
        stats={stats}
        isLoading={statsQuery.isLoading}
        error={statsQuery.error}
      />

      {visibleAlertCount > 0 ? (
        <AlertBanner
          count={visibleAlertCount}
          onDismiss={() => setShowAlert(false)}
          isVisible={showAlert}
        />
      ) : null}

      <PriorityQueuePanel
        alerts={alerts}
        isLoading={priorityQueueQuery.isLoading}
        error={priorityQueueQuery.error}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <SentimentChart
          data={emotionDistribution}
          isLoading={emotionDistributionQuery.isLoading}
          error={emotionDistributionQuery.error}
        />
        <IntentChart
          data={intentDistribution}
          isLoading={intentDistributionQuery.isLoading}
          error={intentDistributionQuery.error}
        />
      </div>

      <CallList
        calls={recentCalls}
        isLoading={recentCallsQuery.isLoading}
        error={recentCallsQuery.error}
      />

      <PdfUpload />
    </div>
  )
}
