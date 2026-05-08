import type { RagDocumentChunk } from "@/features/documents/documentTypes"

type UnknownRecord = Record<string, unknown>

const topicTitleKeys = [
  "topic",
  "title",
  "section",
  "section_title",
  "heading",
  "header",
  "subject",
  "intent",
  "faq_title",
  "label",
  "product_name",
]

const topicCategoryKeys = [
  "category",
  "category_name",
  "group",
  "domain",
  "product",
  "product_name",
  "service",
]

const questionKeys = [
  "exampleQuestions",
  "example_questions",
  "questions",
  "question_examples",
  "question",
  "examples",
  "intents",
  "intent_examples",
]

const pageKeys = [
  "page",
  "page_number",
  "page_numbers",
  "pages",
  "source_page",
  "source_pages",
]

const enabledKeys = ["enabled", "is_enabled", "active", "is_active", "use_yn"]

const falseLikeValues = new Set(["0", "false", "inactive", "n", "no", "off"])

export const documentStatusLabelMap = {
  processing: "AI 상담 지식으로 준비 중",
  ready: "사용 가능",
  failed: "처리 실패",
  completed: "사용 가능",
  error: "처리 실패",
} as const

export type ReviewReason =
  | "missing-title"
  | "long-content"
  | "short-content"
  | "missing-page"

export type TopicChunkView = {
  id: string
  chunkIndex: number
  content: string
  pageNumber: number | null
  metadata: Record<string, unknown>
  createdAt: string | null
  updatedAt: string | null
  embeddingStatus: string | null
  chromaId: string | null
}

export type DocumentTopicView = {
  id: string
  title: string
  category: string | null
  summary: string
  answerText: string
  exampleQuestions: string[]
  sourcePages: number[]
  chunkIds: string[]
  rawChunks: TopicChunkView[]
  primaryChunkId: string
  isEnabled: boolean
  needsReview: boolean
  reviewReasons: ReviewReason[]
}

export type DocumentTopicReviewItem = {
  id: string
  topicId: string
  chunkId: string | null
  reason: ReviewReason
  title: string
  description: string
  actionLabel: string
}

function toRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  return value as UnknownRecord
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function firstString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string") {
      const trimmed = cleanText(value)
      if (trimmed) {
        return trimmed
      }
    }
  }

  return null
}

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => parseStringList(item))
      .map(cleanText)
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|;|•|\/+/)
      .map(cleanText)
      .filter(Boolean)
  }

  return []
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)))
}

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

function parseNumberList(value: unknown): number[] {
  if (Array.isArray(value)) {
    return uniqueNumbers(value.flatMap((item) => parseNumberList(item)))
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return [value]
  }

  if (typeof value === "string") {
    const matches = value.match(/\d+/g)
    if (!matches) {
      return []
    }

    return uniqueNumbers(
      matches
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item)),
    )
  }

  return []
}

function extractExampleQuestions(metadata: UnknownRecord, title: string) {
  const explicitQuestions = uniqueStrings(
    questionKeys.flatMap((key) => parseStringList(metadata[key])),
  )

  if (explicitQuestions.length > 0) {
    return explicitQuestions.slice(0, 5)
  }

  return generateExampleQuestions(title)
}

function generateExampleQuestions(title: string) {
  if (title.includes("예약")) {
    return ["예약하고 싶어요", "예약은 어떻게 하나요?", "예약 변경 가능한가요?"]
  }

  if (title.includes("운영") || title.includes("영업") || title.includes("시간")) {
    return [
      "영업시간이 어떻게 되나요?",
      "주말에도 운영하나요?",
      "오늘 몇 시까지 가능한가요?",
    ]
  }

  if (title.includes("취소") || title.includes("변경")) {
    return [
      "예약 취소하고 싶어요",
      "일정을 변경할 수 있나요?",
      "취소 수수료가 있나요?",
    ]
  }

  if (title.includes("환불")) {
    return ["환불 가능한가요?", "환불 기준이 어떻게 되나요?", "환불은 언제 처리되나요?"]
  }

  if (title.includes("준비물")) {
    return ["무엇을 준비해야 하나요?", "방문 전에 챙길 것이 있나요?", "준비물 안내해 주세요"]
  }

  if (title.includes("주의")) {
    return ["주의할 점이 있나요?", "이용 전에 꼭 알아야 할 내용이 있나요?", "제한 사항이 있나요?"]
  }

  return [
    `${title} 알려주세요`,
    `${title}은 어떻게 되나요?`,
    `${title} 관련 문의드려요`,
  ]
}

function extractPages(chunk: RagDocumentChunk, metadata: UnknownRecord) {
  const pages = [
    ...(typeof chunk.page_number === "number" ? [chunk.page_number] : []),
    ...pageKeys.flatMap((key) => parseNumberList(metadata[key])),
  ]

  return uniqueNumbers(pages)
}

function extractEnabled(metadata: UnknownRecord) {
  for (const key of enabledKeys) {
    const value = metadata[key]

    if (typeof value === "boolean") {
      return value
    }

    if (typeof value === "number") {
      return value !== 0
    }

    if (typeof value === "string") {
      return !falseLikeValues.has(value.trim().toLowerCase())
    }
  }

  return true
}

