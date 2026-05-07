import { motion } from "framer-motion"
import { Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatDateTime,
  formatDuration,
  getCallStatusLabel,
  getEmotionLabel,
  getResolutionStatusLabel,
} from "@/features/calls/callsAdapters"
import type { DashboardRecentCall } from "@/features/dashboard/dashboardTypes"

const priorityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  normal: "Normal",
  low: "Low",
}

function PriorityBadge({ priority }: { priority: string | null }) {
  const priorityKey = priority?.toLowerCase() ?? "normal"
  const label = priorityLabels[priorityKey] ?? priority ?? "Normal"

  if (priorityKey === "critical") {
    return (
      <Badge className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100">
        {label}
      </Badge>
    )
  }

  if (priorityKey === "high") {
    return (
      <Badge className="border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100">
        {label}
      </Badge>
    )
  }

  return (
    <Badge className="border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100">
      {label}
    </Badge>
  )
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: DashboardRecentCall["customer_emotion"]
}) {
  if (sentiment === "negative" || sentiment === "angry") {
    return (
      <span className="inline-flex items-center text-xs text-red-600">
        <span className="mr-1 h-2 w-2 rounded-full bg-red-500" />
        {getEmotionLabel(sentiment ?? undefined)}
      </span>
    )
  }

  if (sentiment === "positive") {
    return (
      <span className="inline-flex items-center text-xs text-teal-600">
        <span className="mr-1 h-2 w-2 rounded-full bg-teal-500" />
        {getEmotionLabel(sentiment)}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center text-xs text-gray-500">
      <span className="mr-1 h-2 w-2 rounded-full bg-gray-400" />
      {getEmotionLabel(sentiment ?? undefined)}
    </span>
  )
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.3 + i * 0.05,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
}

function CallListSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: 9 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function CallList({
  calls,
  isLoading,
  error,
}: {
  calls: DashboardRecentCall[]
  isLoading: boolean
  error: Error | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
    >
      <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">후속 조치 필요 콜 리스트</CardTitle>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" size="sm" className="transition-all duration-200 hover:shadow-sm">
              전체 보기
            </Button>
          </motion.div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>상태/시작</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>요약</TableHead>
                <TableHead>우선순위</TableHead>
                <TableHead>감정</TableHead>
                <TableHead>해결 상태</TableHead>
                <TableHead>통화 시간</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <CallListSkeleton /> : null}

              {!isLoading && error ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    최근 통화 데이터를 불러오지 못했습니다.
                  </TableCell>
                </TableRow>
              ) : null}

              {!isLoading && !error && calls.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    최근 통화가 없습니다.
                  </TableCell>
                </TableRow>
              ) : null}

              {calls.map((call, idx) => (
                <motion.tr
                  key={call.id}
                  custom={idx}
                  initial="hidden"
                  animate="visible"
                  variants={rowVariants}
                  whileHover={{ backgroundColor: "rgba(13, 148, 136, 0.03)" }}
                  className="border-b transition-colors"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {call.id}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="font-normal">
                        {getCallStatusLabel(call.status)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(call.started_at)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {call.caller_number ?? "번호 없음"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {call.summary_short ?? "요약 없음"}
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={call.priority} />
                  </TableCell>
                  <TableCell>
                    <SentimentBadge sentiment={call.customer_emotion} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getResolutionStatusLabel(call.resolution_status ?? undefined)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(call.duration_sec)}
                  </TableCell>
                  <TableCell className="text-right">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        className="gap-1 transition-all duration-200 hover:shadow-md hover:shadow-primary/20"
                      >
                        <Phone className="h-3 w-3" />
                        연결
                      </Button>
                    </motion.div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
