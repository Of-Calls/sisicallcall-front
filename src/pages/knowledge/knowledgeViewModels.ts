import type { RagDocumentChunk } from "@/features/documents/documentTypes"

type UnknownRecord = Record<string, unknown>

const topicTitleKeys = [
  "llm_title",
  "title",
  "topic",
  "category",
  "section_title",
  "heading",
  "product_name",
]

const summaryKeys = ["llm_summary", "summary"]
const keywordKeys = ["llm_keywords", "keywords"]
const pageKeys = ["page", "page_number", "page_numbers", "pages", "source_page", "source_pages"]

export const documentStatusLabelMap = {
  processing: "AI 상담 지식으로 준비 중",
  ready: "사용 가능",
  failed: "처리 실패",
  completed: "사용 가능",
  error: "처리 실패",
} as const

export type ChunkView = {
  title: string
  summary: string
  keywords: string[]
}

export function buildChunkView(chunk: RagDocumentChunk, fallbackIndex: number): ChunkView {
  const metadata = toRecord(chunk.metadata)
  const answerText = cleanText(chunk.content)
  return {
    title: extractTopicTitle(metadata, chunk, fallbackIndex),
    summary: extractSummary(metadata, answerText),
    keywords: extractKeywords(metadata),
  }
}

export type DocumentPageView = {
  id: string
  pageNumber: number | null
  label: string
  chunkCount: number
  previewTitles: string[]
  searchableText: string
  rawChunks: RagDocumentChunk[]
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function toRecord(value: unknown): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return value as UnknownRecord
}

export function getStringMeta(
  metadata: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = metadata[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return undefined
}

export function getStringArrayMeta(
  metadata: Record<string, unknown>,
  keys: string[],
): string[] {
  for (const key of keys) {
    const value = metadata[key]

    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    }

    if (typeof value === "string" && value.trim().length > 0) {
      return value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  return []
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean)))
}

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

function getNumberArrayMeta(metadata: Record<string, unknown>, keys: string[]) {
  const numbers: number[] = []

  for (const key of keys) {
    const value = metadata[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      numbers.push(value)
      continue
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "number" && Number.isFinite(item)) {
          numbers.push(item)
          return
        }

        if (typeof item === "string") {
          const parsed = Number(item.trim())
          if (Number.isFinite(parsed)) {
            numbers.push(parsed)
          }
        }
      })
      continue
    }

    if (typeof value === "string") {
      const matches = value.match(/\d+/g)
      if (matches) {
        matches.forEach((match) => {
          const parsed = Number(match)
          if (Number.isFinite(parsed)) {
            numbers.push(parsed)
          }
        })
      }
    }
  }

  return uniqueNumbers(numbers)
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trim()}...`
}

function extractTopicTitle(metadata: Record<string, unknown>, chunk: RagDocumentChunk, index: number) {
  const explicitTitle = getStringMeta(metadata, topicTitleKeys)
  if (explicitTitle) {
    return explicitTitle
  }

  const metadataPages = getNumberArrayMeta(metadata, pageKeys)
  const page = metadataPages[0] ?? chunk.page_number

  if (typeof page === "number" && Number.isFinite(page)) {
    return `p.${page} 내용`
  }

  return `주제 ${index + 1}`
}

function extractSummary(metadata: Record<string, unknown>, answerText: string) {
  const summary = getStringMeta(metadata, summaryKeys)
  return summary ?? truncateText(answerText, 96)
}

function extractKeywords(metadata: Record<string, unknown>) {
  return uniqueStrings(getStringArrayMeta(metadata, keywordKeys))
}

function isPageFallbackTitle(title: string) {
  return /^p\.\d+\s내용$/.test(title)
}

export function buildDocumentPageViews(chunks: RagDocumentChunk[]): DocumentPageView[] {
  const groups = new Map<
    string,
    {
      id: string
      pageNumber: number | null
      label: string
      rawChunks: RagDocumentChunk[]
      sortKey: number
    }
  >()

  const sortedChunks = [...chunks].sort((left, right) => left.chunk_index - right.chunk_index)

  sortedChunks.forEach((chunk) => {
    const pageNumber =
      typeof chunk.page_number === "number" && Number.isFinite(chunk.page_number)
        ? chunk.page_number
        : null
    const groupKey = pageNumber === null ? "page-unknown" : `page-${pageNumber}`
    const label = pageNumber === null ? "페이지 정보 없음" : `p.${pageNumber}`
    const sortKey = pageNumber === null ? Number.MAX_SAFE_INTEGER : pageNumber

    const existing = groups.get(groupKey)
    if (existing) {
      existing.rawChunks.push(chunk)
      return
    }

    groups.set(groupKey, {
      id: groupKey,
      pageNumber,
      label,
      rawChunks: [chunk],
      sortKey,
    })
  })

  return Array.from(groups.values())
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((group) => {
      const previewTitles: string[] = []
      const searchParts: string[] = [group.label]

      group.rawChunks.forEach((chunk, idx) => {
        const view = buildChunkView(chunk, idx)
        const isFallbackTitle =
          isPageFallbackTitle(view.title) || /^주제 \d+$/.test(view.title)

        if (previewTitles.length < 2) {
          if (!isFallbackTitle) {
            previewTitles.push(view.title)
          } else {
            const cleanedBody = cleanText(chunk.content)
            const head = cleanedBody.slice(0, 30)
            if (head) {
              previewTitles.push(cleanedBody.length > 30 ? `${head}…` : head)
            }
          }
        }

        searchParts.push(view.title, view.summary, ...view.keywords, cleanText(chunk.content))
      })

      return {
        id: group.id,
        pageNumber: group.pageNumber,
        label: group.label,
        chunkCount: group.rawChunks.length,
        previewTitles,
        searchableText: searchParts.join("\n").toLowerCase(),
        rawChunks: group.rawChunks,
      }
    })
}

