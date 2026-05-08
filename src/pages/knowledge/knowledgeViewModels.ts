import type { RagDocumentChunk } from "@/features/documents/documentTypes"

type UnknownRecord = Record<string, unknown>

const topicTitleKeys = [
  "title",
  "topic",
  "category",
  "section_title",
  "heading",
  "product_name",
]

const summaryKeys = ["summary"]
const keywordKeys = ["keywords"]
const pageKeys = ["page", "page_number", "page_numbers", "pages", "source_page", "source_pages"]
const questionPriorityKeys = [
  "questions",
  "example_questions",
  "examples",
  "intent_examples",
]

export const documentStatusLabelMap = {
  processing: "AI 상담 지식으로 준비 중",
  ready: "사용 가능",
  failed: "처리 실패",
  completed: "사용 가능",
  error: "처리 실패",
} as const

export type DocumentTopicView = {
  id: string
  title: string
  summary: string
  keywords: string[]
  answerText: string
  exampleQuestions: string[]
  sourcePages: number[]
  chunkIds: string[]
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

function extractSourcePages(chunk: RagDocumentChunk, metadata: Record<string, unknown>) {
  return uniqueNumbers([
    ...(typeof chunk.page_number === "number" ? [chunk.page_number] : []),
    ...getNumberArrayMeta(metadata, pageKeys),
  ])
}

function isPageFallbackTitle(title: string) {
  return /^p\.\d+\s내용$/.test(title)
}

function buildFallbackQuestions(title: string) {
  if (isPageFallbackTitle(title) || /^주제 \d+$/.test(title)) {
    return [
      "이 내용에 대해 알려주세요",
      "이 내용은 어떻게 되나요?",
      "이 내용 관련해서 문의드려요",
    ]
  }

  return [
    `${title}에 대해 알려주세요`,
    `${title}은 어떻게 되나요?`,
    `${title} 관련해서 문의드려요`,
  ]
}

function extractExampleQuestions(metadata: Record<string, unknown>, title: string) {
  const questions = uniqueStrings(getStringArrayMeta(metadata, questionPriorityKeys))

  if (questions.length > 0) {
    return questions.slice(0, 5)
  }

  return buildFallbackQuestions(title)
}

export function buildDocumentTopicViews(chunks: RagDocumentChunk[]): DocumentTopicView[] {
  const groups = new Map<
    string,
    {
      id: string
      title: string
      summaryCandidates: string[]
      keywords: string[]
      answerParts: string[]
      exampleQuestions: string[]
      sourcePages: number[]
      chunkIds: string[]
      rawChunks: RagDocumentChunk[]
      sortPage: number
      sortIndex: number
    }
  >()

  const sortedChunks = [...chunks].sort((left, right) => left.chunk_index - right.chunk_index)

  sortedChunks.forEach((chunk, index) => {
    const metadata = toRecord(chunk.metadata)
    const title = extractTopicTitle(metadata, chunk, index)
    const answerText = cleanText(chunk.content)
    const summary = extractSummary(metadata, answerText)
    const keywords = extractKeywords(metadata)
    const sourcePages = extractSourcePages(chunk, metadata)
    const exampleQuestions = extractExampleQuestions(metadata, title)
    const groupKey = title.toLowerCase()

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: `${groupKey}-${index}`,
        title,
        summaryCandidates: [],
        keywords: [],
        answerParts: [],
        exampleQuestions: [],
        sourcePages: [],
        chunkIds: [],
        rawChunks: [],
        sortPage: sourcePages[0] ?? Number.MAX_SAFE_INTEGER,
        sortIndex: chunk.chunk_index,
      })
    }

    const group = groups.get(groupKey)
    if (!group) {
      return
    }

    if (summary) {
      group.summaryCandidates.push(summary)
    }
    if (answerText) {
      group.answerParts.push(answerText)
    }
    group.keywords = uniqueStrings([...group.keywords, ...keywords])
    group.exampleQuestions = uniqueStrings([...group.exampleQuestions, ...exampleQuestions])
    group.sourcePages = uniqueNumbers([...group.sourcePages, ...sourcePages])
    group.chunkIds.push(chunk.id)
    group.rawChunks.push(chunk)
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
      const summary =
        uniqueStrings(group.summaryCandidates)[0] ?? truncateText(answerText, 96)

      return {
        id: group.id,
        title: group.title,
        summary,
        keywords: group.keywords,
        answerText,
        exampleQuestions: group.exampleQuestions.slice(0, 5),
        sourcePages: group.sourcePages,
        chunkIds: group.chunkIds,
        rawChunks: group.rawChunks,
      }
    })
}
