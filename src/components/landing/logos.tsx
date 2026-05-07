const companies = [
  "삼성전자",
  "현대자동차",
  "LG전자",
  "SK텔레콤",
  "네이버",
  "카카오",
  "쿠팡",
  "배달의민족",
]

export function Logos() {
  return (
    <section className="border-y border-border bg-muted/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
          대한민국 대표 기업들이 시시콜콜을 사용하고 있습니다
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          {companies.map((company) => (
            <div
              key={company}
              className="flex h-10 items-center justify-center rounded-lg bg-background px-6 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition-all"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
