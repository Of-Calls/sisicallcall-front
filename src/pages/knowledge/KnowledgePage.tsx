import { useCallback, useEffect, useState } from "react"
import type { ChangeEvent, DragEvent, ReactNode } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  useDeleteTenantDocument,
  useReindexTenantDocument,
  useTenantDocumentChunks,
  useTenantDocuments,
  useUpdateTenantDocumentChunk,
  useUploadTenantDocument,
} from "@/features/documents/documentQueries"
import type {
  RagDocumentChunk,
  TenantDocument,
} from "@/features/documents/documentTypes"
import { cn } from "@/lib/utils"
import {
  buildDocumentTopicViews,
  buildTopicReviewItems,
  documentStatusLabelMap,
  type DocumentTopicReviewItem,
  type DocumentTopicView,
  type TopicChunkView,
} from "@/pages/knowledge/knowledgeViewModels"
import { useAuthStore } from "@/shared/auth/authStore"

const documentQueryParams = {
  offset: 0,
  limit: 20,
} as const

const DOCUMENT_TABLE_COLUMN_COUNT = 6
const readyStatuses = new Set(["ready", "completed"])
const failedStatuses = new Set(["failed", "error"])

type KnowledgeTab = "topics" | "questions" | "review" | "advanced"
type EditingChunkText = Record<string, string>

const statusConfig: Record<
  string,
  { label: string; color: string; icon: ReactNode }
