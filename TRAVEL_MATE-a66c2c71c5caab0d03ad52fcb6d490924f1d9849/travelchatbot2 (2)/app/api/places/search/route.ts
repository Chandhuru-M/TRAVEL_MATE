import { type NextRequest, NextResponse } from "next/server"

const FOURSQUARE_API_KEY = "JF5V1BCCXN4HOT4YOGZIG5WXKAPXSK1UIUKFYGHLXBRMOGJ2"
const FOURSQUARE_URL = "https://places-api.foursquare.com/places/search"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ll, query, categories, limit = 10, radius = 5000 } = body

    console.log("[v0] Places search request:", { ll, query, categories, limit, radius })

    if (!FOURSQUARE_API_KEY) {
      return NextResponse.json({ error: "Foursquare API key is required for real-time data" }, { status: 500 })
    }

    // Build Foursquare API request
    const url = new URL(FOURSQUARE_URL)
    url.searchParams.append("ll", ll)
    url.searchParams.append("limit", limit.toString())
    url.searchParams.append("radius", radius.toString())

    if (query) {
      url.searchParams.append("query", query)
    }

    if (categories && categories.length > 0) {
      url.searchParams.append("categories", categories.join(","))
    }

    console.log("Foursquare API URL:", url.toString())

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
          "X-Places-Api-Version": "2025-06-17",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.log(" Foursquare API error:", errorData)
        return NextResponse.json(
          { error: `Foursquare API error: ${response.status}`, details: errorData },
          { status: response.status },
        )
      }

      const data = await response.json()
      console.log("Foursquare API success:", data.results?.length, "places")

      return NextResponse.json({ places: data.results || [] })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.log("Foursquare API fetch error:", fetchError)
      return NextResponse.json({ error: "Failed to fetch places data", details: fetchError.message }, { status: 500 })
    }
  } catch (error) {
    console.error("Places search error:", error)
    return NextResponse.json({ error: "Places search failed", details: error.message }, { status: 500 })
  }
}
