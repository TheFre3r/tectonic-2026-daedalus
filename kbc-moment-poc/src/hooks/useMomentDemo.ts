import { useEffect, useMemo, useState } from 'react'
import { scenarios, type Scenario, type Signal } from '../data/scenarios'
import { buildInference, scaleForScenario } from '../engine/momentEngine'

export type DemoView =
  | 'overview'
  | 'app'
  | 'advisor'
  | 'channels'
  | 'privacy'
  | 'scale'

export function useMomentDemo() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const [epoch, setEpoch] = useState(0)
  const [signals, setSignals] = useState<Signal[]>([])
  const [view, setView] = useState<DemoView>('overview')
  const [showAfter, setShowAfter] = useState(true)
  const [consent, setConsent] = useState(true)
  const [advisorOverride, setAdvisorOverride] = useState(false)

  const scenario = useMemo(
    () => scenarios.find((s) => s.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  )

  useEffect(() => {
    setSignals([])
    setView('overview')
    setShowAfter(true)
    setAdvisorOverride(false)

    if (!consent) return

    const timers = scenario.signals.map((signal) =>
      window.setTimeout(() => {
        setSignals((prev) =>
          prev.some((s) => s.id === signal.id) ? prev : [...prev, signal],
        )
      }, signal.delayMs),
    )

    return () => timers.forEach(clearTimeout)
  }, [scenario, epoch, consent])

  const inference = useMemo(
    () => buildInference(scenario, consent ? signals : []),
    [scenario, signals, consent],
  )

  const scale = useMemo(
    () => scaleForScenario(scenario, inference.ready && consent),
    [scenario, inference.ready, consent],
  )

  function selectScenario(id: string) {
    setScenarioId(id)
    setEpoch((e) => e + 1)
  }

  function replay() {
    setEpoch((e) => e + 1)
  }

  return {
    scenarios,
    scenario,
    inference,
    scale,
    view,
    setView,
    showAfter,
    setShowAfter,
    consent,
    setConsent,
    advisorOverride,
    setAdvisorOverride,
    selectScenario,
    replay,
  }
}

export type MomentDemo = ReturnType<typeof useMomentDemo> & {
  scenario: Scenario
}
