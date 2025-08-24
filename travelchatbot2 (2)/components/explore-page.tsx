"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, MapPin, Compass } from "lucide-react"
import PlaceCard from "@/components/PlaceCard"
import type { Place } from "@/lib/types"
import { useTripStore } from "@/store/useTripStore"
import { activityTracker } from "@/lib/activity-tracker"

export default function ExplorePage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState<string>("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const { preferences } = useTripStore()
  const searchParams = useSearchParams()

  const categories: { id: string; name: string; icon: string }[] = [
    { id: "13065", name: "Restaurants", icon: "🍽️" },
    { id: "13032", name: "Cafes", icon: "☕" },
    { id: "19014", name: "Hotels", icon: "🏨" },
    { id: "12005", name: "Temples", icon: "🛕" },
    { id: "15014", name: "Hospitals", icon: "🏥" },
    { id: "12040", name: "ATMs", icon: "🏧" },
    { id: "17110", name: "Fuel Stations", icon: "⛽" },
    { id: "18024", name: "Gyms", icon: "💪" },
    { id: "16032", name: "Parks", icon: "🌳" },
    { id: "12009", name: "Banks", icon: "🏦" },
    { id: "17069", name: "Pharmacies", icon: "💊" },
    { id: "19009", name: "Malls", icon: "🛍️" },
  ]

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = `${pos.coords.latitude},${pos.coords.longitude}`
      setLocation(coords)
      setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      console.log("[v0] Location set:", coords)
    })
  }, [])

  useEffect(() => {
    if (!coordinates || !location) return
    const categoryParam = searchParams.get("category")
    if (categoryParam) {
      setSelectedCategories([categoryParam])
      loadCategoryPlaces(location, [categoryParam])
    } else {
      loadPopularPlaces(location)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates, location, searchParams])

  const categoryQueryMap: Record<string, string> = {
    "13065": "restaurant",
    "13032": "cafe",
    "19014": "hotel",
    "12005": "temple",
    "15014": "hospital",
    "12040": "atm",
    "17110": "fuel station",
    "18024": "gym",
    "16032": "park",
    "12009": "bank",
    "17069": "pharmacy",
    "19009": "mall",
  }

  const loadCategoryPlaces = async (coords: string, categories: string[]) => {
    setLoading(true)
    try {
      const query = categories.length === 1 ? categoryQueryMap[categories[0]] || "" : ""
      console.log("[v0] Loading category places:", categories, "query:", query)
      const response = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ll: coords,
          categories: categories,
          query,
          limit: 6,
          radius: 5000,
          budget: preferences.budget,
        }),
      })

      const data = await response.json()
      console.log("[v0] Category places response:", data)

      if (data.error) {
        console.error("[v0] API error:", data.error)
        alert(`Search failed: ${data.error}. Please check your API keys and try again.`)
        setPlaces([])
      } else {
        setPlaces(data.places || [])
        if (coordinates && selectedCategories.length > 0) {
          const categoryNames = selectedCategories
            .map((catId) => {
              const found = categories.find((c) => typeof c === "object" && c.id === catId)
              return found && typeof found.name === "string" ? found.name : catId
            })
            .join(", ")
          await activityTracker.logActivity({
            activity_type: "search",
            title: `Explored ${categoryNames}`,
            description: `Found ${data.places?.length || 0} places in selected categories`,
            location_lat: coordinates.lat,
            location_lng: coordinates.lng,
            location_name: location,
            metadata: {
              categories: selectedCategories,
              results_count: data.places?.length || 0,
              source: "category_filter",
            },
          })
        }
      }
    } catch (error) {
      console.error("[v0] Failed to load category places:", error)
      alert(`Search failed: ${error.message}. Please check your internet connection and try again.`)
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  const loadPopularPlaces = async (coords: string) => {
    setLoading(true)
    try {
      console.log("[v0] Loading popular places...")
      const response = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ll: coords,
          limit: 6,
          radius: 5000,
          budget: preferences.budget,
        }),
      })

      const data = await response.json()
      console.log("[v0] Popular places response:", data)

      if (data.error) {
        console.error("[v0] API error:", data.error)
        alert(`Search failed: ${data.error}. Please check your API keys and try again.`)
        setPlaces([])
      } else {
        setPlaces(data.places || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load popular places:", error)
      alert(`Search failed: ${error.message}. Please check your internet connection and try again.`)
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  const searchPlaces = async () => {
    if (!location) {
      console.log("[v0] No location available")
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Starting places search...")
      const response = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ll: location,
          query: query || undefined,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          limit: 6,
          radius: 5000,
          budget: preferences.budget,
        }),
      })

      const data = await response.json()
      console.log("[v0] Search response:", data)

      if (data.error) {
        console.error("[v0] API error:", data.error)
        alert(`Search failed: ${data.error}. Please check your API keys and try again.`)
        setPlaces([])
      } else {
        setPlaces(data.places || [])
        if (coordinates) {
          await activityTracker.logActivity({
            activity_type: "search",
            title: query ? `Searched for "${query}"` : "Explored nearby places",
            description: `Found ${data.places?.length || 0} places${selectedCategories.length > 0 ? ` in selected categories` : ""}`,
            location_lat: coordinates.lat,
            location_lng: coordinates.lng,
            location_name: location,
            metadata: {
              query,
              categories: selectedCategories,
              results_count: data.places?.length || 0,
              source: "search_bar",
            },
          })
        }
      }
    } catch (error) {
      console.error("[v0] Search failed:", error)
      alert(`Search failed: ${error.message}. Please check your internet connection and try again.`)
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const updated = prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
      // After updating, load recommendations for new selection
      if (location && updated.length > 0) {
        loadCategoryPlaces(location, updated)
      } else if (location && updated.length === 0) {
        loadPopularPlaces(location)
      }
      return updated
    })
  }

  const handleSavePlace = async (place: Place) => {
    if (coordinates) {
      await activityTracker.savePlace({
        place_id: place.fsq_id,
        place_name: place.name,
        place_address: place.location?.formatted_address,
        place_category: Array.isArray(place.categories) ? place.categories[0] : undefined,
        location_lat: place.geocodes?.main?.lat,
        location_lng: place.geocodes?.main?.lng,
        is_favorite: false,
      })
    }
    console.log("Saved place:", place.name)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="h-6 w-6" />
          <h1 className="text-xl font-bold">Explore Places</h1>
        </div>
        <p className="text-sm opacity-90">Discover amazing places around you</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for places..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchPlaces()}
              />
              <Button onClick={searchPlaces} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.icon} {category.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget Info */}
        {preferences.budget && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Budget</span>
                <Badge variant="secondary">
                  ₹{preferences.budget.amount.toLocaleString()} • Level {preferences.budget.maxPriceLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        {places.length > 0 && !loading && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {query || selectedCategories.length > 0 ? "Search Results" : "Popular Places Near You"}
            </h2>
            <Badge variant="outline">{places.length} places found</Badge>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Discovering amazing places...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {places.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {location
                  ? "No places found. Please check your API keys or try a different search."
                  : "Getting your location..."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
        <div className="grid gap-4">
          {places.map((place, idx) => (
            <PlaceCard key={place.fsq_id || idx} place={place} onSave={handleSavePlace} />
          ))}
        </div>
      </div>
    </div>
  )
}
