// Node test harness for sendChatMobile. Run with: npm run chat:test
import 'dotenv/config'
import { sendChatMobile } from '@/services/mobileChatBot'

async function runTests() {
  const location = { lat: 13.0827, lng: 80.2707 }

  const sections: Array<[string, string]> = [
    ['Greeting', 'hello'],
    ['Weather', 'weather now'],
    ['Nearby Restaurants', 'nearby restaurants'],
    ['Fuel Stations', 'find fuel station'],
    ['Trip Plan', 'plan trip 9 am to 6 pm, 3000 rs'],
  ]

  for (const [title, message] of sections) {
    console.log(`\n=== TEST: ${title} ===`)
    try {
      const res = await sendChatMobile({ message, location })
      const previewPlaces = res.places?.slice(0, 3)?.map((p) => ({ name: p.name, addr: p.address }))
      console.log({ reply: res.reply, places: previewPlaces })
    } catch (e: any) {
      console.error('Error:', e?.message || e)
    }
  }
}

runTests()
// End
