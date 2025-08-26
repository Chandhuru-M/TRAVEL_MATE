import { Skill, SkillResult, UserContext } from './types'
import { sendChatMobile, type LatLng } from '@/services/mobileChatBot'

const intentRegex = /(near|near\s*by|nearby|around|closest|find|search|locate|restaurant|hotel|gym|park|temple|cafe|atm|mall)/i

export const PlaceSearchSkill: Skill = {
  name: 'PlaceSearch',
  canHandle(input: string) { return intentRegex.test(input) },
  async run(input: string, ctx: UserContext): Promise<SkillResult | null> {
    const res = await sendChatMobile({ message: input, location: ctx.location as LatLng })
    return { reply: res.reply, places: res.places?.map(p => ({ id: p.id, name: p.name, latitude: p.latitude, longitude: p.longitude, address: p.address, category: p.category, rating: p.rating })) }
  }
}
