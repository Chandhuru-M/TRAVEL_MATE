import { Skill, UserContext } from './types'
import { PlaceSearchSkill } from './PlaceSearchSkill'

const skills: Skill[] = [PlaceSearchSkill]

export async function runSkills(input: string, ctx: UserContext) {
  for (const s of skills) {
    try {
      if (s.canHandle(input)) {
        const out = await s.run(input, ctx)
        if (out) return out
      }
    } catch (e) {
      // continue to next skill
    }
  }
  return null
}
