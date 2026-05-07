export type RagDocumentStatus = "processing" | "ready" | "failed"

export interface TenantDocument {
  id: string
  tenant_id: string
  file_name: string
  file_type: "pdf" | "faq"
  chunk_count: number | null
  status: RagDocumentStatus
  chroma_collection?: string | null
  uploaded_at: string
  indexed_at: string | null
}

export interface RagDocumentChunk {
  id: string
  document_id: string
  tenant_id: string
  chunk_index: number
  page_number: number | null
  content: string
  metadata: Record<string, unknown>
  embedding_status?: RagDocumentStatus
  chroma_id?: string | null
  updated_at?: string
}

export interface RagDocumentChunkApiResponse {
  id: string
  document_id: string
  tenant_id: string
  chunk_index: number
  page?: number | null
  page_number?: number | null
  content: string
  metadata: Record<string, unknown>
  embedding_status?: RagDocumentStatus
  chroma_id?: string | null
  updated_at?: string
}

export interface UpdateRagDocumentChunkRequest {
  content: string
  metadata?: Record<string, unknown>
}

export type TenantDocumentsData = {
  items: TenantDocument[]
  total: number
  offset: number
  limit: number
}

export type TenantDocumentsParams = {
  offset?: number
  limit?: number
}

export type ApiResponse<T> = {
  data: T
  request_id: string
}

export type UploadTenantDocumentData = {
  document_id: string
  status: string
}

export type DeleteTenantDocumentData = {
  document_id: string
  deleted: boolean
}

export type TenantDocumentChunksData = {
  items: RagDocumentChunk[]
  total: number
}

export type TenantDocumentChunksApiData = {
  items: RagDocumentChunkApiResponse[]
  total: number
}

export type ReindexTenantDocumentData = {
  document_id: string
  status: RagDocumentStatus
  chunk_count?: number
  indexed_at?: string | null
}