function buildFallbackTitle(index: number, sourcePages: number[]) {
  if (sourcePages.length > 0) {
    return `p.${sourcePages[0]} 내용`
  }

  return `주제 ${index + 1}`
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trim()}...`
}

export function buildDocumentTopicViews(chunks: RagDocumentChunk[]): DocumentTopicView[] {
  const groups = new Map<
    string,
    {
      id: string
      title: string
      category: string | null
      answerParts: string[]
      exampleQuestions: string[]
      sourcePages: number[]
      chunkIds: string[]
      rawChunks: TopicChunkView[]
      isEnabled: boolean
      reviewReasons: Set<ReviewReason>
      sortPage: number
      sortIndex: number
    }
  >()

  const sortedChunks = [...chunks].sort((left, right) => left.chunk_index - right.chunk_index)

  sortedChunks.forEach((chunk, index) => {
    const metadata = toRecord(chunk.metadata) ?? {}
    const sourcePages = extractPages(chunk, metadata)
    const titleFromMetadata = firstString(metadata, topicTitleKeys)
    const category = firstString(metadata, topicCategoryKeys)
    const title = titleFromMetadata ?? buildFallbackTitle(index, sourcePages)
    const groupKey = `${category ?? "default"}::${title.toLowerCase()}`
    const answerText = cleanText(chunk.content)

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: groupKey,
        title,
        category,
        answerParts: [],
        exampleQuestions: [],
        sourcePages: [],
        chunkIds: [],
        rawChunks: [],
        isEnabled: true,
        reviewReasons: new Set<ReviewReason>(),
        sortPage: sourcePages[0] ?? Number.MAX_SAFE_INTEGER,
        sortIndex: chunk.chunk_index,
      })
    }

    const group = groups.get(groupKey)
    if (!group) {
      return
    }

    if (!group.answerParts.includes(answerText)) {
      group.answerParts.push(answerText)
    }

    group.exampleQuestions = uniqueStrings([
      ...group.exampleQuestions,
      ...extractExampleQuestions(metadata, title),
    ])
    group.sourcePages = uniqueNumbers([...group.sourcePages, ...sourcePages])
    group.chunkIds.push(chunk.id)
    group.rawChunks.push({
      id: chunk.id,
      chunkIndex: chunk.chunk_index,
      content: chunk.content,
      pageNumber: chunk.page_number,
      metadata,
      createdAt:
        typeof chunk.created_at === "string" && chunk.created_at.trim().length > 0
          ? chunk.created_at
          : null,
      updatedAt:
        typeof chunk.updated_at === "string" && chunk.updated_at.trim().length > 0
          ? chunk.updated_at
          : null,
      embeddingStatus: typeof chunk.embedding_status === "string" ? chunk.embedding_status : null,
      chromaId: typeof chunk.chroma_id === "string" ? chunk.chroma_id : null,
    })
    group.isEnabled = group.isEnabled && extractEnabled(metadata)

    if (!titleFromMetadata) {
      group.reviewReasons.add("missing-title")
    }

    if (answerText.length > 600) {
      group.reviewReasons.add("long-content")
    }

    if (answerText.length > 0 && answerText.length < 40) {
      group.reviewReasons.add("short-content")
    }

    if (sourcePages.length === 0) {
      group.reviewReasons.add("missing-page")
    }
  })

  return Array.from(groups.values())
    .sort((left, right) => {
      if (left.sortPage !== right.sortPage) {
        return left.sortPage - right.sortPage
      }

      return left.sortIndex - right.sortIndex
    })
    .map((group) => {
      const answerText = group.answerParts.join("\n\n")

      return {
        id: group.id,
        title: group.title,
        category: group.category,
        summary: truncateText(answerText, 96),
        answerText,
        exampleQuestions: group.exampleQuestions.slice(0, 5),
        sourcePages: group.sourcePages,
        chunkIds: group.chunkIds,
        rawChunks: group.rawChunks,
        primaryChunkId: group.rawChunks[0]?.id ?? group.id,
        isEnabled: group.isEnabled,
        needsReview: group.reviewReasons.size > 0,
        reviewReasons: Array.from(group.reviewReasons),
      }
    })
}

export function buildTopicReviewItems(topics: DocumentTopicView[]): DocumentTopicReviewItem[] {
  const items: DocumentTopicReviewItem[] = []

  topics.forEach((topic) => {
    topic.reviewReasons.forEach((reason) => {
      switch (reason) {
        case "missing-title":
          items.push({
            id: `${topic.id}-${reason}`,
            topicId: topic.id,
            chunkId: topic.rawChunks[0]?.id ?? null,
            reason,
            title: "주제 확인 필요",
            description: "문서에서 제목 없이 추출된 내용입니다.",
            actionLabel: "주제 확인",
          })
          break
        case "long-content":
          items.push({
            id: `${topic.id}-${reason}`,
            topicId: topic.id,
            chunkId: topic.rawChunks[0]?.id ?? null,
            reason,
            title: "내용 나누기 권장",
            description: "한 항목에 여러 주제가 섞여 있을 수 있습니다.",
            actionLabel: "내용 수정",
          })
          break
        case "short-content":
          items.push({
            id: `${topic.id}-${reason}`,
            topicId: topic.id,
            chunkId: topic.rawChunks[0]?.id ?? null,
            reason,
            title: "내용 보강 필요",
            description: "답변 내용이 짧아 상담 문맥이 부족할 수 있습니다.",
            actionLabel: "내용 수정",
          })
          break
        case "missing-page":
          items.push({
            id: `${topic.id}-${reason}`,
            topicId: topic.id,
            chunkId: topic.rawChunks[0]?.id ?? null,
            reason,
            title: "출처 확인 필요",
            description: "PDF 페이지 정보가 없어 원문 확인이 어렵습니다.",
            actionLabel: "원문 보기",
          })
          break
      }
    })
  })

  return items
}
