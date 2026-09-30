import { useCallback, useMemo, useState } from 'react'
import { scenarios } from '../data/scenarios'
import {
  SESSION_KEY,
  customerActionsByScenario,
  getScenario,
  type CustomerAction,
} from '../data/customerActions'
import { buildInference } from '../engine/momentEngine'
import { sanitizeText } from '../lib/security'

export type AppTab = 'home' | 'betalen' | 'zoeken' | 'hulp' | 'berichten' | 'ik'

const ALLOWED_TABS = new Set<AppTab>([
  'home',
  'betalen',
  'zoeken',
  'hulp',
  'berichten',
  'ik',
])

type Persisted = {
  scenarioId: string
  consent: boolean
  unlockedSignalIds: string[]
  checkedItems: string[]
  onboarded: boolean
  advisorRead: boolean
}

function allowedSignalIds(scenarioId: string): Set<string> {
  const s = getScenario(scenarioId)
  return new Set(s.signals.map((x) => x.id))
}

function allowedChecklist(scenarioId: string): Set<string> {
  const s = getScenario(scenarioId)
  return new Set(s.appAfter.checklist.map((c) => c.label))
}

function sanitizePersisted(parsed: unknown): Persisted | null {
  if (!parsed || typeof parsed !== 'object') return null
  const p = parsed as Record<string, unknown>
  if (typeof p.scenarioId !== 'string') return null
  if (!scenarios.some((s) => s.id === p.scenarioId)) return null

  const signalAllow = allowedSignalIds(p.scenarioId)
  const checkAllow = allowedChecklist(p.scenarioId)

  const unlockedSignalIds = Array.isArray(p.unlockedSignalIds)
    ? p.unlockedSignalIds
        .filter((id): id is string => typeof id === 'string' && signalAllow.has(id))
        .slice(0, signalAllow.size)
    : []

  const checkedItems = Array.isArray(p.checkedItems)
    ? p.checkedItems
        .filter((id): id is string => typeof id === 'string' && checkAllow.has(id))
        .map((id) => sanitizeText(id, 120))
        .slice(0, checkAllow.size)
    : []

  return {
    scenarioId: p.scenarioId,
    consent: Boolean(p.consent),
    unlockedSignalIds,
    checkedItems,
    onboarded: Boolean(p.onboarded),
    advisorRead: Boolean(p.advisorRead),
  }
}

function load(): Persisted | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw || raw.length > 8_000) return null
    return sanitizePersisted(JSON.parse(raw))
  } catch {
    return null
  }
}

function save(state: Persisted) {
  try {
    const clean = sanitizePersisted(state)
    if (!clean) return
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean))
  } catch {
    // ignore quota / private mode
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
  const [tab, setTabState] = useState<AppTab>('home')
  const [toast, setToast] = useState<string | null>(null)

  const persist = useCallback((next: Persisted) => {
    const clean = sanitizePersisted(next) ?? defaultState()
    setState(clean)
    save(clean)
  }, [])

  const setTab = useCallback((next: AppTab) => {
    if (!ALLOWED_TABS.has(next)) return
    setTabState(next)
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
    setToast(sanitizeText(message, 160))
    window.setTimeout(() => setToast(null), 2200)
  }

  function startSession(scenarioId: string, consent: boolean) {
    // Authorization: only known personas
    if (!scenarios.some((s) => s.id === scenarioId)) return
    const next: Persisted = {
      scenarioId,
      consent: Boolean(consent),
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
    // Prevent unlocking arbitrary signal IDs (IDOR-style tampering).
    const allowed = actions.some(
      (a) =>
        a.id === action.id && a.unlocksSignalId === action.unlocksSignalId,
    )
    if (!allowed) {
      showToast('Actie niet toegestaan')
      return
    }
    if (!allowedSignalIds(state.scenarioId).has(action.unlocksSignalId)) {
      showToast('Actie niet toegestaan')
      return
    }
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
    if (!allowedChecklist(state.scenarioId).has(label)) return
    const exists = state.checkedItems.includes(label)
    persist({
      ...state,
      checkedItems: exists
        ? state.checkedItems.filter((x) => x !== label)
        : [...state.checkedItems, label],
    })
  }

  function markAdvisorRead() {
    // Only meaningful when moment is active (authz on feature)
    if (!momentActive) return
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
