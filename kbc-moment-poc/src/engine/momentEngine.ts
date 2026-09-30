import type { Scenario, Signal } from '../data/scenarios'

export type DemoPhase =
  | 'idle'
  | 'listening'
  | 'recognizing'
  | 'orchestrating'
  | 'ready'

export type InferenceSnapshot = {
  phase: DemoPhase
  signalsSeen: Signal[]
  progress: number
  confidence: number
  situation: string | null
  intent: string | null
  behavior: string | null
  ready: boolean
}

export function buildInference(
  scenario: Scenario,
  signalsSeen: Signal[],
): InferenceSnapshot {
  const total = scenario.signals.length
  const count = signalsSeen.length
  const progress = total === 0 ? 0 : count / total
  const weightSum = signalsSeen.reduce((sum, s) => sum + s.weight, 0)
  const confidence = Math.min(scenario.confidence, Number(weightSum.toFixed(2)))

  let phase: DemoPhase = 'idle'
  if (count === 0) phase = 'idle'
  else if (progress < 0.6) phase = 'listening'
  else if (progress < 1) phase = 'recognizing'
  else phase = 'orchestrating'

  const ready = count >= total

  return {
    phase: ready ? 'ready' : phase,
    signalsSeen,
    progress,
    confidence: ready ? scenario.confidence : confidence,
    situation: progress >= 0.4 ? scenario.situation : null,
    behavior: progress >= 0.6 ? scenario.behavior : null,
    intent: progress >= 0.8 ? scenario.intent : null,
    ready,
  }
}

export type ScaleMetrics = {
  momentsToday: number
  channelsOrchestrated: number
  mutedCampaigns: number
  advisorBriefings: number
}

export function scaleForScenario(scenario: Scenario, ready: boolean): ScaleMetrics {
  if (!ready) {
    return {
      momentsToday: 0,
      channelsOrchestrated: 0,
      mutedCampaigns: 0,
      advisorBriefings: 0,
    }
  }

  const seed = scenario.id.length * 9973
  return {
    momentsToday: 128_400 + seed,
    channelsOrchestrated: 412_900 + seed * 2,
    mutedCampaigns: 38_200 + seed,
    advisorBriefings: 14_650 + Math.floor(seed / 3),
  }
}
