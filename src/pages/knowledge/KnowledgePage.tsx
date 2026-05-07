import { useCallback, useEffect, useState } from "react"
import type { ChangeEvent, DragEvent, ReactNode } from "react"
import { motion } from "framer-motion"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileUp,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
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
import { useAuthStore } from "@/shared/auth/authStore"

const documentQueryParams = {
  offset: 0,
  limit: 20,
} as const

const CHUNK_PAGE_SIZE = 5
const DOCUMENT_TABLE_COLUMN_COUNT = 6

const statusConfig: Partial<Record<string, { label: string; color: string; icon: ReactNode }>> = {
  processing: {
    label: "처리 중",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  ready: {
    label: "Embedding 완료",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: "오류 발생",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
}

type ChunkPageByDocument = Record<string, number>
type EditingChunkText = Record<string, string>

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

  return date.toLocaleString("ko-KR")
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

function ChunkListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: CHUNK_PAGE_SIZE }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full" />
      ))}
    </div>
  )
}

function getChunkSection(metadata: Record<string, unknown>) {
  const value = metadata.section
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function getChunkRangeLabel(page: number, totalChunks: number) {
  if (totalChunks === 0) {
    return "청크 0 / 0"
  }

  const offset = page * CHUNK_PAGE_SIZE
  const start = offset + 1
  const end = Math.min(offset + CHUNK_PAGE_SIZE, totalChunks)
  return `청크 ${start}-${end} / ${totalChunks.toLocaleString("ko-KR")}`
}

function DocumentChunkEditor({
  document,
  chunks,
  totalChunks,
  page,
  editingChunkText,
  feedback,
  error,
  isLoading,
  isError,
  errorMessage,
  isSaving,
  savingChunkId,
  isReindexing,
  onChangePage,
  onChangeChunkText,
  onSaveChunk,
  onReindex,
}: {
  document: TenantDocument
  chunks: RagDocumentChunk[]
  totalChunks: number
  page: number
  editingChunkText: EditingChunkText
  feedback: string | null
  error: string | null
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  isSaving: boolean
  savingChunkId: string | null
  isReindexing: boolean
  onChangePage: (nextPage: number) => void
  onChangeChunkText: (chunkId: string, value: string) => void
  onSaveChunk: (chunk: RagDocumentChunk) => void
  onReindex: () => void
}) {
  const offset = page * CHUNK_PAGE_SIZE
  const visibleChunks = chunks.slice(offset, offset + CHUNK_PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(totalChunks / CHUNK_PAGE_SIZE))
  const hasPreviousPage = page > 0
  const hasNextPage = offset + CHUNK_PAGE_SIZE < totalChunks
  const status = getStatusConfig(document.status)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">파일명</p>
          <p className="mt-1 font-medium text-foreground">{document.file_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">업로드일</p>
          <p className="mt-1 font-medium text-foreground">{formatDateTime(document.uploaded_at)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">상태</p>
          <Badge className={cn("mt-1 gap-1 border font-normal", status.color)}>
            {status.icon}
            {status.label}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">청크 수</p>
          <p className="mt-1 font-medium text-foreground">
            {document.chunk_count?.toLocaleString("ko-KR") ?? totalChunks.toLocaleString("ko-KR")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">검색용 문서 내용 수정</h3>
          <p className="text-sm text-muted-foreground">{getChunkRangeLabel(page, totalChunks)}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSaving || isReindexing}
          onClick={onReindex}
          className="gap-2"
        >
          {isReindexing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          재인덱싱
        </Button>
      </div>

      {feedback ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {feedback}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {isLoading ? <ChunkListSkeleton /> : null}

      {isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          청크 목록을 불러오지 못했습니다. {errorMessage}
        </p>
      ) : null}

      {!isLoading && !isError && totalChunks === 0 ? (
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          표시할 청크가 없습니다.
        </p>
      ) : null}

      {!isLoading && !isError && visibleChunks.length > 0 ? (
        <div className="space-y-3">
          {visibleChunks.map((chunk) => {
            const section = getChunkSection(chunk.metadata)
            const currentText = editingChunkText[chunk.id] ?? chunk.content
            const canSave =
              currentText.trim().length > 0 &&
              currentText !== chunk.content &&
              !isSaving

            return (
              <motion.div
                key={chunk.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="rounded-lg border bg-background p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">청크 #{chunk.chunk_index}</Badge>
                  <Badge variant="outline">page {chunk.page_number ?? "-"}</Badge>
                  {section ? <Badge variant="outline">{section}</Badge> : null}
                  {chunk.updated_at ? (
                    <span className="text-xs text-muted-foreground">
                      수정 {formatDateTime(chunk.updated_at)}
                    </span>
                  ) : null}
                </div>

                <Textarea
                  value={currentText}
                  onChange={(event) => onChangeChunkText(chunk.id, event.target.value)}
                  disabled={isSaving}
                  className="mt-3 min-h-36 resize-y bg-background"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    저장 후 해당 문서를 다시 인덱싱합니다.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canSave}
                    onClick={() => onSaveChunk(chunk)}
                    className="gap-2"
                  >
                    {savingChunkId === chunk.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    저장
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : null}

      {!isLoading && !isError && totalChunks > 0 ? (
        <div className="flex items-center justify-end gap-2 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasPreviousPage || isSaving}
            onClick={() => onChangePage(page - 1)}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <span className="min-w-20 text-center text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasNextPage || isSaving}
            onClick={() => onChangePage(page + 1)}
            className="gap-2"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function DocumentRow({
  document,
  isSelected,
  isDeleting,
  isActionDisabled,
  onOpen,
  onDelete,
}: {
  document: TenantDocument
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
        {document.chunk_count?.toLocaleString("ko-KR") ?? "-"}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant={isSelected ? "secondary" : "outline"}
          size="sm"
          disabled={isActionDisabled}
          onClick={onOpen}
          aria-label={`${document.file_name} 작업`}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          작업
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

export function KnowledgePage() {
  const tenantId = useAuthStore((state) => state.tenant?.id)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [chunkPageByDocument, setChunkPageByDocument] = useState<ChunkPageByDocument>({})
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
  const totalChunkCount = chunksQuery.data?.total ?? chunks.length
  const currentChunkPage = selectedDocumentId ? chunkPageByDocument[selectedDocumentId] ?? 0 : 0
  const isUploadDisabled = !tenantId || isUploading
  const isChunkMutationPending = isUpdatingChunk || isReindexingDocument

  useEffect(() => {
    if (!selectedDocumentId) {
      return
    }

    if (!documents.some((document) => document.id === selectedDocumentId)) {
      setSelectedDocumentId(null)
      setChunkFeedback(null)
      setChunkError(null)
    }
  }, [documents, selectedDocumentId])

  useEffect(() => {
    if (!selectedDocumentId || totalChunkCount === 0) {
      return
    }

    const maxPage = Math.max(0, Math.ceil(totalChunkCount / CHUNK_PAGE_SIZE) - 1)
    if (currentChunkPage > maxPage) {
      setChunkPageByDocument((prev) => ({
        ...prev,
        [selectedDocumentId]: maxPage,
      }))
    }
  }, [currentChunkPage, selectedDocumentId, totalChunkCount])

  const uploadPdfFiles = useCallback(
    async (files: File[]) => {
      setUploadError(null)

      if (!tenantId) {
        setUploadError("회사 정보를 확인한 뒤 업로드해 주세요.")
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
          setSelectedDocumentId(null)
          setChunkFeedback(null)
          setChunkError(null)
        }
      } catch (error) {
        setDeleteError(
          error instanceof Error ? error.message : "문서를 삭제하지 못했습니다.",
        )
      } finally {
        setDeletingDocumentId(null)
      }
    },
    [deleteDocument, selectedDocumentId, tenantId],
  )

  const handleOpenDocument = useCallback(
    (document: TenantDocument) => {
      if (document.status === "processing" || isChunkMutationPending) {
        return
      }

      setSelectedDocumentId(document.id)
      setChunkFeedback(null)
      setChunkError(null)
      setChunkPageByDocument((prev) => ({
        ...prev,
        [document.id]: prev[document.id] ?? 0,
      }))
    },
    [isChunkMutationPending],
  )

  const handleChangeChunkText = useCallback((chunkId: string, value: string) => {
    setEditingChunkText((prev) => ({
      ...prev,
      [chunkId]: value,
    }))
  }, [])

  const handleChangeChunkPage = useCallback(
    (nextPage: number) => {
      if (!selectedDocumentId) {
        return
      }

      setChunkPageByDocument((prev) => ({
        ...prev,
        [selectedDocumentId]: Math.max(0, nextPage),
      }))
    },
    [selectedDocumentId],
  )

  const handleSaveChunk = useCallback(
    async (chunk: RagDocumentChunk) => {
      if (!tenantId) {
        setChunkError("회사 정보를 확인해 주세요.")
        return
      }

      if (!selectedDocumentId) {
        setChunkError("문서 정보를 확인할 수 없습니다.")
        return
      }

      const nextContent = (editingChunkText[chunk.id] ?? chunk.content).trim()

      if (!nextContent) {
        setChunkError("청크 내용은 비워둘 수 없습니다.")
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
          error instanceof Error ? error.message : "청크 수정에 실패했습니다.",
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
        setChunkFeedback(`청크 #${chunk.chunk_index} 저장과 재인덱싱이 완료되었습니다.`)
      } catch (error) {
        setChunkError(
          error instanceof Error
            ? error.message
            : "청크는 저장됐지만 재인덱싱에 실패했습니다. 다시 시도해 주세요.",
        )
      } finally {
        setSavingChunkId(null)
      }
    },
    [editingChunkText, reindexDocument, selectedDocumentId, tenantId, updateChunk],
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
      setChunkFeedback("문서 재인덱싱 요청이 완료되었습니다.")
    } catch (error) {
      setChunkError(
        error instanceof Error ? error.message : "재인덱싱 요청에 실패했습니다.",
      )
    }
  }, [reindexDocument, selectedDocumentId, tenantId])

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">지식 업로드</h1>
          <p className="text-sm text-muted-foreground">
            AI 에이전트가 참고할 기업 문서를 관리합니다.
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
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background",
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
                  ? "PDF 문서를 업로드하는 중입니다"
                  : isDragging
                    ? "여기에 파일을 놓아주세요"
                    : "PDF 파일을 드래그하거나 업로드하세요"}
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

            {uploadError ? (
              <p className="mt-3 text-sm text-red-600">{uploadError}</p>
            ) : null}
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
            {deleteError ? (
              <p className="mb-3 text-sm text-red-600">{deleteError}</p>
            ) : null}

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">파일명</TableHead>
                  <TableHead className="font-semibold">업로드일</TableHead>
                  <TableHead className="font-semibold">상태</TableHead>
                  <TableHead className="font-semibold">청크 수</TableHead>
                  <TableHead className="font-semibold">작업</TableHead>
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
                    isSelected={selectedDocumentId === document.id}
                    isDeleting={deletingDocumentId === document.id}
                    isActionDisabled={document.status === "processing" || isChunkMutationPending}
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
            setSelectedDocumentId(null)
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              문서 상세 및 청크 수정
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            {selectedDocument ? (
              <DocumentChunkEditor
                document={selectedDocument}
                chunks={chunks}
                totalChunks={totalChunkCount}
                page={currentChunkPage}
                editingChunkText={editingChunkText}
                feedback={chunkFeedback}
                error={chunkError}
                isLoading={chunksQuery.isLoading}
                isError={chunksQuery.isError}
                errorMessage={chunksQuery.isError ? chunksQuery.error.message : null}
                isSaving={isChunkMutationPending}
                savingChunkId={savingChunkId}
                isReindexing={isReindexingDocument}
                onChangePage={handleChangeChunkPage}
                onChangeChunkText={handleChangeChunkText}
                onSaveChunk={(chunk) => void handleSaveChunk(chunk)}
                onReindex={() => void handleReindex()}
              />
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <ChunkListSkeleton />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
