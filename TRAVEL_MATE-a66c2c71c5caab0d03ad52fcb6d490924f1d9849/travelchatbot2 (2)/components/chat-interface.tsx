"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import MapDirections from "./map-directions"
import { createClient } from "@/lib/supabase/client"

interface Message {
  role: "user" | "bot"
  content: string
  places?: Place[]
}

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

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Hello! 👋 I'm TravelMate AI, your intelligent travel assistant. I can help you find places, check weather, locate fuel stations, and plan trips. What can I help you with today?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied" | null>("loading")
  const [sessionId] = useState(`session-${Math.random().toString(36).substring(2, 12)}`)
  const [budget] = useState({ amount: 5000, currency: "INR" })
  const [fuelLevel, setFuelLevel] = useState<number | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [showDirections, setShowDirections] = useState(false)
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Supabase initialization error:", error)
        // Continue without Supabase functionality if it fails
        setUser(null)
      }
    }

    initializeSupabase()
  }, [])

  useEffect(() => {
    console.log("Chat interface initialized with sessionId:", sessionId)
    if (typeof window !== "undefined") {
      speechSynthRef.current = window.speechSynthesis
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLocation(newLocation)
          setLocationStatus("granted")
          console.log("User location obtained:", newLocation)

          if (user) {
            saveUserLocation(newLocation)
          }
        },
        (err) => {
          console.warn("Geolocation error:", err)
          setLocation(null)
          setLocationStatus("denied")
        },
      )
    } else {
      setLocationStatus("denied")
    }
  }, [sessionId, user])

  const saveUserLocation = async (userLocation: { lat: number; lng: number }) => {
    if (!user) return

    try {
      const supabase = createClient()
      await supabase.from("user_locations").upsert({
        user_id: user.id,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error saving user location:", error)
      if (error.message?.includes("Missing Supabase environment variables")) {
        console.warn("Supabase not configured - location saving disabled")
      }
    }
  }

  const savePlace = async (place: Place) => {
    if (!user) return

    try {
      const supabase = createClient()
      await supabase.from("saved_places").insert({
        user_id: user.id,
        foursquare_id: place.id,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
        category: place.category,
        rating: place.rating,
        phone: place.phone,
        website: place.website,
      })

      alert("Place saved to favorites!")
    } catch (error) {
      console.error("Error saving place:", error)
      if (error.message?.includes("Missing Supabase environment variables")) {
        alert("Database not configured - cannot save places")
      } else {
        alert("Error saving place to favorites")
      }
    }
  }

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place)
    setShowDirections(true)
  }

  const parsePlacesFromResponse = (content: string): Place[] => {
    const places: Place[] = []
    const lines = content.split("\n")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const placeMatch = line.match(/(\d+)\.\s*\*\*(.+?)\*\*/)
      if (placeMatch) {
        const name = placeMatch[2]
        let address = ""
        let rating = undefined
        let category = ""

        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j].trim()
          if (nextLine.includes("📍")) {
            address = nextLine.replace("📍", "").trim()
          }
          if (nextLine.includes("⭐")) {
            const ratingMatch = nextLine.match(/⭐\s*([\d.]+)/)
            if (ratingMatch) {
              rating = Number.parseFloat(ratingMatch[1])
            }
          }
          if (nextLine.includes("Category:")) {
            category = nextLine.replace("Category:", "").trim()
          }
        }

        if (!location) {
          console.warn("Cannot create place without user location")
          continue
        }

        places.push({
          id: `place-${i}`,
          name,
          latitude: location.lat,
          longitude: location.lng,
          address,
          category,
          rating,
        })
      }
    }

    return places
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setListening(false)
      }
      recognitionRef.current.onend = () => setListening(false)
      recognitionRef.current.onerror = () => setListening(false)
    }
  }, [])

  const speakText = (text: string) => {
    if (speechSynthRef.current && !speaking) {
      speechSynthRef.current.cancel()

      const cleanText = text.replace(/[📍🎯🌤️⛅☁️🌧️⛈️🌩️❄️🌫️💨🔥💧⭐🏨🍽️⛽🚗🗺️👋]/gu, "").trim()

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      speechSynthRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel()
      setSpeaking(false)
    }
  }

  const startListening = () => {
    if (recognitionRef.current) {
      setListening(true)
      recognitionRef.current.start()
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg: Message = { role: "user", content: input }
    setMessages((msgs) => [...msgs, userMsg])
    setInput("")
    setLoading(true)
    setIsTyping(true)

    try {
      console.log("Sending to API:", {
        message: userMsg.content,
        location,
        sessionId,
        budget,
        fuelLevel,
      })

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          location,
          sessionId,
          budget,
          fuelLevel,
        }),
      })

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const botResponse = data.reply
      const places = data.places || []

      console.log("Chat API response:", botResponse)
      console.log("Places data:", places)

      setMessages((msgs) => [
        ...msgs,
        {
          role: "bot",
          content: botResponse,
          places: places.length > 0 ? places : undefined,
        },
      ])

      if (autoSpeak) {
        setTimeout(() => speakText(botResponse), 500)
      }
    } catch (err) {
      console.error("Chat API error:", err)
      const errorMsg = `Sorry, I encountered an error: ${err.message}. Please check your internet connection and API keys.`
      setMessages((msgs) => [
        ...msgs,
        {
          role: "bot",
          content: errorMsg,
        },
      ])

      if (autoSpeak) {
        setTimeout(() => speakText(errorMsg), 500)
      }
    } finally {
      setLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) sendMessage()
  }

  const requestLocation = () => {
    setLocationStatus("loading")
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLocation(newLocation)
          setLocationStatus("granted")
        },
        () => {
          setLocationStatus("denied")
        },
      )
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">TravelMate AI</h2>
            <p className="text-sm opacity-90">
              {locationStatus === "granted"
                ? "📍 Location enabled"
                : locationStatus === "denied"
                  ? "📍 Location disabled"
                  : "📍 Getting location..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                autoSpeak ? "bg-green-500/20 text-green-100" : "bg-white/20 hover:bg-white/30"
              }`}
              title={autoSpeak ? "Auto-speak enabled" : "Auto-speak disabled"}
            >
              🔊 {autoSpeak ? "ON" : "OFF"}
            </button>
            {locationStatus === "denied" && (
              <button
                onClick={requestLocation}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
              >
                Enable Location
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`p-3 rounded-lg whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {msg.content}

                {msg.role === "bot" && msg.places && msg.places.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => {
                        setSelectedPlace(msg.places![0])
                        setShowDirections(true)
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      🗺️ Get Directions
                    </button>
                  </div>
                )}
              </div>
              {msg.role === "bot" && (
                <button
                  onClick={() => (speaking ? stopSpeaking() : speakText(msg.content))}
                  className={`p-1 rounded-full text-xs transition-colors ${
                    speaking
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                  title={speaking ? "Stop speaking" : "Read aloud"}
                >
                  {speaking ? "⏹️" : "🔊"}
                </button>
              )}
            </div>
          </div>
        ))}
        {(loading || isTyping) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">TravelMate is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-gray-50 p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
          <button
            className={`p-2 rounded-lg transition-colors ${
              listening ? "bg-green-500 text-white animate-pulse" : "bg-gray-200 hover:bg-gray-300 text-gray-600"
            }`}
            onClick={startListening}
            disabled={loading || listening}
            title="Voice input"
          >
            🎤
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>

        {messages.length === 1 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Try these suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {["Find nearby restaurants", "What's the weather?", "Locate fuel stations"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-sm bg-white border border-gray-300 hover:border-blue-500 hover:text-blue-600 px-3 py-1 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showDirections && selectedPlace && (
        <MapDirections
          place={selectedPlace}
          userLocation={location ? { latitude: location.lat, longitude: location.lng } : null}
          onClose={() => {
            setShowDirections(false)
            setSelectedPlace(null)
          }}
        />
      )}
    </div>
  )
}
