import { useCallback, useMemo, useState } from 'react'
import { scenarios } from '../data/scenarios'
import {
  SESSION_KEY,
  customerActionsByScenario,
  getScenario,
  type CustomerAction,
} from '../data/customerActions'
import { buildInference } from '../engine/momentEngine'

export type AppTab = 'home' | 'betalen' | 'zoeken' | 'berichten' | 'ik'

type Persisted = {
  scenarioId: string
  consent: boolean
  unlockedSignalIds: string[]
  checkedItems: string[]
  onboarded: boolean
  advisorRead: boolean
}

function load(): Persisted | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Persisted
    if (!parsed || typeof parsed !== 'object') return null
    if (!scenarios.some((s) => s.id === parsed.scenarioId)) return null
    return {
      scenarioId: parsed.scenarioId,
      consent: Boolean(parsed.consent),
      unlockedSignalIds: Array.isArray(parsed.unlockedSignalIds)
        ? parsed.unlockedSignalIds.filter((id) => typeof id === 'string')
        : [],
      checkedItems: Array.isArray(parsed.checkedItems)
        ? parsed.checkedItems.filter((id) => typeof id === 'string')
        : [],
      onboarded: Boolean(parsed.onboarded),
      advisorRead: Boolean(parsed.advisorRead),
    }
  } catch {
    return null
  }
}

function save(state: Persisted) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    // Prototype: ignore quota / private mode failures.
  }
}

const defaultState = (): Persisted => ({
  scenarioId: scenarios[0].id,
  consent: true,
  unlockedSignalIds: [],
  checkedItems: [],
  onboarded: false,
  advisorRead: false,
})

export function useCustomerSession() {
  const [state, setState] = useState<Persisted>(() => load() ?? defaultState())
  const [tab, setTab] = useState<AppTab>('home')
  const [toast, setToast] = useState<string | null>(null)

  const persist = useCallback((next: Persisted) => {
    setState(next)
    save(next)
  }, [])

  const scenario = useMemo(() => getScenario(state.scenarioId), [state.scenarioId])

  const actions = useMemo(
    () => customerActionsByScenario[state.scenarioId] ?? [],
    [state.scenarioId],
  )

  const signalsSeen = useMemo(
    () =>
      state.consent
        ? scenario.signals.filter((s) => state.unlockedSignalIds.includes(s.id))
        : [],
    [scenario, state.consent, state.unlockedSignalIds],
  )

  const inference = useMemo(
    () => buildInference(scenario, signalsSeen),
    [scenario, signalsSeen],
  )

  const momentActive = inference.ready && state.consent

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2200)
  }

  function startSession(scenarioId: string, consent: boolean) {
    const next: Persisted = {
      scenarioId,
      consent,
      unlockedSignalIds: [],
      checkedItems: [],
      onboarded: true,
      advisorRead: false,
    }
    persist(next)
    setTab('home')
    showToast(consent ? 'Welkom — personalisatie aan' : 'Welkom — standaardmodus')
  }

  function resetSession() {
    sessionStorage.removeItem(SESSION_KEY)
    persist(defaultState())
    setTab('home')
  }

  function setConsent(consent: boolean) {
    persist({
      ...state,
      consent,
      unlockedSignalIds: consent ? state.unlockedSignalIds : [],
      advisorRead: consent ? state.advisorRead : false,
    })
    showToast(consent ? 'Personalisatie aan' : 'Personalisatie uit')
  }

  function runAction(action: CustomerAction) {
    if (state.unlockedSignalIds.includes(action.unlocksSignalId)) {
      showToast('Dit heb je al gedaan')
      return
    }
    const nextIds = [...state.unlockedSignalIds, action.unlocksSignalId]
    persist({ ...state, unlockedSignalIds: nextIds })
    showToast(action.detail)

    const nextSignals = scenario.signals.filter((s) => nextIds.includes(s.id))
    const nextInference = buildInference(scenario, state.consent ? nextSignals : [])
    if (nextInference.ready && state.consent) {
      window.setTimeout(() => {
        showToast('Je home is aangepast aan je situatie')
        setTab('home')
      }, 600)
    }
  }

  function toggleCheck(label: string) {
    const exists = state.checkedItems.includes(label)
    persist({
      ...state,
      checkedItems: exists
        ? state.checkedItems.filter((x) => x !== label)
        : [...state.checkedItems, label],
    })
  }

  function markAdvisorRead() {
    persist({ ...state, advisorRead: true })
  }

  const unreadAdvisor = momentActive && !state.advisorRead

  return {
    scenarios,
    scenario,
    actions,
    inference,
    momentActive,
    state,
    tab,
    setTab,
    toast,
    unreadAdvisor,
    startSession,
    resetSession,
    setConsent,
    runAction,
    toggleCheck,
    markAdvisorRead,
  }
}
