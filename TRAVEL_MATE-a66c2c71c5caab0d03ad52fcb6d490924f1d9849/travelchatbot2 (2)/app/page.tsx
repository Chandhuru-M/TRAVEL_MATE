import { ChatInterface } from "@/components/chat-interface"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TravelMate AI</h1>
          <p className="text-lg text-gray-600 mb-4">Your intelligent travel companion powered by AI</p>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
            <span className="bg-white px-3 py-1 rounded-full">🗺️ Places</span>
            <span className="bg-white px-3 py-1 rounded-full">🌤️ Weather</span>
            <span className="bg-white px-3 py-1 rounded-full">⛽ Fuel Stations</span>
            <span className="bg-white px-3 py-1 rounded-full">📍 Trip Planning</span>
          </div>
        </div>

        <div className="flex justify-center">
          <ChatInterface />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Foursquare, OpenWeather, and Gemini AI</p>
        </div>
      </div>
    </div>
  )
}
