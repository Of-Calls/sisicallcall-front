import { apiFetch } from "@/shared/api/client"
import { endpoints } from "@/shared/api/endpoints"
import type {
  ApiResponse,
  DeleteTenantDocumentData,
  RagDocumentChunk,
  RagDocumentChunkApiResponse,
  ReindexTenantDocumentData,
  TenantDocument,
  TenantDocumentChunksApiData,
  TenantDocumentChunksData,
  TenantDocumentsData,
  TenantDocumentsParams,
  UpdateRagDocumentChunkRequest,
  UploadTenantDocumentData,
} from "@/features/documents/documentTypes"

function buildDocumentSearchParams(params: TenantDocumentsParams = {}) {
  const searchParams = new URLSearchParams()

  if (typeof params.offset === "number") {
    searchParams.set("offset", String(params.offset))
  }

  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit))
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T) {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response
  ) {
    return (response as ApiResponse<T>).data
  }

  return response as T
}

function normalizeChunk(chunk: RagDocumentChunkApiResponse): RagDocumentChunk {
  return {
    id: chunk.id,
    document_id: chunk.document_id,
    tenant_id: chunk.tenant_id,
    chunk_index: chunk.chunk_index,
    page_number: chunk.page_number ?? chunk.page ?? null,
    content: chunk.content,
    metadata: chunk.metadata ?? {},
    embedding_status: chunk.embedding_status,
    chroma_id: chunk.chroma_id ?? null,
    updated_at: chunk.updated_at,
  }
}

export async function getTenantDocuments(
  tenantId: string,
  params?: TenantDocumentsParams,
) {
  const response = await apiFetch<ApiResponse<TenantDocumentsData>>(
    `${endpoints.tenantDocuments(tenantId)}${buildDocumentSearchParams(params)}`,
  )

  return response.data
}

export async function getTenantDocument(
  tenantId: string,
  documentId: string,
) {
  const response = await apiFetch<ApiResponse<TenantDocument> | TenantDocument>(
    endpoints.tenantDocumentDetail(tenantId, documentId),
  )

  return unwrapApiResponse(response)
}

export async function getTenantDocumentChunks(
  tenantId: string,
  documentId: string,
) {
  const response = await apiFetch<
    ApiResponse<TenantDocumentChunksApiData> | TenantDocumentChunksApiData
  >(
    endpoints.tenantDocumentChunks(tenantId, documentId),
  )

  const data = unwrapApiResponse(response)

  return {
    ...data,
    items: data.items.map(normalizeChunk),
  } satisfies TenantDocumentChunksData
}

export async function updateTenantDocumentChunk(
  tenantId: string,
  documentId: string,
  chunkId: string,
  payload: UpdateRagDocumentChunkRequest,
) {
  const response = await apiFetch<
    ApiResponse<RagDocumentChunkApiResponse> | RagDocumentChunkApiResponse
  >(
    endpoints.tenantDocumentChunkDetail(tenantId, documentId, chunkId),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  )

  return normalizeChunk(unwrapApiResponse(response))
}

export async function reindexTenantDocument(
  tenantId: string,
  documentId: string,
) {
  const response = await apiFetch<
    ApiResponse<ReindexTenantDocumentData> | ReindexTenantDocumentData
  >(
    endpoints.tenantDocumentReindex(tenantId, documentId),
    {
      method: "POST",
    },
  )

  return unwrapApiResponse(response)
}

export async function uploadTenantDocument(tenantId: string, file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await apiFetch<ApiResponse<UploadTenantDocumentData>>(
    endpoints.tenantDocuments(tenantId),
    {
      method: "POST",
      body: formData,
    },
  )

  return response.data
}

export async function deleteTenantDocument(
  tenantId: string,
  documentId: string,
) {
  const response = await apiFetch<ApiResponse<DeleteTenantDocumentData>>(
    endpoints.tenantDocumentDetail(tenantId, documentId),
    {
      method: "DELETE",
    },
  )

  return response.data
}
