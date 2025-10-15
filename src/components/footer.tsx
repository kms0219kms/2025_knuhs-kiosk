import { Separator } from "@/components/ui/separator"

export default function Footer() {
  return (
    <footer className="text-muted-foreground pt-12 pb-6 text-center text-sm">
      <div className="mb-2 flex flex-col items-center justify-center gap-2 lg:flex-row">
        <span>
          &copy; 2025{" "}
          <a
            href="https://instagram.com/knuhs_programmedworld"
            className="text-primary underline"
          >
            KNUHS Programmed World
          </a>{" "}
          X{" "}
          <a
            href="https://lunaiz.com"
            className="text-primary underline"
          >
            lunaiz Corp.
          </a>{" "}
          All rights reserved.
        </span>

        <Separator
          className="bg-border hidden !h-4 lg:block"
          orientation="vertical"
        />
        <Separator
          className="bg-border my-2 !w-30 lg:hidden"
          orientation="horizontal"
        />

        <span>
          Contact:{" "}
          <a
            href="mailto:25-10631@knu.hs.kr"
            className="text-primary underline"
          >
            25-10631@knu.hs.kr
          </a>
        </span>
      </div>

      <span>
        본 어플리케이션의 데이터는 교육행정정보시스템 '나이스', 기상청
        '날씨누리', 한국환경공단 'AirKorea'에서 제공받았습니다.
      </span>
    </footer>
  )
}
