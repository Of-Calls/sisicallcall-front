import { useCallback, useState } from "react"
import type { ChangeEvent, DragEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, FileUp, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useUploadTenantDocument } from "@/features/documents/documentQueries"
import { useAuthStore } from "@/shared/auth/authStore"

interface UploadedFile {
  id: string
  name: string
  size: string
  status: "uploading" | "processing" | "ready" | "failed" | string
}

const fileVariants = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.95 },
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getUploadStatusLabel(status: UploadedFile["status"]) {
  switch (status) {
    case "uploading":
      return "업로드 중"
    case "processing":
      return "처리 중"
    case "ready":
      return "완료"
    case "failed":
      return "실패"
    default:
      return status
  }
}

export function PdfUpload() {
  const tenantId = useAuthStore((state) => state.tenant?.id)
  const { mutateAsync: uploadDocument, isPending: isUploading } =
    useUploadTenantDocument(tenantId)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  const isUploadDisabled = !tenantId || isUploading

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setUploadError(null)

      if (!tenantId) {
        setUploadError("회사 정보를 확인한 뒤 업로드할 수 있습니다.")
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

      for (const file of pdfFiles) {
        const id = `${file.name}-${Date.now()}`

        setUploadedFiles((prev) => [
          {
            id,
            name: file.name,
            size: formatFileSize(file.size),
            status: "uploading",
          },
          ...prev,
        ])

        try {
          const result = await uploadDocument(file)
          setUploadedFiles((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: result.status } : item,
            ),
          )
        } catch (error) {
          setUploadedFiles((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: "failed" } : item,
            ),
          )
          setUploadError(
            error instanceof Error ? error.message : "문서 업로드에 실패했습니다.",
          )
        }
      }
    },
    [tenantId, uploadDocument],
  )

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!isUploadDisabled) {
        setIsDragOver(true)
      }
    },
    [isUploadDisabled],
  )

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)

      if (isUploadDisabled) {
        return
      }

      void uploadFiles(Array.from(e.dataTransfer.files))
    },
    [isUploadDisabled, uploadFiles],
  )

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (isUploadDisabled) {
        e.target.value = ""
        return
      }

      void uploadFiles(Array.from(e.target.files || []))
      e.target.value = ""
    },
    [isUploadDisabled, uploadFiles],
  )

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
    >
      <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">PDF 매뉴얼 업로드</CardTitle>
          <CardDescription>
            AI 에이전트가 학습할 고객 응대 매뉴얼을 업로드하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            animate={{
              borderColor: isDragOver ? "#0D9488" : "rgba(100, 116, 139, 0.25)",
              backgroundColor: isDragOver ? "rgba(13, 148, 136, 0.05)" : "transparent",
              scale: isDragOver ? 1.01 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors"
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              disabled={isUploadDisabled}
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <motion.div
              animate={{ y: isDragOver ? -5 : 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted"
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <FileUp className="h-6 w-6 text-muted-foreground" />
              )}
            </motion.div>
            <p className="mb-1 text-sm font-medium text-foreground">
              {isUploading
                ? "PDF 문서를 업로드하는 중입니다"
                : "PDF 파일을 드래그해서 올려주세요"}
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              또는 클릭하여 파일을 선택하세요 (최대 10MB)
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                disabled={isUploadDisabled}
                className="pointer-events-none transition-all duration-200 hover:shadow-sm"
              >
                {isUploading ? "업로드 중..." : "파일 선택"}
              </Button>
            </motion.div>
          </motion.div>

          {uploadError ? (
            <p className="text-sm text-red-600">{uploadError}</p>
          ) : null}

          <AnimatePresence mode="popLayout">
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <p className="text-sm font-medium text-foreground">최근 업로드 파일</p>
                {uploadedFiles.map((file, idx) => (
                  <motion.div
                    key={file.id}
                    variants={fileVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ delay: idx * 0.05 }}
                    layout
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div whileHover={{ rotate: 5 }} transition={{ type: "spring", stiffness: 400 }}>
                        {file.status === "uploading" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.size} · {getUploadStatusLabel(file.status)}
                        </p>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 p-0 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
