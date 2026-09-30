import type { Scenario } from './scenarios'
import { scenarios } from './scenarios'

export type CustomerAction = {
  id: string
  tab: 'home' | 'betalen' | 'zoeken'
  label: string
  detail: string
  unlocksSignalId: string
}

/** Customer-facing actions that unlock the same signals as the explain demo. */
export const customerActionsByScenario: Record<string, CustomerAction[]> = {
  verhuizen: [
    {
      id: 'a1',
      tab: 'betalen',
      label: 'Betaal notariskosten',
      detail: '€1.850 aan Notariskantoor Peeters',
      unlocksSignalId: 's1',
    },
    {
      id: 'a2',
      tab: 'zoeken',
      label: 'Zoek “woonlening simulatie”',
      detail: 'Hypotheek berekenen',
      unlocksSignalId: 's2',
    },
    {
      id: 'a3',
      tab: 'zoeken',
      label: 'Check brandverzekering',
      detail: 'Nog geen polis gevonden',
      unlocksSignalId: 's3',
    },
    {
      id: 'a4',
      tab: 'betalen',
      label: 'Stort voorschot van spaargeld',
      detail: '−€12.400 van spaarrekening',
      unlocksSignalId: 's4',
    },
    {
      id: 'a5',
      tab: 'home',
      label: 'Wijzig mijn adres',
      detail: 'Adreswijziging doorgeven',
      unlocksSignalId: 's5',
    },
  ],
  'eerste-job': [
    {
      id: 'a1',
      tab: 'home',
      label: 'Bekijk nieuwe storting',
      detail: 'Salaris +€2.340 ontvangen',
      unlocksSignalId: 's1',
    },
    {
      id: 'a2',
      tab: 'zoeken',
      label: 'Open budget-overzicht',
      detail: 'Waar gaat mijn loon naartoe?',
      unlocksSignalId: 's2',
    },
    {
      id: 'a3',
      tab: 'zoeken',
      label: 'Check studentenkrediet',
      detail: 'Eindigt over 45 dagen',
      unlocksSignalId: 's3',
    },
    {
      id: 'a4',
      tab: 'home',
      label: 'Spaardoelen bekijken',
      detail: 'Nog geen doel ingesteld',
      unlocksSignalId: 's4',
    },
    {
      id: 'a5',
      tab: 'zoeken',
      label: 'Starter-tips zoeken',
      detail: 'Eerste job · wat nu?',
      unlocksSignalId: 's5',
    },
  ],
  zorgmoment: [
    {
      id: 'a1',
      tab: 'betalen',
      label: 'Betaal terugkerende zorgkost',
      detail: '€620 · maandelijkse zorgfactuur',
      unlocksSignalId: 's1',
    },
    {
      id: 'a2',
      tab: 'zoeken',
      label: 'Zoek “uitstel afbetaling”',
      detail: 'Ademruimte nodig',
      unlocksSignalId: 's2',
    },
    {
      id: 'a3',
      tab: 'home',
      label: 'Bekijk spaarbuffer',
      detail: '−38% in 4 maanden',
      unlocksSignalId: 's3',
    },
    {
      id: 'a4',
      tab: 'zoeken',
      label: 'Check hospitalisatie gezin',
      detail: 'Ouder via gezin gedekt',
      unlocksSignalId: 's4',
    },
    {
      id: 'a5',
      tab: 'home',
      label: 'Negeer productaanbiedingen',
      detail: 'Geen interesse in upsell',
      unlocksSignalId: 's5',
    },
  ],
}

export function getScenario(id: string): Scenario {
  return scenarios.find((s) => s.id === id) ?? scenarios[0]
}

export const SESSION_KEY = 'kbc-moment-customer-v1'
