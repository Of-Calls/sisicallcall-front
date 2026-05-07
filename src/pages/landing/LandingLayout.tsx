import { Outlet } from "react-router-dom"
import { Footer } from "@/components/landing/footer"
import { Header } from "@/components/landing/header"

export function LandingLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
