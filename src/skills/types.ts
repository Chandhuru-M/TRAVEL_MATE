export type UserContext = {
  location?: { lat: number; lng: number } | null
  sessionId?: string
}

export type SkillResult = {
  reply: string
  places?: Array<{ id: string; name: string; latitude: number; longitude: number; address: string; category?: string; rating?: number }>
}

export interface Skill {
  name: string
  canHandle(input: string): boolean
  run(input: string, ctx: UserContext): Promise<SkillResult | null>
}