> = {
  processing: {
    label: documentStatusLabelMap.processing,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  ready: {
    label: documentStatusLabelMap.ready,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  completed: {
    label: documentStatusLabelMap.completed,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: documentStatusLabelMap.failed,
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  error: {
    label: documentStatusLabelMap.error,
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
}

function getStatusConfig(status: string) {
  return (
    statusConfig[status] ?? {
      label: status || "상태 확인 중",
      color: "bg-slate-100 text-slate-700 border-slate-200",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    }
  )
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "시간 정보 없음"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "반영 이력 없음"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function formatPageLabel(sourcePages: number[]) {
  if (sourcePages.length === 0) {
    return "출처 페이지 정보 없음"
  }

  return sourcePages.map((page) => `p.${page}`).join(", ")
}

function matchesTopicSearch(topic: DocumentTopicView, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return true
  }

  const searchableText = [
    topic.title,
    topic.category ?? "",
    topic.answerText,
    ...topic.exampleQuestions,
  ]
    .join("\n")
    .toLowerCase()

  return searchableText.includes(normalizedKeyword)
}

function getTopicCountLabel(count: number | null | undefined) {
  if (typeof count !== "number") {
    return "-"
  }

  return count.toLocaleString("ko-KR")
}

function DocumentTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: DOCUMENT_TABLE_COLUMN_COUNT }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function TopicListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  )
}

function SheetStatusNotice({
  status,
  onReindex,
  isActionDisabled,
}: {
  status: string
  onReindex: () => void
  isActionDisabled: boolean
}) {
  if (status === "processing") {
    return (
      <Card className="border-blue-200 bg-blue-50/70">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-blue-600" />
            <div className="space-y-2">
              <p className="font-medium text-blue-900">문서를 정리하는 중입니다</p>
              <p className="text-sm text-blue-800">
                준비가 완료되면 이 문서에서 정리된 주제와 상담 답변 내용을 확인할 수 있습니다.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isActionDisabled}
                onClick={onReindex}
                className="border-blue-200 bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
              >
                다시 정리하기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (failedStatuses.has(status)) {
    return (
      <Card className="border-red-200 bg-red-50/70">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div className="space-y-2">
              <p className="font-medium text-red-900">문서 처리에 실패했습니다</p>
              <p className="text-sm text-red-800">
                다시 정리하기를 눌러 주시면 문서를 다시 분석해서 상담 지식으로 준비합니다.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isActionDisabled}
                onClick={onReindex}
                className="border-red-200 bg-white text-red-700 hover:bg-red-100 hover:text-red-800"
              >
                다시 정리하기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

function DocumentRow({
  document,
  topicCount,
  isSelected,
  isDeleting,
  isActionDisabled,
  onOpen,
  onDelete,
}: {
  document: TenantDocument
  topicCount: number | null
  isSelected: boolean
  isDeleting: boolean
  isActionDisabled: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const status = getStatusConfig(document.status)

  return (
    <TableRow className={cn(isSelected && "bg-primary/5")}>
      <TableCell>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">{document.file_name}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(document.uploaded_at)}
      </TableCell>
      <TableCell>
        <Badge className={cn("gap-1 border font-normal", status.color)}>
          {status.icon}
          {status.label}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {getTopicCountLabel(topicCount)}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant={isSelected ? "secondary" : "outline"}
          size="sm"
          disabled={isActionDisabled}
          onClick={onOpen}
          aria-label={`${document.file_name} 내용 보기`}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          내용 보기
        </Button>
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDeleting}
          onClick={onDelete}
          aria-label={`${document.file_name} 삭제`}
          className="gap-2 text-muted-foreground hover:text-red-500"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          삭제
        </Button>
      </TableCell>
    </TableRow>
  )
}

function TopicDetailPanel({
  topic,
  editingChunkId,
  editingChunkText,
  isSaving,
  savingChunkId,
  onStartEditing,
  onCancelEditing,
  onChangeChunkText,
  onSaveChunk,
  onOpenAdvanced,
}: {
  topic: DocumentTopicView
  editingChunkId: string | null
  editingChunkText: EditingChunkText
  isSaving: boolean
  savingChunkId: string | null
  onStartEditing: (chunk: TopicChunkView) => void
  onCancelEditing: () => void
  onChangeChunkText: (chunkId: string, value: string) => void
  onSaveChunk: (chunkId: string) => void
  onOpenAdvanced: () => void
}) {
  const primaryChunk = topic.rawChunks[0] ?? null

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-xl">{topic.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {topic.category ? <Badge variant="outline">{topic.category}</Badge> : null}
              {!topic.isEnabled ? <Badge variant="outline">사용 안 함</Badge> : null}
              <span>관련 원문 {formatPageLabel(topic.sourcePages)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {primaryChunk ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => onStartEditing(primaryChunk)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                내용 수정
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" disabled>
              사용 안 함
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onOpenAdvanced}>
              원문 보기
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <section className="space-y-2">
          <h3 className="font-semibold text-foreground">상담원이 답변할 내용</h3>
          <div className="rounded-xl bg-muted/40 p-4 text-sm leading-6 text-foreground">
            {topic.answerText || "정리된 답변 내용이 없습니다."}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-foreground">고객이 이렇게 물어볼 수 있어요</h3>
          {topic.exampleQuestions.length > 0 ? (
            <ul className="space-y-2 text-sm text-foreground">
              {topic.exampleQuestions.map((question) => (
                <li key={question} className="rounded-lg border bg-background px-3 py-2">
                  - {question}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">예시 질문이 아직 없습니다.</p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-foreground">관련 원문</h3>
          <p className="text-sm text-muted-foreground">
            {formatPageLabel(topic.sourcePages)}에서 가져온 내용
          </p>
        </section>

        {topic.rawChunks.length > 1 ? (
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">세부 답변 항목</h3>
            {topic.rawChunks.map((rawChunk, index) => {
              const isEditing = editingChunkId === rawChunk.id
              const currentText = editingChunkText[rawChunk.id] ?? rawChunk.content
              const canSave =
                currentText.trim().length > 0 &&
                currentText !== rawChunk.content &&
                !isSaving

              return (
                <div key={rawChunk.id} className="rounded-xl border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">답변 항목 {index + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        {rawChunk.pageNumber ? `p.${rawChunk.pageNumber}` : "페이지 정보 없음"}
                        {rawChunk.updatedAt ? ` · 수정 ${formatDateTime(rawChunk.updatedAt)}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => onStartEditing(rawChunk)}
                    >
                      이 항목 수정
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 space-y-3">
                      <Textarea
                        value={currentText}
                        onChange={(event) => onChangeChunkText(rawChunk.id, event.target.value)}
                        disabled={isSaving}
                        className="min-h-32 resize-y bg-background"
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={onCancelEditing}>
                          취소
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!canSave}
                          onClick={() => onSaveChunk(rawChunk.id)}
                          className="gap-2"
                        >
                          {savingChunkId === rawChunk.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          저장
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-foreground">{rawChunk.content}</p>
                  )}
                </div>
              )
            })}
          </section>
        ) : null}

        {primaryChunk && topic.rawChunks.length === 1 && editingChunkId === primaryChunk.id ? (
          <section className="space-y-3 rounded-xl border bg-background p-4">
            <h3 className="font-semibold text-foreground">내용 수정</h3>
            <Textarea
              value={editingChunkText[primaryChunk.id] ?? primaryChunk.content}
              onChange={(event) => onChangeChunkText(primaryChunk.id, event.target.value)}
              disabled={isSaving}
              className="min-h-40 resize-y bg-background"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onCancelEditing}>
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  isSaving ||
                  !(editingChunkText[primaryChunk.id] ?? primaryChunk.content).trim() ||
                  (editingChunkText[primaryChunk.id] ?? primaryChunk.content) === primaryChunk.content
                }
                onClick={() => onSaveChunk(primaryChunk.id)}
                className="gap-2"
              >
                {savingChunkId === primaryChunk.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                저장
              </Button>
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  )
}

function QuestionsTab({
  topics,
  onTestQuestion,
}: {
  topics: DocumentTopicView[]
  onTestQuestion: () => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>이 문서로 답변 가능한 질문</CardTitle>
          <CardDescription>
            고객이 자주 물어볼 만한 질문을 주제별로 정리했습니다.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onTestQuestion}>
          질문 테스트
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.map((topic) => (
          <div key={topic.id} className="rounded-xl border bg-background p-4">
            <p className="font-semibold text-foreground">{topic.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {topic.exampleQuestions.map((question) => (
                <li key={`${topic.id}-${question}`}>- {question}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ReviewTab({
  reviewItems,
  onSelectTopic,
  onEditChunk,
  onOpenAdvanced,
}: {
  reviewItems: DocumentTopicReviewItem[]
  onSelectTopic: (topicId: string) => void
  onEditChunk: (topicId: string, chunkId: string | null) => void
  onOpenAdvanced: (topicId: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>확인이 필요한 내용</CardTitle>
        <CardDescription>
          AI 상담 지식으로 쓰기 전에 한 번 더 보면 좋은 항목입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviewItems.map((item, index) => (
          <div key={item.id} className="rounded-xl border bg-background p-4">
            <p className="font-semibold text-foreground">
              {index + 1}. {item.title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onSelectTopic(item.topicId)}>
                주제 보기
              </Button>
              {item.reason === "missing-page" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenAdvanced(item.topicId)}
                >
                  {item.actionLabel}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditChunk(item.topicId, item.chunkId)}
                >
                  {item.actionLabel}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AdvancedTab({
  document,
  chunks,
  editingChunkId,
  editingChunkText,
  isSaving,
  savingChunkId,
  onStartEditing,
  onCancelEditing,
  onChangeChunkText,
  onSaveChunk,
}: {
  document: TenantDocument
  chunks: RagDocumentChunk[]
  editingChunkId: string | null
  editingChunkText: EditingChunkText
  isSaving: boolean
  savingChunkId: string | null
  onStartEditing: (chunk: RagDocumentChunk) => void
  onCancelEditing: () => void
  onChangeChunkText: (chunkId: string, value: string) => void
  onSaveChunk: (chunkId: string) => void
}) {
  const status = getStatusConfig(document.status)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>원문 / 고급 정보</CardTitle>
          <CardDescription>
            개발자 또는 고급 관리자용 정보입니다. 기본 화면에서는 숨겨진 값이 이 탭에 모여 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">document id</p>
            <p className="mt-1 font-medium text-foreground">{document.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">status</p>
            <Badge className={cn("mt-1 gap-1 border font-normal", status.color)}>
              {status.icon}
              {status.label}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">uploaded_at</p>
            <p className="mt-1 font-medium text-foreground">{formatDateTime(document.uploaded_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">indexed_at</p>
            <p className="mt-1 font-medium text-foreground">{formatDateTime(document.indexed_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">created_at</p>
            <p className="mt-1 font-medium text-foreground">{formatDateTime(document.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">updated_at</p>
            <p className="mt-1 font-medium text-foreground">{formatDateTime(document.updated_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">file_type</p>
            <p className="mt-1 font-medium text-foreground">{document.file_type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">chroma collection</p>
            <p className="mt-1 font-medium text-foreground">{document.chroma_collection ?? "-"}</p>
          </div>
        </CardContent>
      </Card>

      {chunks.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            표시할 원문 데이터가 없습니다.
          </CardContent>
        </Card>
      ) : null}

      {chunks.map((chunk) => {
        const isEditing = editingChunkId === chunk.id
        const currentText = editingChunkText[chunk.id] ?? chunk.content
        const canSave = currentText.trim().length > 0 && currentText !== chunk.content && !isSaving

        return (
          <Card key={chunk.id}>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">chunk id {chunk.id}</Badge>
                  <Badge variant="outline">page {chunk.page_number ?? "-"}</Badge>
                  <Badge variant="outline">chunk index {chunk.chunk_index}</Badge>
                  {chunk.embedding_status ? (
                    <Badge variant="outline">embedding {chunk.embedding_status}</Badge>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => onStartEditing(chunk)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  원문 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={currentText}
                    onChange={(event) => onChangeChunkText(chunk.id, event.target.value)}
                    disabled={isSaving}
                    className="min-h-40 resize-y bg-background"
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={onCancelEditing}>
                      취소
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!canSave}
                      onClick={() => onSaveChunk(chunk.id)}
                      className="gap-2"
                    >
                      {savingChunkId === chunk.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/20 p-4 text-sm leading-6 text-foreground">
                  {chunk.content}
                </div>
              )}

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">document id</p>
                  <p className="mt-1 break-all text-foreground">{chunk.document_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">chroma id</p>
                  <p className="mt-1 break-all text-foreground">{chunk.chroma_id ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">created_at</p>
                  <p className="mt-1 text-foreground">{formatDateTime(chunk.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">updated_at</p>
                  <p className="mt-1 text-foreground">{formatDateTime(chunk.updated_at)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">metadata JSON</p>
                <pre className="overflow-x-auto rounded-xl border bg-muted/20 p-4 text-xs leading-6 text-foreground">
                  {JSON.stringify(chunk.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function KnowledgePage() {
  const tenantId = useAuthStore((state) => state.tenant?.id)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("topics")
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null)
  const [editingChunkText, setEditingChunkText] = useState<EditingChunkText>({})
  const [savingChunkId, setSavingChunkId] = useState<string | null>(null)
  const [chunkFeedback, setChunkFeedback] = useState<string | null>(null)
  const [chunkError, setChunkError] = useState<string | null>(null)

  const documentsQuery = useTenantDocuments(tenantId, documentQueryParams)
  const chunksQuery = useTenantDocumentChunks(tenantId, selectedDocumentId)
  const { mutateAsync: uploadDocument, isPending: isUploading } =
    useUploadTenantDocument(tenantId)
  const { mutateAsync: deleteDocument } = useDeleteTenantDocument(tenantId)
  const { mutateAsync: updateChunk, isPending: isUpdatingChunk } =
    useUpdateTenantDocumentChunk(tenantId, selectedDocumentId)
  const { mutateAsync: reindexDocument, isPending: isReindexingDocument } =
    useReindexTenantDocument(tenantId, selectedDocumentId)

  const documents = documentsQuery.data?.items ?? []
  const totalDocuments = documentsQuery.data?.total ?? documents.length
  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? null
  const chunks = chunksQuery.data?.items ?? []
  const isUploadDisabled = !tenantId || isUploading
  const isChunkMutationPending = isUpdatingChunk || isReindexingDocument
  const topicViews = buildDocumentTopicViews(chunks)
  const filteredTopics = topicViews.filter((topic) => matchesTopicSearch(topic, searchKeyword))
  const selectedTopic =
    filteredTopics.find((topic) => topic.id === selectedTopicId) ??
    filteredTopics[0] ??
    null
  const reviewItems = buildTopicReviewItems(filteredTopics)
  const isDocumentReady = selectedDocument ? readyStatuses.has(selectedDocument.status) : false
  const selectedDocumentTopicCount = selectedDocument ? topicViews.length : null

  useEffect(() => {
    if (!selectedDocumentId) {
      return
    }

    if (!documents.some((document) => document.id === selectedDocumentId)) {
      setSelectedDocumentId(null)
      setSelectedTopicId(null)
      setEditingChunkId(null)
      setChunkFeedback(null)
      setChunkError(null)
    }
  }, [documents, selectedDocumentId])

  useEffect(() => {
    if (filteredTopics.length === 0) {
      if (selectedTopicId) {
        setSelectedTopicId(null)
      }
      return
    }

    if (!selectedTopicId || !filteredTopics.some((topic) => topic.id === selectedTopicId)) {
      setSelectedTopicId(filteredTopics[0].id)
    }
  }, [filteredTopics, selectedTopicId])

  const resetSheetState = useCallback((clearSelectedDocument: boolean) => {
    if (clearSelectedDocument) {
      setSelectedDocumentId(null)
    }
    setActiveTab("topics")
    setSelectedTopicId(null)
    setSearchKeyword("")
    setEditingChunkId(null)
    setEditingChunkText({})
    setSavingChunkId(null)
    setChunkFeedback(null)
    setChunkError(null)
  }, [])

  const uploadPdfFiles = useCallback(
    async (files: File[]) => {
      setUploadError(null)

      if (!tenantId) {
        setUploadError("회사 정보를 확인한 뒤 문서를 업로드해 주세요.")
        return
      }

      const pdfFiles = files.filter(isPdfFile)
      if (pdfFiles.length === 0) {
        setUploadError("PDF 파일만 업로드할 수 있습니다.")
        return
      }

      if (pdfFiles.length !== files.length) {
        setUploadError("PDF가 아닌 파일은 제외했습니다.")
      }

      try {
        await Promise.all(pdfFiles.map((file) => uploadDocument(file)))
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "문서 업로드에 실패했습니다.",
        )
      }
    },
    [tenantId, uploadDocument],
  )

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (!isUploadDisabled) {
        setIsDragging(true)
      }
    },
    [isUploadDisabled],
  )

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)

      if (isUploadDisabled) {
        return
      }

      void uploadPdfFiles(Array.from(event.dataTransfer.files))
    },
    [isUploadDisabled, uploadPdfFiles],
  )

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (isUploadDisabled) {
        event.target.value = ""
        return
      }

      void uploadPdfFiles(Array.from(event.target.files || []))
      event.target.value = ""
    },
    [isUploadDisabled, uploadPdfFiles],
  )

  const handleDelete = useCallback(
    async (documentId: string) => {
      if (!tenantId) {
        return
      }

      setDeleteError(null)
      setDeletingDocumentId(documentId)

      try {
        await deleteDocument(documentId)
        if (selectedDocumentId === documentId) {
          resetSheetState(true)
        }
      } catch (error) {
        setDeleteError(
          error instanceof Error ? error.message : "문서를 삭제하지 못했습니다.",
        )
      } finally {
        setDeletingDocumentId(null)
      }
    },
    [deleteDocument, resetSheetState, selectedDocumentId, tenantId],
  )

  const handleOpenDocument = useCallback((document: TenantDocument) => {
    setSelectedDocumentId(document.id)
    setActiveTab("topics")
    setSelectedTopicId(null)
    setSearchKeyword("")
    setEditingChunkId(null)
    setEditingChunkText({})
    setChunkFeedback(null)
    setChunkError(null)
  }, [])

  const handleChangeChunkText = useCallback((chunkId: string, value: string) => {
    setEditingChunkText((prev) => ({
      ...prev,
      [chunkId]: value,
    }))
  }, [])

  const handleStartEditingTopicChunk = useCallback((chunk: TopicChunkView) => {
    setEditingChunkId(chunk.id)
    setEditingChunkText((prev) => ({
      ...prev,
      [chunk.id]: prev[chunk.id] ?? chunk.content,
    }))
    setChunkFeedback(null)
    setChunkError(null)
  }, [])

  const handleStartEditingRawChunk = useCallback((chunk: RagDocumentChunk) => {
    setEditingChunkId(chunk.id)
    setEditingChunkText((prev) => ({
      ...prev,
      [chunk.id]: prev[chunk.id] ?? chunk.content,
    }))
    setChunkFeedback(null)
    setChunkError(null)
  }, [])

  const handleCancelEditing = useCallback(() => {
    setEditingChunkId(null)
    setChunkError(null)
  }, [])

  const handleSaveChunk = useCallback(
    async (chunkId: string) => {
      if (!tenantId) {
        setChunkError("회사 정보를 확인해 주세요.")
        return
      }

      if (!selectedDocumentId) {
        setChunkError("문서 정보를 확인할 수 없습니다.")
        return
      }

      const chunk = chunks.find((item) => item.id === chunkId)
      if (!chunk) {
        setChunkError("수정할 내용을 찾지 못했습니다.")
        return
      }

      const nextContent = (editingChunkText[chunk.id] ?? chunk.content).trim()
      if (!nextContent) {
        setChunkError("답변 내용은 비워둘 수 없습니다.")
        return
      }

      if (nextContent === chunk.content) {
        setChunkError("변경된 내용이 없습니다.")
        return
      }

      setSavingChunkId(chunk.id)
      setChunkFeedback(null)
      setChunkError(null)

      try {
        await updateChunk({
          chunkId: chunk.id,
          payload: {
            content: nextContent,
            metadata: chunk.metadata ?? {},
          },
        })
      } catch (error) {
        setChunkError(
          error instanceof Error ? error.message : "내용 수정에 실패했습니다.",
        )
        setSavingChunkId(null)
        return
      }

      setEditingChunkText((prev) => ({
        ...prev,
        [chunk.id]: nextContent,
      }))

      try {
        await reindexDocument()
        setChunkFeedback("내용을 수정하고 다시 정리했습니다.")
        setEditingChunkId(null)
      } catch (error) {
        setChunkError(
          error instanceof Error
            ? error.message
            : "내용은 저장됐지만 다시 정리하기에 실패했습니다. 다시 시도해 주세요.",
        )
      } finally {
        setSavingChunkId(null)
      }
    },
    [chunks, editingChunkText, reindexDocument, selectedDocumentId, tenantId, updateChunk],
  )

  const handleReindex = useCallback(async () => {
    if (!tenantId) {
      setChunkError("회사 정보를 확인해 주세요.")
      return
    }

    if (!selectedDocumentId) {
      setChunkError("문서 정보를 확인할 수 없습니다.")
      return
    }

    setChunkFeedback(null)
    setChunkError(null)

    try {
      await reindexDocument()
      setChunkFeedback("문서를 다시 정리하도록 요청했습니다.")
    } catch (error) {
      setChunkError(
        error instanceof Error ? error.message : "다시 정리하기 요청에 실패했습니다.",
      )
    }
  }, [reindexDocument, selectedDocumentId, tenantId])

  const handleQuestionTest = useCallback(() => {
    toast.info("질문 테스트 기능은 준비 중입니다.")
  }, [])

  const handleDocumentTest = useCallback(() => {
    toast.info("상담 응답 테스트 기능은 준비 중입니다.")
  }, [])

  const handleReviewSelectTopic = useCallback((topicId: string) => {
    setActiveTab("topics")
    setSelectedTopicId(topicId)
  }, [])

  const handleReviewEditChunk = useCallback(
    (topicId: string, chunkId: string | null) => {
      setActiveTab("topics")
      setSelectedTopicId(topicId)

      const topic = topicViews.find((item) => item.id === topicId)
      const rawChunk = topic?.rawChunks.find((item) => item.id === chunkId) ?? topic?.rawChunks[0] ?? null

      if (rawChunk) {
        handleStartEditingTopicChunk(rawChunk)
      }
    },
    [handleStartEditingTopicChunk, topicViews],
  )

  const handleOpenAdvancedFromTopic = useCallback((topicId?: string) => {
    if (topicId) {
      setSelectedTopicId(topicId)
    }
    setActiveTab("advanced")
  }, [])

  const selectedDocumentStatus = selectedDocument?.status ?? ""

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">상담 지식 정리</h1>
          <p className="text-sm text-muted-foreground">
            AI 상담원이 참고할 PDF 문서를 업로드하고, 주제별 상담 지식을 확인하고 다듬습니다.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>총 {totalDocuments}개 문서</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileUp className="h-5 w-5 text-primary" />
              PDF 문서 업로드
            </CardTitle>
            <CardDescription>
              상담 매뉴얼, 운영 안내, 예약 규정 같은 문서를 업로드하면 AI 상담원이 참고할 지식으로 정리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border bg-background",
                isUploadDisabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
              )}
            >
              <div
                className={cn(
                  "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
                  isDragging ? "bg-primary/20" : "bg-muted",
                )}
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Upload
                    className={cn(
                      "h-8 w-8",
                      isDragging ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                )}
              </div>

              <p className="mb-1 text-lg font-medium text-foreground">
                {isUploading
                  ? "PDF 문서를 업로드하고 있습니다"
                  : isDragging
                    ? "여기에 파일을 놓아 주세요"
                    : "PDF 파일을 드래그하거나 업로드해 주세요"}
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                또는 클릭해서 파일을 선택할 수 있습니다.
              </p>

              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                disabled={isUploadDisabled}
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />

              <Button variant="outline" className="pointer-events-none">
                {isUploading ? "업로드 중..." : "파일 선택"}
              </Button>

              <p className="mt-4 text-xs text-muted-foreground">
                PDF 형식만 지원합니다. (최대 50MB)
              </p>
            </div>

            {uploadError ? <p className="mt-3 text-sm text-red-600">{uploadError}</p> : null}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              업로드된 문서 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deleteError ? <p className="mb-3 text-sm text-red-600">{deleteError}</p> : null}

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">문서명</TableHead>
                  <TableHead className="font-semibold">등록일</TableHead>
                  <TableHead className="font-semibold">준비 상태</TableHead>
                  <TableHead className="font-semibold">정리된 주제 수</TableHead>
                  <TableHead className="font-semibold">내용 보기</TableHead>
                  <TableHead className="font-semibold">삭제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!tenantId ? (
                  <TableRow>
                    <TableCell
                      colSpan={DOCUMENT_TABLE_COLUMN_COUNT}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      회사 정보를 확인하고 있습니다.
                    </TableCell>
                  </TableRow>
                ) : null}

                {tenantId && documentsQuery.isLoading ? <DocumentTableSkeleton /> : null}

                {tenantId && documentsQuery.isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={DOCUMENT_TABLE_COLUMN_COUNT}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      문서 목록을 불러오지 못했습니다. {documentsQuery.error.message}
                    </TableCell>
                  </TableRow>
                ) : null}

                {tenantId &&
                !documentsQuery.isLoading &&
                !documentsQuery.isError &&
                documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={DOCUMENT_TABLE_COLUMN_COUNT}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      등록된 문서가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : null}

                {documents.map((document) => (
                  <DocumentRow
                    key={document.id}
                    document={document}
                    topicCount={
                      selectedDocument?.id === document.id
                        ? selectedDocumentTopicCount
                        : document.chunk_count
                    }
                    isSelected={selectedDocumentId === document.id}
                    isDeleting={deletingDocumentId === document.id}
                    isActionDisabled={isChunkMutationPending}
                    onOpen={() => handleOpenDocument(document)}
                    onDelete={() => void handleDelete(document.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <Sheet
        open={Boolean(selectedDocumentId)}
        onOpenChange={(open) => {
          if (!open && !isChunkMutationPending) {
            resetSheetState(true)
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto px-0 sm:max-w-5xl">
          {selectedDocument ? (
            <>
              <SheetHeader className="gap-4 border-b border-border px-6 pb-5">
                <div className="pr-10">
                  <SheetTitle className="text-xl">{selectedDocument.file_name}</SheetTitle>
                  <SheetDescription className="mt-1">
                    AI 상담원이 참고할 수 있도록 문서 내용을 주제별로 정리했습니다.
                  </SheetDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge
                    className={cn(
                      "gap-1 border font-normal",
                      getStatusConfig(selectedDocument.status).color,
                    )}
                  >
                    {getStatusConfig(selectedDocument.status).icon}
                    {getStatusConfig(selectedDocument.status).label}
                  </Badge>
                  <span>·</span>
                  <span>주제 {topicViews.length}개</span>
                  <span>·</span>
                  <span>
                    마지막 반영 {formatShortDate(selectedDocument.indexed_at ?? selectedDocument.uploaded_at)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isChunkMutationPending || selectedDocument.status === "processing"}
                    onClick={() => void handleReindex()}
                    className="gap-2"
                  >
                    {isReindexingDocument ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    다시 정리하기
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDocumentTest}>
                    상담 응답 테스트
                  </Button>
                </div>

                {chunkFeedback ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {chunkFeedback}
                  </p>
                ) : null}

                {chunkError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {chunkError}
                  </p>
                ) : null}

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="주제명, 답변 내용, 질문 예시 검색"
                    className="pl-9"
                  />
                </div>
              </SheetHeader>

              <div className="px-6 py-5">
                {chunksQuery.isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                      <TopicListSkeleton />
                      <Skeleton className="h-[520px] w-full rounded-xl" />
                    </div>
                  </div>
                ) : chunksQuery.isError ? (
                  <Card className="border-red-200 bg-red-50/70">
                    <CardContent className="p-6 text-sm text-red-800">
                      문서 내용을 불러오지 못했습니다. {chunksQuery.error.message}
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as KnowledgeTab)}
                    className="gap-4"
                  >
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted p-1 sm:grid-cols-4">
                      <TabsTrigger value="topics" className="py-2">
                        주제별 내용
                      </TabsTrigger>
                      <TabsTrigger value="questions" className="py-2">
                        질문 예시
                      </TabsTrigger>
                      <TabsTrigger value="review" className="py-2">
                        확인 필요
                      </TabsTrigger>
                      <TabsTrigger value="advanced" className="py-2">
                        원문 / 고급 정보
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="topics" className="space-y-4">
                      {!isDocumentReady ? (
                        <SheetStatusNotice
                          status={selectedDocumentStatus}
                          onReindex={() => void handleReindex()}
                          isActionDisabled={isChunkMutationPending}
                        />
                      ) : filteredTopics.length === 0 ? (
                        <Card>
                          <CardContent className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
                            <Sparkles className="h-8 w-8 text-muted-foreground" />
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {searchKeyword.trim()
                                  ? "검색 결과가 없습니다"
                                  : "정리된 주제가 없습니다"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {searchKeyword.trim()
                                  ? "다른 검색어로 다시 찾아보세요."
                                  : "문서를 다시 정리한 뒤 주제별 상담 지식이 표시됩니다."}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                          <Card className="border-border/80">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">주제 목록</CardTitle>
                              <CardDescription>
                                이 문서에서 AI 상담원이 참고할 주제를 모아봤습니다.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <ScrollArea className="h-[560px] pr-3">
                                <div className="space-y-2">
                                  {filteredTopics.map((topic) => (
                                    <button
                                      key={topic.id}
                                      type="button"
                                      onClick={() => setSelectedTopicId(topic.id)}
                                      className={cn(
                                        "w-full rounded-xl border p-3 text-left transition-colors",
                                        selectedTopic?.id === topic.id
                                          ? "border-primary bg-primary/5"
                                          : "border-border bg-background hover:bg-muted/40",
                                      )}
                                    >
                                      <p className="font-medium text-foreground">{topic.title}</p>
                                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                        {topic.summary}
                                      </p>
                                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                        <span>{formatPageLabel(topic.sourcePages)}</span>
                                        {topic.needsReview ? <Badge variant="outline">확인 필요</Badge> : null}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </ScrollArea>
                            </CardContent>
                          </Card>

                          {selectedTopic ? (
                            <TopicDetailPanel
                              topic={selectedTopic}
                              editingChunkId={editingChunkId}
                              editingChunkText={editingChunkText}
                              isSaving={isChunkMutationPending}
                              savingChunkId={savingChunkId}
                              onStartEditing={handleStartEditingTopicChunk}
                              onCancelEditing={handleCancelEditing}
                              onChangeChunkText={handleChangeChunkText}
                              onSaveChunk={(chunkId) => void handleSaveChunk(chunkId)}
                              onOpenAdvanced={() => handleOpenAdvancedFromTopic(selectedTopic.id)}
                            />
                          ) : (
                            <Card>
                              <CardContent className="flex min-h-[520px] items-center justify-center p-6 text-sm text-muted-foreground">
                                선택된 주제가 없습니다.
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="questions" className="space-y-4">
                      {!isDocumentReady ? (
                        <SheetStatusNotice
                          status={selectedDocumentStatus}
                          onReindex={() => void handleReindex()}
                          isActionDisabled={isChunkMutationPending}
                        />
                      ) : filteredTopics.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-sm text-muted-foreground">
                            표시할 질문 예시가 없습니다.
                          </CardContent>
                        </Card>
                      ) : (
                        <QuestionsTab topics={filteredTopics} onTestQuestion={handleQuestionTest} />
                      )}
                    </TabsContent>

                    <TabsContent value="review" className="space-y-4">
                      {!isDocumentReady ? (
                        <SheetStatusNotice
                          status={selectedDocumentStatus}
                          onReindex={() => void handleReindex()}
                          isActionDisabled={isChunkMutationPending}
                        />
                      ) : reviewItems.length === 0 ? (
                        <Card>
                          <CardContent className="flex min-h-60 flex-col items-center justify-center gap-3 p-6 text-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">확인이 필요한 항목이 없습니다</p>
                              <p className="text-sm text-muted-foreground">
                                현재 문서는 주제별 상담 지식으로 바로 활용해도 되는 상태입니다.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <ReviewTab
                          reviewItems={reviewItems}
                          onSelectTopic={handleReviewSelectTopic}
                          onEditChunk={handleReviewEditChunk}
                          onOpenAdvanced={handleOpenAdvancedFromTopic}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="advanced">
                      <AdvancedTab
                        document={selectedDocument}
                        chunks={chunks}
                        editingChunkId={editingChunkId}
                        editingChunkText={editingChunkText}
                        isSaving={isChunkMutationPending}
                        savingChunkId={savingChunkId}
                        onStartEditing={handleStartEditingRawChunk}
                        onCancelEditing={handleCancelEditing}
                        onChangeChunkText={handleChangeChunkText}
                        onSaveChunk={(chunkId) => void handleSaveChunk(chunkId)}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4 p-6">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-[520px] w-full rounded-xl" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
