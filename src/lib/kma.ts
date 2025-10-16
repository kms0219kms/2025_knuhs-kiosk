import { Temporal } from "temporal-polyfill"

export class KmaException extends Error {
  public statusCode: number = 500

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: Record<string, any> = {}

  constructor(
    message: string,
    statusCode: number,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any> | string = {},
  ) {
    super(message)

    this.name = this.constructor.name
    this.statusCode = statusCode || 500

    // Add any other custom properties
    Object.assign(this.data, data)
  }
}

export class KmaService {
  private v1BaseUrl = ""
  private v2BaseUrl = ""

  constructor(
    private authKey: string = "h_qh_CRpRaK6ofwkaQWirQ",
    private baseUrl: string = "https://apihub.kma.go.kr",
  ) {
    this.v1BaseUrl = this.baseUrl + "/api/typ01/cgi-bin/url"
    this.v2BaseUrl = this.baseUrl + "/api/typ02/openApi"
  }

  public async getNowCast(
    baseDateTime: Temporal.Instant,
    xCoord: number,
    yCoord: number,
  ): Promise<{
    temp: string | null
    hourlyRainfall: string | null

    zonalWind: string | null
    meridionalWind: string | null

    humidity: string | null

    precipitation:
      | "CLEAR"
      | "RAIN"
      | "RAIN_WITH_SNOW"
      | "SNOW"
      | "RAIN_SHOWER"
      | "RAINDROP"
      | "RAINDROP_WITH_SNOWFLY"
      | "SNOWFLY"
      | null

    windDeg: string | null
    windSpeed: string | null
  }> {
    const isoString = baseDateTime
      .toZonedDateTimeISO("Asia/Seoul")
      .toString()

    const [date, time] = [
      isoString.split("T")[0].replaceAll("-", ""),

      // 매시 10분 이전이면
      parseInt(isoString.split("T")[1].split(":")[1], 10) <= 10
        ? // 그 전 시간대 정보 보여주기
          (parseInt(isoString.split("T")[1].split(":")[0], 10) - 1)
            .toString()
            .padStart(2, "0") + "00"
        : // 10분 이후면 바로 보여주기
          isoString.split("T")[1].split(":")[0] + "00",
    ]

    const kmaRes: {
      category: string
      obsrValue: string
    }[] = []

    let page = 1

    const getData = async () => {
      const params = new URLSearchParams({
        pageNo: page.toString(),
        numOfRows: "1000",
        dataType: "JSON",

        base_date: date,
        base_time: time,

        nx: Math.round(xCoord).toString(),
        ny: Math.round(yCoord).toString(),

        authKey: this.authKey,
      })

      try {
        const endpoint =
          "/VilageFcstInfoService_2.0/getUltraSrtNcst?" +
          params.toString()
        const singleRes = await fetch(
          this.v2BaseUrl +
            (!this.baseUrl.includes("?")
              ? endpoint
              : encodeURIComponent(endpoint)),
        )

        if (!singleRes.ok) {
          throw new KmaException(
            singleRes.statusText,
            singleRes.status,
            await singleRes.json(),
          )
        }

        const data = await singleRes.json()

        data.response.body.items.item.forEach(
          (d: { category: string; obsrValue: string }) => {
            kmaRes.push({
              category: d.category,
              obsrValue: d.obsrValue,
            })
          },
        )

        if (data.totalCount > page * 1000) {
          page++
          await getData()
        }
      } catch (e) {
        if (e instanceof KmaException) {
          throw e
        }

        throw new KmaException(
          (e as TypeError).toString(),
          500,
          e as TypeError,
        )
      }
    }

    await getData()

    console.log(kmaRes.flat())

    return {
      temp:
        kmaRes.flat().find(res => res.category === "T1H")
          ?.obsrValue || null,
      hourlyRainfall:
        kmaRes.flat().find(res => res.category === "RN1")
          ?.obsrValue || null,

      zonalWind:
        kmaRes.flat().find(res => res.category === "UUU")
          ?.obsrValue || null,
      meridionalWind:
        kmaRes.flat().find(res => res.category === "VVV")
          ?.obsrValue || null,

      humidity:
        kmaRes.flat().find(res => res.category === "REH")
          ?.obsrValue || null,

      precipitation: ((code: string | null) => {
        switch (code) {
          case "0":
            return "CLEAR"
          case "1":
            return "RAIN"
          case "2":
            return "RAIN_WITH_SNOW"
          case "3":
            return "SNOW"
          case "4":
            return "RAIN_SHOWER"
          case "5":
            return "RAINDROP"
          case "6":
            return "RAINDROP_WITH_SNOWFLY"
          case "7":
            return "SNOWFLY"
          default:
            return null
        }
      })(
        kmaRes.flat().find(res => res.category === "PTY")
          ?.obsrValue || null,
      ),

      windDeg:
        kmaRes.flat().find(res => res.category === "VEC")
          ?.obsrValue || null,
      windSpeed:
        kmaRes.flat().find(res => res.category === "WSD")
          ?.obsrValue || null,
    }
  }

  public async convertCoordinateToGrid(lat: number, lon: number) {
    const params = new URLSearchParams({
      lon: Math.round(lon).toString(),
      lat: Math.round(lat).toString(),

      help: "0",
      authKey: this.authKey,
    })

    const endpoint = "/nph-dfs_xy_lonlat?" + params.toString()
    const coord = await fetch(
      this.v1BaseUrl +
        (!this.baseUrl.includes("?")
          ? endpoint
          : encodeURIComponent(endpoint)),
    )

    if (!coord.ok) {
      throw new KmaException(
        coord.statusText,
        coord.status,
        await coord.text(),
      )
    }

    const [_lon, _lat, x, y] = (await coord.text())
      .split("\n")
      .filter(ln => !ln.startsWith("#"))[0]
      .replaceAll(" ", "")
      .split(",")

    return {
      lon: _lon,
      lat: _lat,

      xCoord: x,
      yCoord: y,
    }
  }
}
