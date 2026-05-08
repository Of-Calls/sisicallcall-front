const companies = [
  "삼성전자",
  "현대자동차",
  "LG전자",
  "SK텔레콤",
  "네이버",
  "카카오",
  "쿠팡",
  "배달의민족",
];

export function Logos() {
  return (
    <section className="border-y border-[#e5edf5] bg-[#f6f9fc] py-14">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <p
          className="mb-8 text-center text-[11px] uppercase tracking-[1.2px] text-[#64748d]"
          style={{ fontFamily: "var(--hds-font-body)", fontWeight: 600 }}
        >
          대한민국 대표 기업들이 시시콜콜을 신뢰합니다
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-5">
          {companies.map((company) => (
            <div
              key={company}
              className="hds-logo-chip flex h-10 items-center justify-center px-5 text-[13px] text-[#273951]"
              style={{
                fontFamily: "var(--hds-font-display)",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
