import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CountChip,
  EmptyShell,
  PageShell,
  PageTopbar,
  StatusBadge,
} from "@/components/dashboard/page-chrome";
import {
  useDeleteTenantDocument,
  useReindexTenantDocument,
  useTenantDocumentChunks,
  useTenantDocuments,
  useUpdateTenantDocumentChunk,
  useUploadTenantDocument,
} from "@/features/documents/documentQueries";
import type {
  RagDocumentChunk,
  TenantDocument,
} from "@/features/documents/documentTypes";
import { cn } from "@/lib/utils";
import {
  buildDocumentTopicViews,
  documentStatusLabelMap,
  type DocumentTopicView,
} from "@/pages/knowledge/knowledgeViewModels";
import { useAuthStore } from "@/shared/auth/authStore";

const documentQueryParams = {
  offset: 0,
  limit: 20,
} as const;

const DOCUMENT_TABLE_COLUMN_COUNT = 6;
const readyStatuses = new Set(["ready", "completed"]);
const failedStatuses = new Set(["failed", "error"]);

type KnowledgeTab = "topics" | "questions";
type EditingChunkText = Record<string, string>;
type StatusTone = "info" | "success" | "warning" | "error" | "neutral";

const statusConfig: Record<
  string,
  { label: string; tone: StatusTone; icon: ReactNode }
> = {
  processing: {
    label: documentStatusLabelMap.processing,
    tone: "info",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  ready: {
    label: documentStatusLabelMap.ready,
    tone: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  completed: {
    label: documentStatusLabelMap.completed,
    tone: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: documentStatusLabelMap.failed,
    tone: "error",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  error: {
    label: documentStatusLabelMap.error,
    tone: "error",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

function getStatusConfig(status: string) {
  return (
    statusConfig[status] ?? {
      label: status || "상태 확인 중",
      tone: "neutral" as StatusTone,
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    }
  );
}

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "시간 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "반영 이력 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatPageLabel(sourcePages: number[]) {
  if (sourcePages.length === 0) return "페이지 정보 없음";
  return sourcePages.map((page) => `p.${page}`).join(", ");
}

function matchesTopicSearch(topic: DocumentTopicView, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;
  const searchableText = [
    topic.title,
    topic.summary,
    topic.answerText,
    ...topic.keywords,
    ...topic.exampleQuestions,
  ]
    .join("\n")
    .toLowerCase();
  return searchableText.includes(normalizedKeyword);
}

function getTopicCountLabel(count: number | null | undefined) {
  if (typeof count !== "number") return "-";
  return count.toLocaleString("ko-KR");
}

/* ============================================================
 * Token-driven button helpers (HDS scope)
 * ============================================================ */

type BtnVariant = "primary" | "neutral" | "ghost" | "danger-ghost";

function getBtnStyle(
  variant: BtnVariant,
  disabled?: boolean,
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
    case "danger-ghost":
      return {
        color: "#ea2261",
        backgroundColor: "transparent",
        border: "1px solid transparent",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 500,
      };
    case "ghost":
      return {
        color: "#64748d",
        backgroundColor: "transparent",
        border: "1px solid transparent",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 500,
      };
    case "neutral":
    default:
      return {
        color: "#273951",
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 500,
      };
  }
}

function HdsButton({
  variant = "neutral",
  disabled,
  onClick,
  children,
  className,
  type = "button",
  size = "sm",
}: {
  variant?: BtnVariant;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  size?: "sm" | "md";
}) {
  const isDanger = variant === "danger-ghost";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] transition-all",
        size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-9 px-4 text-[13px]",
        className,
      )}
      style={getBtnStyle(variant, disabled)}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          e.currentTarget.style.backgroundColor = "#4434d4";
          e.currentTarget.style.borderColor = "#4434d4";
        } else if (variant === "neutral") {
          e.currentTarget.style.backgroundColor = "#f6f9fc";
          e.currentTarget.style.borderColor = "#d6d9fc";
        } else if (variant === "ghost") {
          e.currentTarget.style.backgroundColor = "#eef2f8";
          e.currentTarget.style.color = "#273951";
        } else if (isDanger) {
          e.currentTarget.style.backgroundColor = "rgba(234,34,97,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        const fresh = getBtnStyle(variant, false);
        e.currentTarget.style.backgroundColor = fresh.backgroundColor as string;
        e.currentTarget.style.borderColor =
          (fresh.border as string).split(" ").pop() ?? "transparent";
        e.currentTarget.style.color = fresh.color as string;
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================
 * Skeletons / placeholders
 * ============================================================ */
function DocumentTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={rowIndex} style={{ borderBottom: "1px solid #e5edf5" }}>
          {Array.from({ length: DOCUMENT_TABLE_COLUMN_COUNT }).map(
            (__, cellIndex) => (
              <td key={cellIndex} className="px-4 py-3">
                <Skeleton className="h-3.5 w-full" />
              </td>
            ),
          )}
        </tr>
      ))}
    </>
  );
}

function TopicListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-[8px]" />
      ))}
    </div>
  );
}

/* ============================================================
 * Sheet status notice (processing / failed)
 * ============================================================ */
