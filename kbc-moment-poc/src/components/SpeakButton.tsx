import { useEffect, useState } from 'react'

type Props = {
  text: string
  enabled: boolean
}

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  function speak(text: string) {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'nl-BE'
    utter.rate = 1
    utter.onstart = () => setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utter)
  }

  function stop() {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  return { supported, speaking, speak, stop }
}

export function SpeakButton({ text, enabled }: Props) {
  const { supported, speaking, speak, stop } = useSpeech()

  if (!supported) {
    return (
      <p className="muted small">
        Speech niet beschikbaar in deze browser — briefing staat hierboven.
      </p>
    )
  }

  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={!enabled}
      onClick={() => (speaking ? stop() : speak(text))}
    >
      {speaking ? 'Stop briefing' : 'Speel adviseursbriefing'}
    </button>
  )
}
