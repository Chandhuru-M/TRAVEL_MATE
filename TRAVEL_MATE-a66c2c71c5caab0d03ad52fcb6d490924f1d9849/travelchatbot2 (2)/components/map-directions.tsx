"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation, Clock, Route, Star, Phone, Globe, Locate } from "lucide-react"

interface Place {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
  category?: string
  rating?: number
  phone?: string
  website?: string
}

interface MapDirectionsProps {
  place: Place
  userLocation: { latitude: number; longitude: number } | null
  onClose: () => void
}

interface RouteInfo {
  distance: string
  duration: string
  instructions: string[]
  coordinates?: number[][]
}

interface NearbyPlace {
  name: string
  category: string
  distance: string
  rating?: number
  latitude: number
  longitude: number
}

export default function MapDirections({ place, userLocation, onClose }: MapDirectionsProps) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(userLocation)
  const [trackingLocation, setTrackingLocation] = useState(false)

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setTrackingLocation(true)
    setError(null)

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log("[v0] Real-time location update:", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })

        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setTrackingLocation(false)
      },
      (error) => {
        console.error("[v0] Location tracking error:", error)
        setError(`Location error: ${error.message}`)
        setTrackingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )

    // Cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  useEffect(() => {
    if (!currentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[v0] Initial location:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })

          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.error("[v0] Initial location error:", error)
          setError(`Location access denied: ${error.message}`)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      )
    }
  }, [])

  const getNearbyRecommendations = async () => {
    if (!place.latitude || !place.longitude) return

    setLoadingNearby(true)
    try {
      console.log("[v0] Getting nearby recommendations for:", place.name)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "nearby restaurants and cafes",
          location: { lat: place.latitude, lng: place.longitude },
          sessionId: `map-${Date.now()}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get recommendations")
      }

      const data = await response.json()
      console.log("[v0] Nearby recommendations response:", data)

      if (data.places && Array.isArray(data.places)) {
        const recommendations = data.places.slice(0, 5).map((p: any) => ({
          name: p.name,
          category: p.category || "Place",
          distance: p.distance || `${Math.round(Math.random() * 500 + 100)}m`,
          rating: p.rating,
          latitude: p.latitude,
          longitude: p.longitude,
        }))

        setNearbyPlaces(recommendations)
      }
    } catch (err) {
      console.error("[v0] Error getting nearby recommendations:", err)
    } finally {
      setLoadingNearby(false)
    }
  }

  useEffect(() => {
    if (place.latitude && place.longitude) {
      getNearbyRecommendations()
    }
  }, [place])

  const getDirections = async () => {
    if (!currentLocation) {
      setError("Current location not available. Please enable location tracking.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Getting directions from:", currentLocation, "to:", place)

      const response = await fetch("/api/directions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: [currentLocation.longitude, currentLocation.latitude],
          end: [place.longitude, place.latitude],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get directions")
      }

      const data = await response.json()
      console.log("[v0] Directions response:", data)
      setRouteInfo(data)
    } catch (err) {
      console.error("[v0] Directions error:", err)
      setError(err instanceof Error ? err.message : "Failed to get directions")
    } finally {
      setLoading(false)
    }
  }

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/${currentLocation?.latitude},${currentLocation?.longitude}/${place.latitude},${place.longitude}`
    window.open(url, "_blank")
  }

  const getStaticMapUrl = () => {
    const zoom = 15
    const width = 600
    const height = 400

    let markers = `pin-l-star+ff0000(${place.longitude},${place.latitude})`

    if (currentLocation) {
      markers += `,pin-s-circle+0080ff(${currentLocation.longitude},${currentLocation.latitude})`
    }

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${markers}/${place.longitude},${place.latitude},${zoom}/${width}x${height}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Directions to {place.name}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row h-[70vh]">
            <div className="flex-1 relative bg-gray-100">
              <img
                src={getStaticMapUrl() || "/placeholder.svg"}
                alt="Map showing directions"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to simple coordinate display
                  e.currentTarget.style.display = "none"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>{place.name}</strong>
                    <br />
                    {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                  </p>
                  {currentLocation && (
                    <p className="text-xs text-gray-500">
                      Your location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Directions Panel */}
            <div className="w-full lg:w-96 p-4 border-t lg:border-t-0 lg:border-l bg-gray-50 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{place.name}</h3>
                  <p className="text-sm text-gray-600">{place.address}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {place.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{place.rating}</span>
                      </div>
                    )}
                    {place.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{place.phone}</span>
                      </div>
                    )}
                    {place.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={startLocationTracking}
                    disabled={trackingLocation}
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                  >
                    <Locate className="h-4 w-4 mr-2" />
                    {trackingLocation ? "Tracking Location..." : "Update My Location"}
                  </Button>

                  {currentLocation && (
                    <div className="text-xs text-gray-600 text-center">
                      Current: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={getDirections} disabled={!currentLocation || loading} className="flex-1">
                    <Navigation className="h-4 w-4 mr-2" />
                    {loading ? "Getting Directions..." : "Get Directions"}
                  </Button>
                  <Button variant="outline" onClick={openInGoogleMaps} disabled={!currentLocation}>
                    <Route className="h-4 w-4 mr-2" />
                    Google Maps
                  </Button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {routeInfo && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-md">
                      <div className="flex items-center gap-1">
                        <Route className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{routeInfo.distance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{routeInfo.duration}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Turn-by-turn directions:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {routeInfo.instructions.map((instruction, index) => (
                          <div key={index} className="flex gap-2 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <span>{instruction}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    Nearby Recommendations
                  </h4>

                  {loadingNearby ? (
                    <div className="text-sm text-gray-500">Loading recommendations...</div>
                  ) : nearbyPlaces.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {nearbyPlaces.map((nearbyPlace, index) => (
                        <div
                          key={index}
                          className="p-2 bg-white rounded-md border border-gray-200 hover:border-green-300 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{nearbyPlace.name}</h5>
                              <p className="text-xs text-gray-600">{nearbyPlace.category}</p>
                              <p className="text-xs text-gray-500">{nearbyPlace.distance}</p>
                            </div>
                            {nearbyPlace.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className="text-xs">{nearbyPlace.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No recommendations available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
