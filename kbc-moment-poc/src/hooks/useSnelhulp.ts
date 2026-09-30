import { useMemo, useState } from 'react'
import { categories, searchTrees, type Category, type Tree, type TreeNode } from '../data/trees'

/* Vaste escalatieregels: de beslisboom beslist wanneer de chatbot nodig is, niet de AI. */
export const MAX_NOT_SOLVED = 2
export const MAX_BACKS = 3

export type EscalationReason = 'dead-end' | 'not-solved' | 'back-loops' | 'no-results'

export const reasonLabel: Record<EscalationReason, string> = {
  'dead-end': 'Doodlopende tak in de beslisboom',
  'not-solved': `${MAX_NOT_SOLVED}× “lost het niet op”`,
  'back-loops': `${MAX_BACKS}× terug in dezelfde boom`,
  'no-results': 'Zoekopdracht gaf geen resultaat',
}

/* Alles wat de chatbot meekrijgt: enkel wat de klant in deze sessie aanklikte. */
export type ChatContext = {
  reason: EscalationReason
  category?: string
  question?: string
  answers: { question: string; answer: string }[]
  tried: string[]
  searchQuery?: string
}

export type Stats = {
  selfServed: number
  withChat: number
  chatMessages: number
}

export function useSnelhulp() {
  const [categoryId, setCategoryId] = useState(categories[0].id)
  const [treeId, setTreeId] = useState<string | null>(null)
  const [path, setPath] = useState<string[]>([])
  const [answers, setAnswers] = useState<ChatContext['answers']>([])
  const [tried, setTried] = useState<string[]>([])
  const [notSolved, setNotSolved] = useState(0)
  const [backs, setBacks] = useState(0)
  const [query, setQuery] = useState('')
  const [escalation, setEscalation] = useState<ChatContext | null>(null)
  const [resolved, setResolved] = useState(false)
  /* Blijft true na de eerste escalatie: de chat-bundel is dan opgehaald. */
  const [chatLoaded, setChatLoaded] = useState(false)
  const [stats, setStats] = useState<Stats>({ selfServed: 0, withChat: 0, chatMessages: 0 })

  const category = categories.find((c) => c.id === categoryId) ?? categories[0]
  const tree = useMemo(
    () => categories.flatMap((c) => c.trees).find((t) => t.id === treeId) ?? null,
    [treeId],
  )
  const treeCategory: Category | undefined = tree
    ? categories.find((c) => c.trees.includes(tree))
    : undefined
  const node: TreeNode | null = tree && path.length ? tree.nodes[path[path.length - 1]] : null
  const results = useMemo(() => searchTrees(query), [query])

  function reset() {
    setTreeId(null)
    setPath([])
    setAnswers([])
    setTried([])
    setNotSolved(0)
    setBacks(0)
    setEscalation(null)
    setResolved(false)
  }

  function escalate(reason: EscalationReason, extra: Partial<ChatContext> = {}) {
    setChatLoaded(true)
    setEscalation({
      reason,
      category: treeCategory?.label,
      question: tree?.question,
      answers,
      tried,
      ...extra,
    })
  }

  function selectCategory(id: string) {
    reset()
    setCategoryId(id)
  }

  function openTree(t: Tree) {
    reset()
    setTreeId(t.id)
    setPath([t.start])
    const owner = categories.find((c) => c.trees.includes(t))
    if (owner) setCategoryId(owner.id)
  }

  function goTo(next: string) {
    if (!tree) return
    setPath((p) => [...p, next])
    const target = tree.nodes[next]
    if (target?.kind === 'dead-end') escalate('dead-end')
  }

  function choose(label: string, next: string) {
    if (node?.kind !== 'question') return
    setAnswers((a) => [...a, { question: node.text, answer: label }])
    goTo(next)
  }

  function back() {
    if (path.length <= 1) return
    const b = backs + 1
    setBacks(b)
    setPath((p) => p.slice(0, -1))
    setAnswers((a) => a.slice(0, -1))
    if (b >= MAX_BACKS) escalate('back-loops')
  }

  function markSolved() {
    setResolved(true)
    setStats((s) => ({ ...s, selfServed: s.selfServed + 1 }))
  }

  function markNotSolved() {
    if (node?.kind !== 'solution') return
    const count = notSolved + 1
    const nextTried = [...tried, node.title]
    setNotSolved(count)
    setTried(nextTried)
    if (count >= MAX_NOT_SOLVED) {
      escalate('not-solved', { tried: nextTried })
    } else if (node.alt) {
      setPath((p) => [...p, node.alt!])
    } else {
      escalate('dead-end', { tried: nextTried })
    }
  }

  function escalateFromSearch() {
    escalateFromSearchWithQuery(query.trim())
  }

  function escalateFromSearchWithQuery(searchQuery: string) {
    reset()
    setChatLoaded(true)
    setQuery(searchQuery)
    setEscalation({
      reason: 'no-results',
      answers: [],
      tried: [],
      searchQuery: searchQuery.trim(),
    })
  }

  function chatSolved() {
    setResolved(true)
    setStats((s) => ({ ...s, withChat: s.withChat + 1 }))
  }

  function countChatMessage() {
    setStats((s) => ({ ...s, chatMessages: s.chatMessages + 1 }))
  }

  return {
    categories,
    category,
    tree,
    treeCategory,
    node,
    depth: path.length,
    answers,
    notSolved,
    backs,
    query,
    setQuery,
    results,
    escalation,
    resolved,
    chatLoaded,
    stats,
    selectCategory,
    openTree,
    choose,
    back,
    markSolved,
    markNotSolved,
    escalateFromSearch,
    escalateFromSearchWithQuery,
    chatSolved,
    countChatMessage,
    reset,
  }
}

export type Snelhulp = ReturnType<typeof useSnelhulp>