function SheetStatusNotice({
  status,
  isActionDisabled,
  onReindex,
}: {
  status: string;
  isActionDisabled: boolean;
  onReindex: () => void;
}) {
  if (status === "processing") {
    return (
      <div
        className="rounded-[8px] p-4"
        style={{
          backgroundColor: "rgba(83,58,253,0.04)",
          border: "1px solid rgba(83,58,253,0.20)",
          fontFamily: "var(--hds-font-body)",
        }}
      >
        <div className="flex items-start gap-3">
          <Loader2
            className="mt-0.5 h-5 w-5 animate-spin shrink-0"
            style={{ color: "#533afd" }}
          />
          <div className="space-y-1">
            <p
              className="text-[13px]"
              style={{ color: "#533afd", fontWeight: 600 }}
            >
              문서를 AI 상담 지식으로 정리하는 중입니다.
            </p>
            <p
              className="text-[12.5px] leading-[1.55]"
              style={{ color: "#273951", fontWeight: 500 }}
            >
              잠시 후 자동으로 사용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (failedStatuses.has(status)) {
    return (
      <div
        className="rounded-[8px] p-4"
        style={{
          backgroundColor: "rgba(234,34,97,0.04)",
          border: "1px solid rgba(234,34,97,0.25)",
          fontFamily: "var(--hds-font-body)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              style={{ color: "#ea2261" }}
            />
            <div className="space-y-1">
              <p
                className="text-[13px]"
                style={{ color: "#ea2261", fontWeight: 600 }}
              >
                문서 처리에 실패했습니다.
              </p>
              <p
                className="text-[12.5px] leading-[1.55]"
                style={{ color: "#273951", fontWeight: 500 }}
              >
                다시 처리하면 문서를 다시 분석해서 상담 지식으로 준비합니다.
              </p>
            </div>
          </div>
          <HdsButton
            variant="neutral"
            disabled={isActionDisabled}
            onClick={onReindex}
          >
            다시 처리
          </HdsButton>
        </div>
      </div>
    );
  }

  return null;
}

/* ============================================================
 * Document row in the main table
 * ============================================================ */
function DocumentRow({
  document,
  topicCount,
  isSelected,
  isDeleting,
  isActionDisabled,
  onOpen,
  onDelete,
}: {
  document: TenantDocument;
  topicCount: number | null;
  isSelected: boolean;
  isDeleting: boolean;
  isActionDisabled: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const status = getStatusConfig(document.status);

  return (
    <tr
      className="transition-colors"
      style={{
        backgroundColor: isSelected ? "rgba(83,58,253,0.05)" : "transparent",
        borderBottom: "1px solid #e5edf5",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "#f6f9fc";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]"
            style={{
              color: "#ea2261",
              backgroundColor: "rgba(234,34,97,0.08)",
              border: "1px solid rgba(234,34,97,0.20)",
            }}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span
            className="truncate text-[13px]"
            style={{ color: "#061b31", fontWeight: 600 }}
          >
            {document.file_name}
          </span>
        </div>
      </td>
      <td
        className="hds-tnum px-4 py-3 text-[12.5px]"
        style={{ color: "#64748d", fontWeight: 500 }}
      >
        {formatDateTime(document.uploaded_at)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={status.tone} icon={status.icon}>
          {status.label}
        </StatusBadge>
      </td>
      <td
        className="hds-tnum px-4 py-3 text-[13px]"
        style={{ color: "#273951", fontWeight: 500 }}
      >
        {getTopicCountLabel(topicCount)}
      </td>
      <td className="px-4 py-3">
        <HdsButton
          variant={isSelected ? "primary" : "neutral"}
          disabled={isActionDisabled}
          onClick={onOpen}
        >
          <Pencil className="h-3 w-3" />
          내용 보기
        </HdsButton>
      </td>
      <td className="px-4 py-3">
        <HdsButton
          variant="danger-ghost"
          disabled={isDeleting}
          onClick={onDelete}
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          삭제
        </HdsButton>
      </td>
    </tr>
  );
}

/* ============================================================
 * Topic detail panel (right side of sheet body)
 * ============================================================ */
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
  topic: DocumentTopicView;
  editingChunkId: string | null;
  editingChunkText: EditingChunkText;
  isSaving: boolean;
  savingChunkId: string | null;
  showSourceDetails: boolean;
  onStartEditing: (chunk: RagDocumentChunk) => void;
  onCancelEditing: () => void;
  onChangeChunkText: (chunkId: string, value: string) => void;
  onSaveChunk: (chunkId: string) => void;
  onToggleSourceDetails: () => void;
}) {
  const primaryChunk = topic.rawChunks[0] ?? null;

  return (
    <div
      className="overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <div
        className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid #e5edf5" }}
      >
        <div className="flex-1 space-y-2.5">
          <h3
            className="text-[18px] tracking-[-0.014em]"
            style={{
              color: "#061b31",
              fontFamily: "var(--hds-font-display)",
              fontWeight: 700,
            }}
          >
            {topic.title}
          </h3>
          <p
            className="text-[13px] leading-[1.55]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            {topic.summary}
          </p>
          {topic.keywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {topic.keywords.map((keyword) => (
                <StatusBadge key={keyword} tone="info">
                  {keyword}
                </StatusBadge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {primaryChunk ? (
            <HdsButton
              variant="neutral"
              disabled={isSaving}
              onClick={() => onStartEditing(primaryChunk)}
            >
              <Pencil className="h-3 w-3" />
              내용 수정
            </HdsButton>
          ) : null}
          <HdsButton variant="ghost" onClick={onToggleSourceDetails}>
            {showSourceDetails ? "원문 닫기" : "원문 보기"}
          </HdsButton>
        </div>
      </div>

      <div className="space-y-6 px-5 py-5">
        <KnowledgeSection title="상담원이 답변할 내용">
          <div
            className="rounded-[8px] p-4 text-[13px] leading-[1.6]"
            style={{
              backgroundColor: "#f6f9fc",
              border: "1px solid #e5edf5",
              color: "#061b31",
              fontWeight: 500,
            }}
          >
            {topic.answerText || "정리된 답변 내용이 없습니다."}
          </div>
        </KnowledgeSection>

        <KnowledgeSection title="고객이 이렇게 물어볼 수 있어요">
          {topic.exampleQuestions.length > 0 ? (
            <ul className="space-y-2">
              {topic.exampleQuestions.map((question) => (
                <li
                  key={question}
                  className="flex items-start gap-2 rounded-[6px] px-3 py-2 text-[13px] leading-[1.55]"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5edf5",
                    color: "#273951",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>—</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="text-[12.5px]"
              style={{ color: "#94a3b8", fontWeight: 500 }}
            >
              예시 질문이 아직 없습니다.
            </p>
          )}
        </KnowledgeSection>

        <KnowledgeSection title="관련 원문">
          <p
            className="hds-tnum text-[12.5px]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            {formatPageLabel(topic.sourcePages)}에서 가져온 내용
          </p>
        </KnowledgeSection>

        {primaryChunk && editingChunkId === primaryChunk.id ? (
          <div
            className="space-y-3 rounded-[8px] p-4"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d6d9fc",
            }}
          >
            <h4
              className="text-[13px]"
              style={{
                color: "#533afd",
                fontFamily: "var(--hds-font-display)",
                fontWeight: 700,
              }}
            >
              내용 수정
            </h4>
            <Textarea
              value={editingChunkText[primaryChunk.id] ?? primaryChunk.content}
              onChange={(event) =>
                onChangeChunkText(primaryChunk.id, event.target.value)
              }
              disabled={isSaving}
              className="min-h-40 resize-y bg-white text-[13px]"
              style={{
                border: "1px solid #e5edf5",
                color: "#061b31",
                fontFamily: "var(--hds-font-body)",
              }}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <HdsButton variant="ghost" onClick={onCancelEditing}>
                취소
              </HdsButton>
              <HdsButton
                variant="primary"
                disabled={
                  isSaving ||
                  !(
                    editingChunkText[primaryChunk.id] ?? primaryChunk.content
                  ).trim() ||
                  (editingChunkText[primaryChunk.id] ??
                    primaryChunk.content) === primaryChunk.content
                }
                onClick={() => onSaveChunk(primaryChunk.id)}
              >
                {savingChunkId === primaryChunk.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                저장
              </HdsButton>
            </div>
          </div>
        ) : null}

        {showSourceDetails ? (
          <KnowledgeSection title="원문에서 가져온 내용">
            <div className="space-y-3">
              {topic.rawChunks.map((rawChunk, index) => {
                const isEditing = editingChunkId === rawChunk.id;
                const currentText =
                  editingChunkText[rawChunk.id] ?? rawChunk.content;
                const canSave =
                  currentText.trim().length > 0 &&
                  currentText !== rawChunk.content &&
                  !isSaving;

                return (
                  <div
                    key={rawChunk.id}
                    className="rounded-[8px] p-4"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5edf5",
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p
                          className="text-[12.5px]"
                          style={{ color: "#061b31", fontWeight: 600 }}
                        >
                          원문 항목 {index + 1}
                        </p>
                        <p
                          className="hds-tnum text-[11.5px]"
                          style={{ color: "#94a3b8", fontWeight: 500 }}
                        >
                          {typeof rawChunk.page_number === "number"
                            ? `출처 p.${rawChunk.page_number}`
                            : "출처 페이지 정보 없음"}
                          {rawChunk.updated_at
                            ? ` · 수정 ${formatDateTime(rawChunk.updated_at)}`
                            : ""}
                        </p>
                      </div>
                      <HdsButton
                        variant="neutral"
                        disabled={isSaving}
                        onClick={() => onStartEditing(rawChunk)}
                      >
                        이 항목 수정
                      </HdsButton>
                    </div>

                    {isEditing ? (
                      <div className="mt-3 space-y-3">
                        <Textarea
                          value={currentText}
                          onChange={(event) =>
                            onChangeChunkText(rawChunk.id, event.target.value)
                          }
                          disabled={isSaving}
                          className="min-h-32 resize-y bg-white text-[13px]"
                          style={{
                            border: "1px solid #e5edf5",
                            color: "#061b31",
                            fontFamily: "var(--hds-font-body)",
                          }}
                        />
                        <div className="flex flex-wrap justify-end gap-2">
                          <HdsButton variant="ghost" onClick={onCancelEditing}>
                            취소
                          </HdsButton>
                          <HdsButton
                            variant="primary"
                            disabled={!canSave}
                            onClick={() => onSaveChunk(rawChunk.id)}
                          >
                            {savingChunkId === rawChunk.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            저장
                          </HdsButton>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="mt-3 text-[13px] leading-[1.6]"
                        style={{ color: "#273951", fontWeight: 500 }}
                      >
                        {rawChunk.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </KnowledgeSection>
        ) : null}
      </div>
    </div>
  );
}

function KnowledgeSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h4
        className="text-[12px] uppercase"
        style={{
          color: "#94a3b8",
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}

/* ============================================================
 * Questions tab
 * ============================================================ */
function QuestionsTab({
  topics,
  onTestQuestion,
}: {
  topics: DocumentTopicView[];
  onTestQuestion: () => void;
}) {
  return (
    <div
      className="overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <div
        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderBottom: "1px solid #e5edf5" }}
      >
        <div>
          <h3
            className="text-[15px] tracking-[-0.01em]"
            style={{
              color: "#061b31",
              fontFamily: "var(--hds-font-display)",
              fontWeight: 700,
            }}
          >
            이 문서로 답변 가능한 질문
          </h3>
          <p
            className="mt-0.5 text-[12.5px]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            고객이 자주 물어볼 만한 질문을 주제별로 정리했습니다.
          </p>
        </div>
        <HdsButton variant="neutral" onClick={onTestQuestion}>
          질문 테스트
          <ArrowRight className="h-3 w-3" />
        </HdsButton>
      </div>
      <div className="space-y-3 px-5 py-5">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="rounded-[8px] p-4"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5edf5",
            }}
          >
            <div className="space-y-1">
              <p
                className="text-[14px] tracking-[-0.008em]"
                style={{
                  color: "#061b31",
                  fontFamily: "var(--hds-font-display)",
                  fontWeight: 700,
                }}
              >
                {topic.title}
              </p>
              <p
                className="text-[12.5px] leading-[1.55]"
                style={{ color: "#64748d", fontWeight: 500 }}
              >
                {topic.summary}
              </p>
            </div>
            <ul className="mt-3 space-y-1.5">
              {topic.exampleQuestions.map((question) => (
                <li
                  key={`${topic.id}-${question}`}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: "#273951", fontWeight: 500 }}
                >
                  <span style={{ color: "#94a3b8" }}>—</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * Delete confirmation dialog
 * ============================================================ */
function DeleteDocumentDialog({
  document,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  document: TenantDocument | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={Boolean(document)}
      onOpenChange={(open) => !open && !isDeleting && onCancel()}
    >
      <AlertDialogContent
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5edf5",
          borderRadius: "16px",
          fontFamily: "var(--hds-font-body)",
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle
            className="text-[18px] tracking-[-0.014em]"
            style={{
              color: "#061b31",
              fontFamily: "var(--hds-font-display)",
              fontWeight: 700,
            }}
          >
            문서를 삭제할까요?
          </AlertDialogTitle>
          <AlertDialogDescription
            className="space-y-2 text-[13px] leading-[1.55]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            <span className="block">
              "{document?.file_name ?? ""}" 문서를 삭제하면 AI 상담원이 더 이상
              이 문서 내용을 참고하지 않습니다.
            </span>
            <span
              className="block"
              style={{ color: "#ea2261", fontWeight: 600 }}
            >
              이 작업은 되돌릴 수 없습니다.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="rounded-[6px] border text-[13px]"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#e5edf5",
              color: "#273951",
              fontFamily: "var(--hds-font-body)",
              fontWeight: 500,
            }}
          >
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={onConfirm}
            className="rounded-[6px] text-[13px]"
            style={{
              backgroundColor: "#ea2261",
              color: "#ffffff",
              fontFamily: "var(--hds-font-body)",
              fontWeight: 600,
              boxShadow:
                "rgba(50,50,93,0.18) 0px 8px 18px -10px, rgba(0,0,0,0.08) 0px 4px 8px -4px",
            }}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ============================================================
 * Main page
 * ============================================================ */
export function KnowledgePage() {
  const tenantId = useAuthStore((state) => state.tenant?.id);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );
  const [documentToDelete, setDocumentToDelete] =
    useState<TenantDocument | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("topics");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editingChunkText, setEditingChunkText] = useState<EditingChunkText>(
    {},
  );
  const [savingChunkId, setSavingChunkId] = useState<string | null>(null);
  const [chunkError, setChunkError] = useState<string | null>(null);
  const [sourceTopicId, setSourceTopicId] = useState<string | null>(null);

  const documentsQuery = useTenantDocuments(tenantId, documentQueryParams);
  const chunksQuery = useTenantDocumentChunks(tenantId, selectedDocumentId);
  const { mutateAsync: uploadDocument, isPending: isUploading } =
    useUploadTenantDocument(tenantId);
  const { mutateAsync: deleteDocument } = useDeleteTenantDocument(tenantId);
  const { mutateAsync: updateChunk, isPending: isUpdatingChunk } =
    useUpdateTenantDocumentChunk(tenantId, selectedDocumentId);
  const { mutateAsync: reindexDocument, isPending: isReindexingDocument } =
    useReindexTenantDocument(tenantId, selectedDocumentId);

  const documents = documentsQuery.data?.items ?? [];
  const totalDocuments = documentsQuery.data?.total ?? documents.length;
  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? null;
  const chunks = chunksQuery.data?.items ?? [];
  const isUploadDisabled = !tenantId || isUploading;
  const isChunkMutationPending = isUpdatingChunk || isReindexingDocument;
  const topicViews = buildDocumentTopicViews(chunks);
  const filteredTopics = topicViews.filter((topic) =>
    matchesTopicSearch(topic, searchKeyword),
  );
  const selectedTopic =
    filteredTopics.find((topic) => topic.id === selectedTopicId) ??
    filteredTopics[0] ??
    null;
  const isDocumentReady = selectedDocument
    ? readyStatuses.has(selectedDocument.status)
    : false;
  const isFailedDocument = selectedDocument
    ? failedStatuses.has(selectedDocument.status)
    : false;
  const selectedDocumentTopicCount = selectedDocument
    ? topicViews.length
    : null;

  /* ────────────────── Effects ────────────────── */
  useEffect(() => {
    if (!selectedDocumentId) return;
    if (!documents.some((document) => document.id === selectedDocumentId)) {
      setSelectedDocumentId(null);
      setSelectedTopicId(null);
      setEditingChunkId(null);
      setChunkError(null);
      setSourceTopicId(null);
    }
  }, [documents, selectedDocumentId]);

  useEffect(() => {
    if (filteredTopics.length === 0) {
      if (selectedTopicId) setSelectedTopicId(null);
      return;
    }
    if (
      !selectedTopicId ||
      !filteredTopics.some((topic) => topic.id === selectedTopicId)
    ) {
      setSelectedTopicId(filteredTopics[0].id);
    }
  }, [filteredTopics, selectedTopicId]);

  useEffect(() => {
    if (!selectedTopic) {
      setSourceTopicId(null);
      return;
    }
    if (sourceTopicId && sourceTopicId !== selectedTopic.id) {
      setSourceTopicId(null);
    }
  }, [selectedTopic, sourceTopicId]);

  /* ────────────────── Handlers ────────────────── */
  const resetSheetState = useCallback((clearSelectedDocument: boolean) => {
    if (clearSelectedDocument) setSelectedDocumentId(null);
    setActiveTab("topics");
    setSelectedTopicId(null);
    setSearchKeyword("");
    setEditingChunkId(null);
    setEditingChunkText({});
    setSavingChunkId(null);
    setChunkError(null);
    setSourceTopicId(null);
  }, []);

  const uploadPdfFiles = useCallback(
    async (files: File[]) => {
      setUploadError(null);
      if (!tenantId) {
        setUploadError("회사 정보를 확인한 뒤 문서를 업로드해 주세요.");
        return;
      }
      const pdfFiles = files.filter(isPdfFile);
      if (pdfFiles.length === 0) {
        setUploadError("PDF 파일만 업로드할 수 있습니다.");
        return;
      }
      if (pdfFiles.length !== files.length) {
        setUploadError("PDF가 아닌 파일은 제외했습니다.");
      }
      try {
        await Promise.all(pdfFiles.map((file) => uploadDocument(file)));
      } catch (error) {
        setUploadError(
          error instanceof Error
            ? error.message
            : "문서 업로드에 실패했습니다.",
        );
      }
    },
    [tenantId, uploadDocument],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!isUploadDisabled) setIsDragging(true);
    },
    [isUploadDisabled],
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (isUploadDisabled) return;
      void uploadPdfFiles(Array.from(event.dataTransfer.files));
    },
    [isUploadDisabled, uploadPdfFiles],
  );

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (isUploadDisabled) {
        event.target.value = "";
        return;
      }
      void uploadPdfFiles(Array.from(event.target.files || []));
      event.target.value = "";
    },
    [isUploadDisabled, uploadPdfFiles],
  );

  const handleRequestDelete = useCallback((document: TenantDocument) => {
    setDeleteError(null);
    setDocumentToDelete(document);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!tenantId || !documentToDelete) return;
    setDeleteError(null);
    setDeletingDocumentId(documentToDelete.id);
    try {
      await deleteDocument(documentToDelete.id);
      if (selectedDocumentId === documentToDelete.id) resetSheetState(true);
      setDocumentToDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "문서를 삭제하지 못했습니다.",
      );
    } finally {
      setDeletingDocumentId(null);
    }
  }, [
    deleteDocument,
    documentToDelete,
    resetSheetState,
    selectedDocumentId,
    tenantId,
  ]);

  const handleOpenDocument = useCallback((document: TenantDocument) => {
    setSelectedDocumentId(document.id);
    setActiveTab("topics");
    setSelectedTopicId(null);
    setSearchKeyword("");
    setEditingChunkId(null);
    setEditingChunkText({});
    setChunkError(null);
    setSourceTopicId(null);
  }, []);

  const handleChangeChunkText = useCallback(
    (chunkId: string, value: string) => {
      setEditingChunkText((prev) => ({ ...prev, [chunkId]: value }));
    },
    [],
  );

  const handleStartEditingChunk = useCallback((chunk: RagDocumentChunk) => {
    setEditingChunkId(chunk.id);
    setEditingChunkText((prev) => ({
      ...prev,
      [chunk.id]: prev[chunk.id] ?? chunk.content,
    }));
    setChunkError(null);
  }, []);

  const handleCancelEditing = useCallback(() => {
    setEditingChunkId(null);
    setChunkError(null);
  }, []);

  const handleSaveChunk = useCallback(
    async (chunkId: string) => {
      if (!tenantId) {
        setChunkError("회사 정보를 확인해 주세요.");
        return;
      }
      if (!selectedDocumentId) {
        setChunkError("문서 정보를 확인할 수 없습니다.");
        return;
      }
      const chunk = chunks.find((item) => item.id === chunkId);
      if (!chunk) {
        setChunkError("수정할 내용을 찾지 못했습니다.");
        return;
      }
      const nextContent = (editingChunkText[chunk.id] ?? chunk.content).trim();
      if (!nextContent) {
        setChunkError("답변 내용은 비워둘 수 없습니다.");
        return;
      }
      if (nextContent === chunk.content) {
        setEditingChunkId(null);
        return;
      }
      setSavingChunkId(chunk.id);
      setChunkError(null);
      try {
        await updateChunk({
          chunkId: chunk.id,
          payload: { content: nextContent },
        });
        try {
          await reindexDocument();
        } catch (reindexError) {
          console.error("[knowledge] 재인덱싱 실패", reindexError);
        }
        setEditingChunkId(null);
        setEditingChunkText((prev) => ({ ...prev, [chunk.id]: nextContent }));
        toast.success("내용이 수정되었습니다.");
      } catch (error) {
        setChunkError(
          error instanceof Error ? error.message : "내용 수정에 실패했습니다.",
        );
      } finally {
        setSavingChunkId(null);
      }
    },
    [
      chunks,
      editingChunkText,
      reindexDocument,
      selectedDocumentId,
      tenantId,
      updateChunk,
    ],
  );

  const handleReindexDocument = useCallback(async () => {
    if (!tenantId || !selectedDocumentId) {
      setChunkError("문서 정보를 확인할 수 없습니다.");
      return;
    }
    setChunkError(null);
    try {
      await reindexDocument();
      toast.success("문서를 다시 처리하도록 요청했습니다.");
    } catch (error) {
      setChunkError(
        error instanceof Error
          ? error.message
          : "문서 다시 처리 요청에 실패했습니다.",
      );
    }
  }, [reindexDocument, selectedDocumentId, tenantId]);

  const handleQuestionTest = useCallback(() => {
    toast.info("질문 테스트 기능은 준비 중입니다.");
  }, []);

  /* ────────────────── Render ────────────────── */
  const tableHeaders = [
    { label: "문서명", className: "" },
    { label: "등록일", className: "w-[160px]" },
    { label: "준비 상태", className: "w-[120px]" },
    { label: "정리된 주제 수", className: "w-[120px]" },
    { label: "내용 보기", className: "w-[120px]" },
    { label: "삭제", className: "w-[100px]" },
  ] as const;

  return (
    <PageShell>
      <PageTopbar
        eyebrow="설정"
        title="상담 지식 정리"
        description="AI 상담원이 참고할 PDF 문서를 업로드하고, 주제별 상담 지식을 확인하고 다듬습니다."
        rightSlot={
          <CountChip tone="primary">
            <FileText className="h-3 w-3" aria-hidden="true" />총{" "}
            {totalDocuments}개 문서
          </CountChip>
        }
      />

      <div className="space-y-6 px-8 py-6">
        {/* Upload card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[12px]"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5edf5",
            fontFamily: "var(--hds-font-body)",
          }}
        >
          <div
            className="flex items-start justify-between gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid #e5edf5" }}
          >
            <div className="flex items-start gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-[6px]"
                style={{
                  color: "#533afd",
                  backgroundColor: "rgba(83,58,253,0.08)",
                  border: "1px solid rgba(83,58,253,0.20)",
                }}
              >
                <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div>
                <h2
                  className="text-[15px] tracking-[-0.01em]"
                  style={{
                    color: "#061b31",
                    fontFamily: "var(--hds-font-display)",
                    fontWeight: 700,
                  }}
                >
                  PDF 문서 업로드
                </h2>
                <p
                  className="mt-0.5 text-[12.5px]"
                  style={{ color: "#64748d", fontWeight: 500 }}
                >
                  상담 매뉴얼, 운영 안내, 예약 규정 같은 문서를 업로드하면 AI
                  상담원이 참고할 지식으로 정리합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-[8px] p-12 transition-all",
                isUploadDisabled ? "cursor-not-allowed" : "cursor-pointer",
              )}
              style={{
                backgroundColor: isDragging
                  ? "rgba(83,58,253,0.04)"
                  : "#f6f9fc",
                border: isDragging
                  ? "2px dashed #533afd"
                  : "2px dashed #d6d9fc",
                opacity: isUploadDisabled ? 0.7 : 1,
              }}
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-[12px] transition-colors"
                style={{
                  backgroundColor: isDragging
                    ? "rgba(83,58,253,0.12)"
                    : "#ffffff",
                  border: "1px solid",
                  borderColor: isDragging ? "rgba(83,58,253,0.30)" : "#e5edf5",
                  color: isDragging ? "#533afd" : "#64748d",
                }}
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>

              <p
                className="mb-1 text-[15px] tracking-[-0.008em]"
                style={{
                  color: "#061b31",
                  fontFamily: "var(--hds-font-display)",
                  fontWeight: 700,
                }}
              >
                {isUploading
                  ? "PDF 문서를 업로드하고 있습니다"
                  : isDragging
                    ? "여기에 파일을 놓아 주세요"
                    : "PDF 파일을 드래그하거나 업로드해 주세요"}
              </p>
              <p
                className="mb-4 text-[12.5px]"
                style={{ color: "#64748d", fontWeight: 500 }}
              >
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

              <div
                className="pointer-events-none inline-flex h-9 items-center rounded-[6px] px-4 text-[13px]"
                style={getBtnStyle("primary", isUploadDisabled)}
              >
                {isUploading ? "업로드 중..." : "파일 선택"}
              </div>

              <p
                className="hds-tnum mt-4 text-[11.5px]"
                style={{ color: "#94a3b8", fontWeight: 500 }}
              >
                PDF 형식만 지원합니다. (최대 50MB)
              </p>
            </div>

            {uploadError ? (
              <p
                className="mt-3 text-[12.5px]"
                style={{ color: "#ea2261", fontWeight: 500 }}
              >
                {uploadError}
              </p>
            ) : null}
          </div>
        </motion.section>

        {/* Document list table */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[12px]"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5edf5",
            fontFamily: "var(--hds-font-body)",
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid #e5edf5" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-[6px]"
                style={{
                  color: "#533afd",
                  backgroundColor: "rgba(83,58,253,0.08)",
                  border: "1px solid rgba(83,58,253,0.20)",
                }}
              >
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <h2
                className="text-[15px] tracking-[-0.01em]"
                style={{
                  color: "#061b31",
                  fontFamily: "var(--hds-font-display)",
                  fontWeight: 700,
                }}
              >
                업로드된 문서 목록
              </h2>
            </div>
          </div>

          {deleteError ? (
            <p
              className="px-5 py-3 text-[12.5px]"
              style={{
                color: "#ea2261",
                backgroundColor: "rgba(234,34,97,0.04)",
                fontWeight: 500,
                borderBottom: "1px solid rgba(234,34,97,0.20)",
              }}
            >
              {deleteError}
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse text-left"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f6f9fc",
                    borderBottom: "1px solid #d6d9fc",
                  }}
                >
                  {tableHeaders.map((h) => (
                    <th
                      key={h.label}
                      scope="col"
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-[11.5px] uppercase",
                        h.className,
                      )}
                      style={{
                        color: "#64748d",
                        fontWeight: 600,
                        letterSpacing: "0.4px",
                      }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!tenantId ? (
                  <tr>
                    <td
                      colSpan={DOCUMENT_TABLE_COLUMN_COUNT}
                      className="h-24 text-center text-[13px]"
                      style={{ color: "#64748d", fontWeight: 500 }}
                    >
                      회사 정보를 확인하고 있습니다.
                    </td>
                  </tr>
                ) : null}

                {tenantId && documentsQuery.isLoading ? (
                  <DocumentTableSkeleton />
                ) : null}

                {tenantId && documentsQuery.isError ? (
                  <tr>
                    <td
                      colSpan={DOCUMENT_TABLE_COLUMN_COUNT}
                      className="h-24 text-center text-[13px]"
                      style={{ color: "#ea2261", fontWeight: 500 }}
                    >
                      문서 목록을 불러오지 못했습니다.{" "}
                      {documentsQuery.error.message}
                    </td>
                  </tr>
                ) : null}

                {tenantId &&
                !documentsQuery.isLoading &&
                !documentsQuery.isError &&
                documents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={DOCUMENT_TABLE_COLUMN_COUNT}
                      className="h-24 text-center text-[13px]"
                      style={{ color: "#64748d", fontWeight: 500 }}
                    >
                      등록된 문서가 없습니다.
                    </td>
                  </tr>
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
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>

      {/* ─────────── Detail Sheet ─────────── */}
      <Sheet
        open={Boolean(selectedDocumentId)}
        onOpenChange={(open) => {
          if (!open && !isChunkMutationPending) resetSheetState(true);
        }}
      >
        <SheetContent
          className="w-full overflow-y-auto px-0 sm:max-w-5xl"
          style={{
            backgroundColor: "#ffffff",
            fontFamily: "var(--hds-font-body)",
            color: "#061b31",
          }}
        >
          {selectedDocument ? (
            <>
              <SheetHeader
                className="gap-4 px-6 pb-5"
                style={{ borderBottom: "1px solid #e5edf5" }}
              >
                <div className="pr-10">
                  <SheetTitle
                    className="text-[20px] tracking-[-0.014em]"
                    style={{
                      color: "#061b31",
                      fontFamily: "var(--hds-font-display)",
                      fontWeight: 700,
                    }}
                  >
                    {selectedDocument.file_name}
                  </SheetTitle>
                  <SheetDescription
                    className="mt-1 text-[12.5px] leading-[1.55]"
                    style={{ color: "#64748d", fontWeight: 500 }}
                  >
                    AI 상담원이 참고할 수 있도록 문서 내용을 주제별로
                    정리했습니다.
                  </SheetDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                  <StatusBadge
                    tone={getStatusConfig(selectedDocument.status).tone}
                    icon={getStatusConfig(selectedDocument.status).icon}
                  >
                    {getStatusConfig(selectedDocument.status).label}
                  </StatusBadge>
                  <span style={{ color: "#94a3b8" }}>·</span>
                  <span
                    className="hds-tnum"
                    style={{ color: "#64748d", fontWeight: 500 }}
                  >
                    주제 {topicViews.length}개
                  </span>
                  <span style={{ color: "#94a3b8" }}>·</span>
                  <span
                    className="hds-tnum"
                    style={{ color: "#64748d", fontWeight: 500 }}
                  >
                    마지막 반영{" "}
                    {formatShortDate(
                      selectedDocument.indexed_at ??
                        selectedDocument.uploaded_at,
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isFailedDocument ? (
                    <HdsButton
                      variant="neutral"
                      disabled={isChunkMutationPending}
                      onClick={() => void handleReindexDocument()}
                    >
                      문서 다시 처리하기
                    </HdsButton>
                  ) : null}
                </div>

                {chunkError ? (
                  <p
                    className="rounded-[8px] px-3 py-2 text-[12.5px]"
                    style={{
                      backgroundColor: "rgba(234,34,97,0.04)",
                      border: "1px solid rgba(234,34,97,0.25)",
                      color: "#ea2261",
                      fontWeight: 500,
                    }}
                  >
                    {chunkError}
                  </p>
                ) : null}

                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                    style={{ color: "#94a3b8" }}
                  />
                  <Input
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="주제명, 요약, 답변 내용, 질문 예시 검색"
                    className="h-9 pl-9 text-[13px]"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5edf5",
                      borderRadius: "8px",
                      color: "#061b31",
                      fontFamily: "var(--hds-font-body)",
                    }}
                  />
                </div>
              </SheetHeader>

              <div className="px-6 py-5">
                {chunksQuery.isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-[8px]" />
                    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                      <TopicListSkeleton />
                      <Skeleton className="h-[520px] w-full rounded-[8px]" />
                    </div>
                  </div>
                ) : chunksQuery.isError ? (
                  <div
                    className="rounded-[8px] p-6 text-[13px]"
                    style={{
                      backgroundColor: "rgba(234,34,97,0.04)",
                      border: "1px solid rgba(234,34,97,0.25)",
                      color: "#ea2261",
                      fontWeight: 500,
                    }}
                  >
                    문서 내용을 불러오지 못했습니다. {chunksQuery.error.message}
                  </div>
                ) : (
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) =>
                      setActiveTab(value as KnowledgeTab)
                    }
                    className="gap-4"
                  >
                    <TabsList
                      className="grid h-auto w-full grid-cols-2 gap-1 rounded-[8px] p-1"
                      style={{
                        backgroundColor: "#f6f9fc",
                        border: "1px solid #e5edf5",
                      }}
                    >
                      <TabsTrigger
                        value="topics"
                        className="rounded-[6px] py-2 text-[13px] data-[state=active]:bg-white data-[state=active]:text-[#533afd]"
                        style={{
                          color: "#64748d",
                          fontFamily: "var(--hds-font-body)",
                          fontWeight: 600,
                        }}
                      >
                        주제별 내용
                      </TabsTrigger>
                      <TabsTrigger
                        value="questions"
                        className="rounded-[6px] py-2 text-[13px] data-[state=active]:bg-white data-[state=active]:text-[#533afd]"
                        style={{
                          color: "#64748d",
                          fontFamily: "var(--hds-font-body)",
                          fontWeight: 600,
                        }}
                      >
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
                        <div
                          className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-[12px] p-6 text-center"
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5edf5",
                          }}
                        >
                          <span
                            className="flex h-10 w-10 items-center justify-center rounded-[8px]"
                            style={{
                              color: "#533afd",
                              backgroundColor: "rgba(83,58,253,0.08)",
                              border: "1px solid rgba(83,58,253,0.20)",
                            }}
                          >
                            <Sparkles className="h-5 w-5" />
                          </span>
                          <p
                            className="text-[14px]"
                            style={{ color: "#061b31", fontWeight: 600 }}
                          >
                            {searchKeyword.trim()
                              ? "검색 결과가 없습니다"
                              : "정리된 주제가 없습니다"}
                          </p>
                          <p
                            className="text-[12.5px]"
                            style={{ color: "#64748d", fontWeight: 500 }}
                          >
                            {searchKeyword.trim()
                              ? "다른 검색어로 다시 찾아보세요."
                              : "문서를 다시 처리한 뒤 주제별 상담 지식이 표시됩니다."}
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                          <div
                            className="overflow-hidden rounded-[12px]"
                            style={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5edf5",
                            }}
                          >
                            <div
                              className="px-5 py-4"
                              style={{ borderBottom: "1px solid #e5edf5" }}
                            >
                              <h3
                                className="text-[14px] tracking-[-0.008em]"
                                style={{
                                  color: "#061b31",
                                  fontFamily: "var(--hds-font-display)",
                                  fontWeight: 700,
                                }}
                              >
                                주제 목록
                              </h3>
                              <p
                                className="mt-0.5 text-[12px]"
                                style={{ color: "#64748d", fontWeight: 500 }}
                              >
                                AI 상담원이 참고할 상담 지식을 모았습니다.
                              </p>
                            </div>
                            <ScrollArea className="h-[560px]">
                              <div className="space-y-1.5 p-3">
                                {filteredTopics.map((topic) => {
                                  const isActive =
                                    selectedTopic?.id === topic.id;
                                  return (
                                    <button
                                      key={topic.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedTopicId(topic.id)
                                      }
                                      className={cn(
                                        "relative w-full rounded-[8px] p-3 text-left transition-colors",
                                      )}
                                      style={{
                                        backgroundColor: isActive
                                          ? "rgba(83,58,253,0.05)"
                                          : "transparent",
                                        border: isActive
                                          ? "1px solid #d6d9fc"
                                          : "1px solid transparent",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isActive)
                                          e.currentTarget.style.backgroundColor =
                                            "#f6f9fc";
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isActive)
                                          e.currentTarget.style.backgroundColor =
                                            "transparent";
                                      }}
                                    >
                                      {isActive ? (
                                        <span
                                          aria-hidden="true"
                                          className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-[2px]"
                                          style={{ backgroundColor: "#533afd" }}
                                        />
                                      ) : null}
                                      <p
                                        className="text-[13px]"
                                        style={{
                                          color: isActive
                                            ? "#533afd"
                                            : "#061b31",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {topic.title}
                                      </p>
                                      <p
                                        className="mt-1 line-clamp-2 text-[12px] leading-[1.55]"
                                        style={{
                                          color: "#64748d",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {topic.summary || topic.answerText}
                                      </p>
                                      {topic.keywords.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          {topic.keywords
                                            .slice(0, 4)
                                            .map((keyword) => (
                                              <span
                                                key={`${topic.id}-${keyword}`}
                                                className="rounded-[3px] px-1.5 py-0.5 text-[10.5px]"
                                                style={{
                                                  color: "#64748d",
                                                  backgroundColor: "#f6f9fc",
                                                  border: "1px solid #e5edf5",
                                                  fontWeight: 500,
                                                }}
                                              >
                                                {keyword}
                                              </span>
                                            ))}
                                        </div>
                                      ) : null}
                                      <p
                                        className="hds-tnum mt-2 text-[11px]"
                                        style={{
                                          color: "#94a3b8",
                                          fontWeight: 500,
                                        }}
                                      >
                                        출처{" "}
                                        {formatPageLabel(topic.sourcePages)}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          </div>

                          {selectedTopic ? (
                            <TopicDetailPanel
                              topic={selectedTopic}
                              editingChunkId={editingChunkId}
                              editingChunkText={editingChunkText}
                              isSaving={isChunkMutationPending}
                              savingChunkId={savingChunkId}
                              showSourceDetails={
                                sourceTopicId === selectedTopic.id
                              }
                              onStartEditing={handleStartEditingChunk}
                              onCancelEditing={handleCancelEditing}
                              onChangeChunkText={handleChangeChunkText}
                              onSaveChunk={(chunkId) =>
                                void handleSaveChunk(chunkId)
                              }
                              onToggleSourceDetails={() =>
                                setSourceTopicId((prev) =>
                                  prev === selectedTopic.id
                                    ? null
                                    : selectedTopic.id,
                                )
                              }
                            />
                          ) : (
                            <EmptyShell height="h-[520px]">
                              선택된 주제가 없습니다.
                            </EmptyShell>
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
                        <EmptyShell height="h-[160px]">
                          표시할 질문 예시가 없습니다.
                        </EmptyShell>
                      ) : (
                        <QuestionsTab
                          topics={filteredTopics}
                          onTestQuestion={handleQuestionTest}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4 p-6">
              <Skeleton className="h-24 w-full rounded-[8px]" />
              <Skeleton className="h-[520px] w-full rounded-[8px]" />
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
    </PageShell>
  );
}
