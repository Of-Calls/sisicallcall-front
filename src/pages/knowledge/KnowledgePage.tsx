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
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  documentStatusLabelMap,
  type DocumentTopicView,
} from "@/pages/knowledge/knowledgeViewModels"
import { useAuthStore } from "@/shared/auth/authStore"

const documentQueryParams = {
  offset: 0,
  limit: 20,
} as const

const DOCUMENT_TABLE_COLUMN_COUNT = 6
const readyStatuses = new Set(["ready", "completed"])
const failedStatuses = new Set(["failed", "error"])

type KnowledgeTab = "topics" | "questions"
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
    return "페이지 정보 없음"
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
    topic.summary,
    topic.answerText,
    ...topic.keywords,
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
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  )
}

function SheetStatusNotice({
  status,
  isActionDisabled,
  onReindex,
}: {
  status: string
  isActionDisabled: boolean
  onReindex: () => void
}) {
  if (status === "processing") {
    return (
      <Card className="border-blue-200 bg-blue-50/70">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-blue-600" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900">
                문서를 AI 상담 지식으로 정리하는 중입니다.
              </p>
              <p className="text-sm text-blue-800">
                잠시 후 자동으로 사용할 수 있습니다.
              </p>
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
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <div className="space-y-1">
                <p className="font-medium text-red-900">문서 처리에 실패했습니다.</p>
                <p className="text-sm text-red-800">
                  다시 처리하면 문서를 다시 분석해서 상담 지식으로 준비합니다.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isActionDisabled}
              onClick={onReindex}
              className="border-red-200 bg-white text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              문서 다시 처리하기
            </Button>
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
  showSourceDetails,
  onStartEditing,
  onCancelEditing,
  onChangeChunkText,
  onSaveChunk,
  onToggleSourceDetails,
}: {
  topic: DocumentTopicView
  editingChunkId: string | null
  editingChunkText: EditingChunkText
  isSaving: boolean
  savingChunkId: string | null
  showSourceDetails: boolean
  onStartEditing: (chunk: RagDocumentChunk) => void
  onCancelEditing: () => void
  onChangeChunkText: (chunkId: string, value: string) => void
  onSaveChunk: (chunkId: string) => void
  onToggleSourceDetails: () => void
}) {
  const primaryChunk = topic.rawChunks[0] ?? null

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <CardTitle className="text-xl">{topic.title}</CardTitle>
            <div className="space-y-2">
              <p className="text-sm leading-6 text-muted-foreground">{topic.summary}</p>
              {topic.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {topic.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              ) : null}
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
            <Button type="button" variant="outline" size="sm" onClick={onToggleSourceDetails}>
              {showSourceDetails ? "원문 닫기" : "원문 보기"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {topic.keywords.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">키워드</h3>
            <p className="text-sm text-muted-foreground">{topic.keywords.join(" / ")}</p>
          </section>
        ) : null}

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

        {primaryChunk && editingChunkId === primaryChunk.id ? (
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

        {showSourceDetails ? (
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">원문에서 가져온 내용</h3>
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
                      <p className="font-medium text-foreground">원문 항목 {index + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeof rawChunk.page_number === "number"
                          ? `출처 p.${rawChunk.page_number}`
                          : "출처 페이지 정보 없음"}
                        {rawChunk.updated_at ? ` · 수정 ${formatDateTime(rawChunk.updated_at)}` : ""}
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
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{topic.title}</p>
              <p className="text-sm text-muted-foreground">{topic.summary}</p>
            </div>
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

function DeleteDocumentDialog({
  document,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  document: TenantDocument | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={Boolean(document)} onOpenChange={(open) => !open && !isDeleting && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>문서를 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              "{document?.file_name ?? ""}" 문서를 삭제하면 AI 상담원이 더 이상 이 문서 내용을 참고하지 않습니다.
            </span>
            <span className="block">이 작업은 되돌릴 수 없습니다.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function KnowledgePage() {
  const tenantId = useAuthStore((state) => state.tenant?.id)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null)
  const [documentToDelete, setDocumentToDelete] = useState<TenantDocument | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("topics")
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null)
  const [editingChunkText, setEditingChunkText] = useState<EditingChunkText>({})
  const [savingChunkId, setSavingChunkId] = useState<string | null>(null)
  const [chunkError, setChunkError] = useState<string | null>(null)
  const [sourceTopicId, setSourceTopicId] = useState<string | null>(null)

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
  const isDocumentReady = selectedDocument ? readyStatuses.has(selectedDocument.status) : false
  const isFailedDocument = selectedDocument ? failedStatuses.has(selectedDocument.status) : false
  const selectedDocumentTopicCount = selectedDocument ? topicViews.length : null

  useEffect(() => {
    if (!selectedDocumentId) {
      return
    }

    if (!documents.some((document) => document.id === selectedDocumentId)) {
      setSelectedDocumentId(null)
      setSelectedTopicId(null)
      setEditingChunkId(null)
      setChunkError(null)
      setSourceTopicId(null)
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

  useEffect(() => {
    if (!selectedTopic) {
      setSourceTopicId(null)
      return
    }

    if (sourceTopicId && sourceTopicId !== selectedTopic.id) {
      setSourceTopicId(null)
    }
  }, [selectedTopic, sourceTopicId])

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
    setChunkError(null)
    setSourceTopicId(null)
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

  const handleRequestDelete = useCallback((document: TenantDocument) => {
    setDeleteError(null)
    setDocumentToDelete(document)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!tenantId || !documentToDelete) {
      return
    }

    setDeleteError(null)
    setDeletingDocumentId(documentToDelete.id)

    try {
      await deleteDocument(documentToDelete.id)
      if (selectedDocumentId === documentToDelete.id) {
        resetSheetState(true)
      }
      setDocumentToDelete(null)
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "문서를 삭제하지 못했습니다.",
      )
    } finally {
      setDeletingDocumentId(null)
    }
  }, [deleteDocument, documentToDelete, resetSheetState, selectedDocumentId, tenantId])

  const handleOpenDocument = useCallback((document: TenantDocument) => {
    setSelectedDocumentId(document.id)
    setActiveTab("topics")
    setSelectedTopicId(null)
    setSearchKeyword("")
    setEditingChunkId(null)
    setEditingChunkText({})
    setChunkError(null)
    setSourceTopicId(null)
  }, [])

  const handleChangeChunkText = useCallback((chunkId: string, value: string) => {
    setEditingChunkText((prev) => ({
      ...prev,
      [chunkId]: value,
    }))
  }, [])

  const handleStartEditingChunk = useCallback((chunk: RagDocumentChunk) => {
    setEditingChunkId(chunk.id)
    setEditingChunkText((prev) => ({
      ...prev,
      [chunk.id]: prev[chunk.id] ?? chunk.content,
    }))
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
        setEditingChunkId(null)
        toast.success("수정한 내용이 저장되었고 AI 상담 지식에 자동 반영 중입니다.")
      } catch (error) {
        setChunkError(
          error instanceof Error
            ? error.message
            : "내용은 저장됐지만 자동 반영에 실패했습니다. 다시 시도해 주세요.",
        )
      } finally {
        setSavingChunkId(null)
      }
    },
    [chunks, editingChunkText, reindexDocument, selectedDocumentId, tenantId, updateChunk],
  )

  const handleReindexDocument = useCallback(async () => {
    if (!tenantId || !selectedDocumentId) {
      setChunkError("문서 정보를 확인할 수 없습니다.")
      return
    }

    setChunkError(null)

    try {
      await reindexDocument()
      toast.success("문서를 다시 처리하도록 요청했습니다.")
    } catch (error) {
      setChunkError(
        error instanceof Error ? error.message : "문서 다시 처리 요청에 실패했습니다.",
      )
    }
  }, [reindexDocument, selectedDocumentId, tenantId])

  const handleQuestionTest = useCallback(() => {
    toast.info("질문 테스트 기능은 준비 중입니다.")
  }, [])

  const handleDocumentTest = useCallback(() => {
    toast.info("상담 응답 테스트 기능은 준비 중입니다.")
  }, [])

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
                    onDelete={() => handleRequestDelete(document)}
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
                  {isFailedDocument ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isChunkMutationPending}
                      onClick={() => void handleReindexDocument()}
                    >
                      문서 다시 처리하기
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={handleDocumentTest}>
                    상담 응답 테스트
                  </Button>
                </div>

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
                    placeholder="주제명, 요약, 답변 내용, 질문 예시 검색"
                    className="pl-9"
                  />
                </div>
              </SheetHeader>

              <div className="px-6 py-5">
                {chunksQuery.isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
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
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                      <TabsTrigger value="topics" className="py-2">
                        주제별 내용
                      </TabsTrigger>
                      <TabsTrigger value="questions" className="py-2">
                        질문 예시
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="topics" className="space-y-4">
                      {!isDocumentReady ? (
                        <SheetStatusNotice
                          status={selectedDocument.status}
                          isActionDisabled={isChunkMutationPending}
                          onReindex={() => void handleReindexDocument()}
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
                                  : "문서를 다시 처리한 뒤 주제별 상담 지식이 표시됩니다."}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                          <Card className="border-border/80">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">주제 목록</CardTitle>
                              <CardDescription>
                                이 문서에서 AI 상담원이 참고할 상담 지식을 모아봤습니다.
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
                                        "w-full rounded-xl border p-4 text-left transition-colors",
                                        selectedTopic?.id === topic.id
                                          ? "border-primary bg-primary/5"
                                          : "border-border bg-background hover:bg-muted/40",
                                      )}
                                    >
                                      <p className="font-medium text-foreground">{topic.title}</p>
                                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                                        {topic.summary || topic.answerText}
                                      </p>
                                      {topic.keywords.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {topic.keywords.slice(0, 4).map((keyword) => (
                                            <Badge key={`${topic.id}-${keyword}`} variant="outline">
                                              {keyword}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : null}
                                      <p className="mt-3 text-xs text-muted-foreground">
                                        출처 {formatPageLabel(topic.sourcePages)}
                                      </p>
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
                              showSourceDetails={sourceTopicId === selectedTopic.id}
                              onStartEditing={handleStartEditingChunk}
                              onCancelEditing={handleCancelEditing}
                              onChangeChunkText={handleChangeChunkText}
                              onSaveChunk={(chunkId) => void handleSaveChunk(chunkId)}
                              onToggleSourceDetails={() =>
                                setSourceTopicId((prev) =>
                                  prev === selectedTopic.id ? null : selectedTopic.id,
                                )
                              }
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
                          status={selectedDocument.status}
                          isActionDisabled={isChunkMutationPending}
                          onReindex={() => void handleReindexDocument()}
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

      <DeleteDocumentDialog
        document={documentToDelete}
        isDeleting={deletingDocumentId === documentToDelete?.id}
        onCancel={() => setDocumentToDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
