import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deleteTenantDocument,
  getTenantDocument,
  getTenantDocumentChunks,
  getTenantDocuments,
  reindexTenantDocument,
  updateTenantDocumentChunk,
  uploadTenantDocument,
} from "@/features/documents/documentApi"
import type {
  TenantDocumentsData,
  TenantDocumentsParams,
  UpdateRagDocumentChunkRequest,
} from "@/features/documents/documentTypes"

export const tenantDocumentQueryKeys = {
  all: ["tenant-documents"] as const,
  lists: () => [...tenantDocumentQueryKeys.all, "list"] as const,
  list: (tenantId: string | null | undefined, params?: TenantDocumentsParams) =>
    [...tenantDocumentQueryKeys.lists(), tenantId ?? "unknown", params] as const,
  listScope: (tenantId: string | null | undefined) =>
    [...tenantDocumentQueryKeys.lists(), tenantId ?? "unknown"] as const,
  details: () => [...tenantDocumentQueryKeys.all, "detail"] as const,
  detail: (
    tenantId: string | null | undefined,
    documentId: string | null | undefined,
  ) =>
    [
      ...tenantDocumentQueryKeys.details(),
      tenantId ?? "unknown",
      documentId ?? "unknown",
    ] as const,
  chunks: (
    tenantId: string | null | undefined,
    documentId: string | null | undefined,
  ) =>
    [
      ...tenantDocumentQueryKeys.all,
      "chunks",
      tenantId ?? "unknown",
      documentId ?? "unknown",
    ] as const,
}

export function useTenantDocuments(
  tenantId: string | null | undefined,
  params?: TenantDocumentsParams,
) {
  return useQuery<TenantDocumentsData>({
    queryKey: tenantDocumentQueryKeys.list(tenantId, params),
    queryFn: () => getTenantDocuments(tenantId!, params),
    enabled: Boolean(tenantId),
    refetchInterval: (query) => {
      if (query.state.status === "error") {
        return false
      }

      const items = query.state.data?.items ?? []
      const hasProcessingDocument = items.some(
        (document) => document.status === "processing",
      )

      return hasProcessingDocument ? 3000 : false
    },
  })
}

export function useTenantDocument(
  tenantId: string | null | undefined,
  documentId: string | null | undefined,
) {
  return useQuery({
    queryKey: tenantDocumentQueryKeys.detail(tenantId, documentId),
    queryFn: () => getTenantDocument(tenantId!, documentId!),
    enabled: Boolean(tenantId && documentId),
  })
}

export function useTenantDocumentChunks(
  tenantId: string | null | undefined,
  documentId: string | null | undefined,
) {
  return useQuery({
    queryKey: tenantDocumentQueryKeys.chunks(tenantId, documentId),
    queryFn: () => getTenantDocumentChunks(tenantId!, documentId!),
    enabled: Boolean(tenantId && documentId),
  })
}

export function useUploadTenantDocument(tenantId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => {
      if (!tenantId) {
        throw new Error("회사 정보를 확인할 수 없습니다.")
      }

      return uploadTenantDocument(tenantId, file)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tenantDocumentQueryKeys.listScope(tenantId),
      })
    },
  })
}

export function useUpdateTenantDocumentChunk(
  tenantId: string | null | undefined,
  documentId: string | null | undefined,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      chunkId,
      payload,
    }: {
      chunkId: string
      payload: UpdateRagDocumentChunkRequest
    }) => {
      if (!tenantId || !documentId) {
        throw new Error("문서 정보를 확인할 수 없습니다.")
      }

      return updateTenantDocumentChunk(tenantId, documentId, chunkId, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tenantDocumentQueryKeys.chunks(tenantId, documentId),
      })
      void queryClient.invalidateQueries({
        queryKey: tenantDocumentQueryKeys.detail(tenantId, documentId),
      })
      void queryClient.invalidateQueries({
        queryKey: tenantDocumentQueryKeys.listScope(tenantId),
      })
    },
  })
}

export function useReindexTenantDocument(
  tenantId: string | null | undefined,
  documentId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  const invalidateDocumentQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: tenantDocumentQueryKeys.listScope(tenantId),
    })
    void queryClient.invalidateQueries({
      queryKey: tenantDocumentQueryKeys.detail(tenantId, documentId),
    })
    void queryClient.invalidateQueries({
      queryKey: tenantDocumentQueryKeys.chunks(tenantId, documentId),
    })
  }

  return useMutation({
    mutationFn: () => {
      if (!tenantId || !documentId) {
        throw new Error("문서 정보를 확인할 수 없습니다.")
      }

      return reindexTenantDocument(tenantId, documentId)
    },
    onSuccess: () => {
      invalidateDocumentQueries()
    },
    onError: () => {
      invalidateDocumentQueries()
    },
  })
}

export function useDeleteTenantDocument(tenantId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => {
      if (!tenantId) {
        throw new Error("회사 정보를 확인할 수 없습니다.")
      }

      return deleteTenantDocument(tenantId, documentId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tenantDocumentQueryKeys.listScope(tenantId),
      })
    },
  })
}
