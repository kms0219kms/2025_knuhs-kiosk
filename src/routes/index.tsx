import { useEffect, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"

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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import Footer from "@/components/footer"

export const Route = createFileRoute("/")({
  component: RouteComponent,
})

function getDDay(currentTime: Date, targetDate: Date): number {
  // 오늘 날짜와 목표 날짜의 밀리초 차이 계산
  const diff = targetDate.getTime() - currentTime.getTime()

  // 밀리초를 일(day)로 변환 ($diff / (1000 * 60 * 60 * 24))
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function ScheduleItem({
  date,
  description,
}: {
  date: string
  description: string
}) {
  return (
    <div className="bg-muted rounded border p-3">
      <div className="text-muted-foreground text-sm font-semibold">
        {date}
      </div>
      <ul className="text-muted-foreground/80 mt-1 list-inside list-disc text-sm">
        <li>{description}</li>
      </ul>
    </div>
  )
}

function RouteComponent() {
  const timeCounterRef = useRef<number>(0)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  const timetable = [
    ["자율", "논리학", "지구I", "선택E", "논리학"],
    ["선택B", "선택E", "선택C", "지구I", "미적분"],
    ["사회선택", "과탐실", "논리학", "스포츠", "선택B"],
    ["선택C", "미적분", "영독작", "선택D", "선택E"],
    ["영독작", "영독작", "자율", "미적분", "지구I"],
    ["선택E", "사회선택", "자율", "선택B", "선택C"],
    ["논리학", "독서", "-", "진로활동", "선택D"],
  ]

  useEffect(() => {
    if (!timeCounterRef.current) {
      timeCounterRef.current = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
    }
  }, [])

  return (
    <div className="mx-auto max-w-2xl py-6 tracking-tighter">
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
                {currentTime.toISOString().split("T")[0]}
              </div>
              <div className="text-5xl font-semibold">
                {
                  currentTime
                    .toISOString()
                    .split("T")[1]
                    .split(".")[0]
                }
              </div>
            </div>

            {/* 날씨 */}
            <div className="flex items-center gap-2 text-xl font-semibold">
              <span>🌤️</span>
              <span>29°C (체감: 28.08°C)</span>
            </div>

            {/* 미세먼지 정보 */}
            <div className="text-muted-foreground flex flex-col gap-1 text-xl">
              <div className="flex w-full justify-between gap-4">
                <span>
                  미세먼지:{" "}
                  <span className="text-foreground font-semibold">
                    64
                  </span>
                </span>
                <Badge className="bg-green-200 text-green-800">
                  보통
                </Badge>
              </div>

              <div className="flex w-full justify-between gap-4">
                <span>
                  초미세먼지:{" "}
                  <span className="text-foreground font-semibold">
                    27
                  </span>
                </span>
                <Badge className="bg-green-200 text-green-800">
                  보통
                </Badge>
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
                    currentTime,
                    new Date("2025-11-13T09:00:00Z"),
                  )}
                </span>
              </div>

              <div className="inline-flex gap-2">
                ✍️&nbsp;&nbsp;기말고사:{" "}
                <span className="font-semibold">
                  D-
                  {getDDay(
                    currentTime,
                    new Date("2025-12-08T09:00:00Z"),
                  )}
                </span>
              </div>

              <div className="inline-flex gap-2">
                ☃️&nbsp;&nbsp;겨울방학:{" "}
                <span className="font-semibold">
                  D-
                  {getDDay(
                    currentTime,
                    new Date("2025-12-26T09:00:00Z"),
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
              🗓️&nbsp;&nbsp;이번 달 학사일정
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <ScheduleItem
              date="2025.10.14(화)"
              description="전국연합학력평가"
            />
            <ScheduleItem
              date="2025.10.17(금)"
              description="군성제"
            />
            <ScheduleItem
              date="2025.10.18(토)"
              description="토요휴업일"
            />
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
                <Select>
                  <SelectTrigger className="w-full">
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

                <Select>
                  <SelectTrigger className="w-full">
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

            <table className="w-full table-auto border text-sm">
              <thead className="bg-accent">
                <tr>
                  <th className="border px-2 py-1">교시</th>
                  <th className="border px-2 py-1">월</th>
                  <th className="border px-2 py-1">화</th>
                  <th className="border px-2 py-1">수</th>
                  <th className="border px-2 py-1">목</th>
                  <th className="border px-2 py-1">금</th>
                </tr>
              </thead>

              <tbody>
                {timetable.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="border px-2 py-1 text-center">
                      {rowIndex + 1}
                    </td>

                    {row.map((subject, colIndex) => (
                      <td
                        key={colIndex}
                        className="border px-1.5 py-3 text-center"
                      >
                        {subject}
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
              🍱&nbsp;&nbsp;이번 주 점심 메뉴
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <ScheduleItem
              date="2025.10.14(화)"
              description="전국연합학력평가"
            />
            <ScheduleItem
              date="2025.10.17(금)"
              description="군성제"
            />
            <ScheduleItem
              date="2025.10.18(토)"
              description="토요휴업일"
            />
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
