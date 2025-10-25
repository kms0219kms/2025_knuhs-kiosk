import { Fragment, useEffect, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"

import Neis, { type HisTimetableResponse } from "neis.ts"
import { Logger } from "tslog"
import { Temporal } from "temporal-polyfill"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectValue,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
//import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import Footer from "@/components/footer"
import { KmaService } from "@/lib/kma"

export const Route = createFileRoute("/")({
  component: RouteComponent,
})

// 컴퓨터용 날짜를 사람이 읽을 수 있도록 만들기
function formatDate(dateStr: string): string {
  // 유효성 검사
  if (!/^\d{8}$/.test(dateStr)) {
    throw new Error("올바르지 않은 날짜 형식입니다.")
  }

  try {
    // 날짜 문자열을 Temporal.PlainDate 객체로 변환
    const year = parseInt(dateStr.slice(0, 4), 10)
    const month = parseInt(dateStr.slice(4, 6), 10)
    const day = parseInt(dateStr.slice(6, 8), 10)

    const date = new Temporal.PlainDate(year, month, day)

    // 요일 한글 목록 (ISO: 1 = 월요일, 7 = 일요일)
    const weekdayKor = ["월", "화", "수", "목", "금", "토", "일"]
    const weekday = weekdayKor[date.dayOfWeek - 1] // ISO 기준

    // 형식화된 문자열 반환
    return `${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")}(${weekday})`
  } catch {
    throw new Error("올바르지 않은 날짜입니다.")
  }
}

// D-몇일 남았는지 계산
function getDDay(
  { epochMilliseconds: currentTime }: Temporal.Instant,
  { epochMilliseconds: targetDate }: Temporal.Instant,
): number {
  // 오늘 날짜와 목표 날짜의 밀리초 차이 계산
  const diff = targetDate - currentTime

  // 밀리초를 일(day)로 변환 ($diff / (1000 * 60 * 60 * 24))
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// 월요일과 금요일 날짜를 계산
function getWeekRange(yyyymmdd: string) {
  // 연, 월, 일을 얻어서 컴퓨터가 계산할 수 있는 날짜 형태로 변환
  const year = Number(yyyymmdd.slice(0, 4))
  const month = Number(yyyymmdd.slice(4, 6))
  const day = Number(yyyymmdd.slice(6, 8))
  const date = Temporal.PlainDate.from({ year, month, day })

  const dayOfWeek = date.dayOfWeek // 1 (월) ~ 7 (일)

  // 월요일: 현재 날짜 - (dayOfWeek - 1)
  const monday = date.subtract({ days: dayOfWeek - 1 })
  // 금요일: 현재 날짜 + (5 - dayOfWeek)
  const friday = date.add({ days: 5 - dayOfWeek })

  // yyyymmdd 형식으로 반환
  const format = (d: Temporal.PlainDate) =>
    `${d.year}${String(d.month).padStart(2, "0")}${String(d.day).padStart(2, "0")}`
  return [format(monday), format(friday)]
}

// 날짜와 그 날짜에 대한 설명을 보여주는 컴포넌트
function DateAndDetailItem({
  date,
  descriptions,
}: {
  date: string
  descriptions: string[]
}) {
  return (
    <div className="bg-muted min-h-[71px] rounded border p-3">
      <div className="text-muted-foreground text-sm font-semibold">
        {formatDate(date)}
      </div>
      <ul className="text-muted-foreground/80 mt-1 list-inside list-disc text-sm">
        {descriptions.map((description, i) => (
          <li key={`${date}-${i}`}>{description}</li>
        ))}
      </ul>
    </div>
  )
}

function RouteComponent() {
  const kmaService = new KmaService(
    import.meta.env.VITE_PUBLIC_KMA_KEY,
    "https://proxy-ap.corsfix.com/?url=https://apihub.kma.go.kr",
  )
  const neisClient = new Neis({
    key: import.meta.env.VITE_PUBLIC_NEIS_KEY,
    logger: new Logger(),
  })

  const timeCounterRef = useRef<number>(0)
  const [currentTime, setCurrentTime] =
    useState<Temporal.ZonedDateTime>(
      Temporal.Now.zonedDateTimeISO("Asia/Seoul"),
    )

  const {
    data: weather,
    isLoading: isWeatherLoading,
    error: weatherError,
  } = useQuery({
    queryKey: ["weather"],
    queryFn: async () => {
      const { xCoord, yCoord } =
        await kmaService.convertCoordinateToGrid(
          35.8625866,
          128.6006212,
        )

      return kmaService.getNowCast(
        currentTime.toInstant(),
        Number(xCoord),
        Number(yCoord),
      )
    },

    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const {
    data: schedules,
    isLoading: isSchedulesLoading,
    error: schedulesError,
  } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      return neisClient.getSchedule({
        ATPT_OFCDC_SC_CODE: "D10",
        SD_SCHUL_CODE: "7004180",
        AA_FROM_YMD: currentTime
          .toString()
          .split("T")[0]
          .replaceAll("-", ""),
        AA_TO_YMD: currentTime
          .add(Temporal.Duration.from({ months: 1 }))
          .toString()
          .split("T")[0]
          .replaceAll("-", ""),
      })
    },

    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const {
    data: lunchMenus,
    isLoading: isLunchMenusLoading,
    error: lunchMenusError,
  } = useQuery({
    queryKey: ["lunch-menus"],
    queryFn: async () => {
      const today = parseInt(
        currentTime.toString().split("T")[0].replaceAll("-", ""),
        10,
      )

      return neisClient.getMeal({
        ATPT_OFCDC_SC_CODE: "D10",
        SD_SCHUL_CODE: "7004180",
        MLSV_FROM_YMD: today.toString(),
        MLSV_TO_YMD: (today + 2).toString(),
      })
    },

    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const [grade, setGrade] = useState<number>(1)
  const [classroom, setClassroom] = useState<number>(6)
  const { data: timetables } = useQuery({
    queryKey: ["timetables", `${grade}-${classroom}`],
    queryFn: async () => {
      const [monday, friday] = getWeekRange(
        currentTime.toString().split("T")[0].replaceAll("-", ""),
      )

      const data = await neisClient.getHisTimetable({
        ATPT_OFCDC_SC_CODE: "D10",
        SD_SCHUL_CODE: "7004180",
        GRADE: grade.toString(),
        CLASS_NM: classroom.toString(),
        TI_FROM_YMD: monday.toString(),
        TI_TO_YMD: friday.toString(),
      })

      const baseDate = parseInt(monday, 10)
      const mapFn = (d: HisTimetableResponse) => {
        return d.ITRT_CNTNT.replaceAll(" ", "")
          .replace("공통", "")
          .replace("통합", "")
          .replace("과학탐구실험", "실험")
          .replace("[보강]", "")
          .replace("·자치", "")
          .replace("활동", "")
          .replace("IB", "")
          .replace("영어연극이론과창작", "연극이론")
          .replace("분석과접근", "AA")
          .replace(/\d/g, "")
          .replace(/[\u2160-\u2188]/g, "")
          .replace(
            /\bM{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})\b/gi,
            "",
          )
      }

      return [
        data
          .filter(d => d.ALL_TI_YMD === baseDate.toString())
          .map(mapFn),
        data
          .filter(d => d.ALL_TI_YMD === (baseDate + 1).toString())
          .map(mapFn),
        data
          .filter(d => d.ALL_TI_YMD === (baseDate + 2).toString())
          .map(mapFn),
        data
          .filter(d => d.ALL_TI_YMD === (baseDate + 3).toString())
          .map(mapFn),
        data
          .filter(d => d.ALL_TI_YMD === (baseDate + 4).toString())
          .map(mapFn),
      ]
    },

    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    placeholderData: [
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
    ],
  })

  useEffect(() => {
    if (!timeCounterRef.current) {
      timeCounterRef.current = setInterval(() => {
        setCurrentTime(Temporal.Now.zonedDateTimeISO("Asia/Seoul"))
      }, 1000)
    }
  }, [])

  return (
    <div
      className="mx-auto max-w-3xl py-6 tracking-tighter"
      style={{ zoom: 0.8 }}
    >
      <h1 className="inline-flex items-center gap-3 pb-6 text-2xl font-bold">
        <img
          src="/knuhs-logo.png"
          alt="경북대학교사범대학부설고등학교 교표"
          className="size-10"
        />
        KNUHS NoticeBoard
      </h1>

      <div className="grid grid-cols-2 gap-6">
        {/* D-DAY */}
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-start space-y-8">
            {/* 시간 */}
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-lg">
                🕒&nbsp;&nbsp;
                {currentTime.toString().split("T")[0]}
              </div>
              <div className="text-5xl font-semibold">
                {currentTime.toString().split("T")[1].split(".")[0]}
              </div>
            </div>

            {/* 날씨 */}
            <div className="flex items-center gap-2 text-xl font-semibold">
              <span>🌤️</span>
              {isWeatherLoading && !weather ? (
                <span>0.0℃</span>
              ) : weatherError ? (
                <span className="text-persian-red-500 dark:text-persian-red-400 text-base">
                  {weatherError.toString()}
                </span>
              ) : !weather ? (
                <span className="text-persian-red-500 dark:text-persian-red-400 text-base">
                  알 수 없는 오류가 발생했습니다.
                </span>
              ) : (
                <span>{Number(weather.temp || 0).toFixed(1)}℃</span>
              )}
            </div>

            {/* 미세먼지 정보 */}
            <div className="text-muted-foreground flex flex-col gap-1 text-xl">
              <div className="flex w-full justify-between gap-4">
                <span>
                  미세먼지:{" "}
                  <span className="text-foreground font-semibold">
                    정보 없음
                  </span>
                </span>
                {/*<Badge className="bg-green-200 text-green-800">*/}
                {/*  보통*/}
                {/*</Badge>*/}
              </div>

              <div className="flex w-full justify-between gap-4">
                <span>
                  초미세먼지:{" "}
                  <span className="text-foreground font-semibold">
                    정보 없음
                  </span>
                </span>
                {/*<Badge className="bg-green-200 text-green-800">*/}
                {/*  보통*/}
                {/*</Badge>*/}
              </div>
            </div>
          </CardContent>

          <CardFooter className="h-full flex-col justify-end gap-6">
            <Separator orientation="horizontal" />

            {/* 남은 날짜 정보 */}
            <div className="text-foreground flex w-full flex-col gap-1 text-xl">
              <div className="inline-flex gap-2">
                🏫&nbsp;&nbsp;2026 수능:{" "}
                <span className="font-semibold">
                  D-
                  {getDDay(
                    Temporal.Instant.from(currentTime.toString()),
                    Temporal.Instant.from(
                      "2025-11-13T00:00:00+09:00[Asia/Seoul]",
                    ),
                  )}
                </span>
              </div>

              <div className="inline-flex gap-2">
                ✍️&nbsp;&nbsp;기말고사:{" "}
                <span className="font-semibold">
                  D-
                  {getDDay(
                    Temporal.Instant.from(currentTime.toString()),
                    Temporal.Instant.from(
                      "2025-12-08T00:00:00+09:00[Asia/Seoul]",
                    ),
                  )}
                </span>
              </div>

              <div className="inline-flex gap-2">
                ☃️&nbsp;&nbsp;겨울방학:{" "}
                <span className="font-semibold">
                  D-
                  {getDDay(
                    Temporal.Instant.from(currentTime.toString()),
                    Temporal.Instant.from(
                      "2025-12-26T00:00:00+09:00[Asia/Seoul]",
                    ),
                  )}
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* 학사일정 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-semibold">
              🗓️&nbsp;&nbsp;앞으로의 학사일정
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {isSchedulesLoading && !schedules ? (
              <Fragment>
                <Skeleton className="h-[71px] w-full rounded" />
                <Skeleton className="h-[71px] w-full rounded" />
                <Skeleton className="h-[71px] w-full rounded" />
                <Skeleton className="h-[71px] w-full rounded" />
              </Fragment>
            ) : schedulesError ? (
              <span className="text-persian-red-500 dark:text-persian-red-400 text-base">
                {schedulesError.toString()}
              </span>
            ) : !schedules ? (
              <span className="text-persian-red-500 dark:text-persian-red-400 text-base">
                알 수 없는 오류가 발생했습니다.
              </span>
            ) : (
              schedules
                .filter(
                  schedule => schedule.EVENT_NM !== "토요휴업일",
                )
                .map((schedule, i) => (
                  <DateAndDetailItem
                    key={`schedule-${i}`}
                    date={schedule.AA_YMD}
                    descriptions={[schedule.EVENT_NM]}
                  />
                ))
            )}
          </CardContent>
        </Card>

        {/* 시간표 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-semibold">
              🎒&nbsp;&nbsp;이번 주 시간표
            </CardTitle>
          </CardHeader>

          <CardContent className="overflow-auto">
            {/* 반 정보 입력 */}
            <div className="mb-4 flex items-center gap-4">
              {/* 학년 선택 */}
              <div className="flex w-full flex-col gap-1">
                <label className="text-muted-foreground text-sm font-medium">
                  학년
                </label>
                <Select
                  value={grade.toString()}
                  onValueChange={value => {
                    setGrade(parseInt(value, 10))
                    setClassroom(1)
                  }}
                >
                  <SelectTrigger className="!text-foreground w-full">
                    <SelectValue placeholder="3학년" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1학년</SelectItem>
                    <SelectItem value="2">2학년</SelectItem>
                    <SelectItem value="3">3학년</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 반 선택 */}
              <div className="flex w-full flex-col gap-1">
                <label className="text-muted-foreground text-sm font-medium">
                  반
                </label>

                <Select
                  value={classroom.toString()}
                  onValueChange={value =>
                    setClassroom(parseInt(value, 10))
                  }
                >
                  <SelectTrigger className="!text-foreground w-full">
                    <SelectValue placeholder="4반" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1반</SelectItem>
                    <SelectItem value="2">2반</SelectItem>
                    <SelectItem value="3">3반</SelectItem>
                    <SelectItem value="4">4반</SelectItem>
                    <SelectItem value="5">5반</SelectItem>
                    <SelectItem value="6">6반</SelectItem>
                    <SelectItem value="7">7반</SelectItem>
                    <SelectItem value="8">8반</SelectItem>
                    <SelectItem value="9">9반</SelectItem>
                    <SelectItem value="10">10반</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <table className="w-full table-fixed border text-sm">
              <colgroup>
                <col className="w-[24px]" /> {/* 교시 열 */}
                <col /> {/* 월 */}
                <col /> {/* 화 */}
                <col /> {/* 수 */}
                <col /> {/* 목 */}
                <col /> {/* 금 */}
              </colgroup>

              <thead className="bg-accent">
                <tr>
                  <th className="border px-2 py-1"></th>
                  <th className="border px-2 py-1">월</th>
                  <th className="border px-2 py-1">화</th>
                  <th className="border px-2 py-1">수</th>
                  <th className="border px-2 py-1">목</th>
                  <th className="border px-2 py-1">금</th>
                </tr>
              </thead>

              <tbody>
                {[0, 1, 2, 3, 4, 5, 6].map((_, periodIndex) => (
                  <tr key={periodIndex}>
                    <td className="border px-2 py-1 text-center text-[12px]">
                      {periodIndex + 1}
                    </td>

                    {[0, 1, 2, 3, 4].map(dayIndex => (
                      <td
                        key={dayIndex}
                        className="overflow-hidden border px-1.5 py-3 text-center text-[12px] whitespace-nowrap"
                      >
                        {timetables![dayIndex][periodIndex] || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 급식 안내 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-semibold">
              🍱&nbsp;&nbsp;점심 메뉴
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLunchMenusLoading && !lunchMenus ? (
              <Fragment>
                <Skeleton className="h-[71px] w-full rounded" />
                <Skeleton className="h-[71px] w-full rounded" />
                <Skeleton className="h-[71px] w-full rounded" />
                <Skeleton className="h-[71px] w-full rounded" />
              </Fragment>
            ) : lunchMenusError ? (
              <span className="text-persian-red-500 dark:text-persian-red-400 text-base">
                {lunchMenusError.toString()}
              </span>
            ) : !lunchMenus ? (
              <span className="text-persian-red-500 dark:text-persian-red-400 text-base">
                알 수 없는 오류가 발생했습니다.
              </span>
            ) : (
              lunchMenus.map((menu, i) => (
                <DateAndDetailItem
                  key={`lunch-${i}`}
                  date={menu.MLSV_YMD}
                  descriptions={menu.DDISH_NM.split("<br/>")}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
