import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["brand/sisicallcall-icon.png"],
      manifest: {
        name: "시시콜콜 관리자 대시보드",
        short_name: "시시콜콜",
        description: "AI 음성 고객 상담 관리자 대시보드",
        lang: "ko",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/dashboard",
        scope: "/",
        icons: [
          {
            src: "/brand/sisicallcall-icon.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/auth/"),
            handler: "NetworkOnly",
            options: {
              cacheName: "auth-api",
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/dashboard/") ||
              url.pathname.startsWith("/call") ||
              url.pathname.startsWith("/summary"),
            handler: "NetworkOnly",
            options: {
              cacheName: "admin-api",
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
