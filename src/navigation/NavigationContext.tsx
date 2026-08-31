import { createContext, useContext, useState, ReactNode } from 'react'

export type Screen =
  | { name: 'welcome' }
  | { name: 'setup' }
  | { name: 'home' }
  | { name: 'timeline' }
  | { name: 'task'; taskId: string }
  | { name: 'calendar' }
  | { name: 'profile' }
  | { name: 'todos' }
  | { name: 'ask' }
  | { name: 'documents' }

type NavigationContextType = {
  screen: Screen
  history: Screen[]
  navigate: (screen: Screen) => void
  replace: (screen: Screen) => void
  goBack: () => void
  goBackTo: (index: number) => void
}

const NavigationContext = createContext<NavigationContextType | null>(null)

function getInitialScreen(): Screen {
  try {
    const saved = localStorage.getItem('onboarding')
    if (saved) return { name: 'home' }
  } catch {}
  return { name: 'welcome' }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Screen[]>([getInitialScreen()])
  const screen = history[history.length - 1]

  function navigate(next: Screen) {
    setHistory((h) => [...h, next])
  }

  function replace(next: Screen) {
    setHistory((h) => [...h.slice(0, -1), next])
  }

  function goBack() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
  }

  function goBackTo(index: number) {
    setHistory((h) => h.slice(0, index + 1))
  }

  return (
    <NavigationContext.Provider value={{ screen, history, navigate, replace, goBack, goBackTo }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used inside NavigationProvider')
  return ctx
}
