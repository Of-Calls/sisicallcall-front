import type { PropsWithChildren } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { AuthBootstrap } from "@/shared/auth/AuthBootstrap"
import { PwaInstallBridge } from "@/shared/pwa/PwaInstallBridge"

const queryClient = new QueryClient()

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <PwaInstallBridge />
      <AuthBootstrap>{children}</AuthBootstrap>
      <Toaster />
    </QueryClientProvider>
  )
}
