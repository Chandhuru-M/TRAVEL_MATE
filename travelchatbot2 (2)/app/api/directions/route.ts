import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { start, end } = await request.json()

    if (!start || !end || start.length !== 2 || end.length !== 2) {
      return NextResponse.json({ error: "Invalid coordinates provided" }, { status: 400 })
    }

    const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY

    if (!ORS_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouteService API key is required for real-time directions" },
        { status: 500 },
      )
    }

    const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: {
        Accept: "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        coordinates: [start, end],
        format: "json",
        instructions: true,
        geometry: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("OpenRouteService API error:", errorData)
      return NextResponse.json(
        { error: `Directions API error: ${response.status}`, details: errorData },
        { status: response.status },
      )
    }

    const data = await response.json()
    const route = data.routes[0]

    // Format the response
    const formattedResponse = {
      distance: `${(route.summary.distance / 1000).toFixed(1)} km`,
      duration: `${Math.round(route.summary.duration / 60)} min`,
      instructions: route.segments[0].steps.map((step: any) => step.instruction),
      coordinates: route.geometry.coordinates,
    }

    return NextResponse.json(formattedResponse)
  } catch (error) {
    console.error("Directions API error:", error)
    return NextResponse.json({ error: "Failed to calculate directions", details: error.message }, { status: 500 })
  }
}
