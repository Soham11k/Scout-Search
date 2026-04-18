'use client'

import * as React from 'react'

export const PALETTES = [
  { id: 'paper', label: 'Paper', swatch: '#a78b5f' },
  { id: 'sepia', label: 'Sepia', swatch: '#b47a43' },
  { id: 'mono', label: 'Mono', swatch: '#3a3a3a' },
  { id: 'ocean', label: 'Ocean', swatch: '#3b82f6' },
  { id: 'rose', label: 'Rose', swatch: '#e11d74' },
  { id: 'forest', label: 'Forest', swatch: '#2f8f5f' },
] as const

export type PaletteId = (typeof PALETTES)[number]['id']

const STORAGE_KEY = 'scout:palette'
const DEFAULT_PALETTE: PaletteId = 'paper'

type Ctx = {
  palette: PaletteId
  setPalette: (p: PaletteId) => void
}

const PaletteContext = React.createContext<Ctx | null>(null)

function applyPalette(p: PaletteId) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-palette', p)
}

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = React.useState<PaletteId>(DEFAULT_PALETTE)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as PaletteId | null
      if (saved && PALETTES.some((p) => p.id === saved)) {
        setPaletteState(saved)
        applyPalette(saved)
      } else {
        applyPalette(DEFAULT_PALETTE)
      }
    } catch {
      applyPalette(DEFAULT_PALETTE)
    }
  }, [])

  const setPalette = React.useCallback((p: PaletteId) => {
    setPaletteState(p)
    applyPalette(p)
    try {
      localStorage.setItem(STORAGE_KEY, p)
    } catch {
      // ignore
    }
  }, [])

  const value = React.useMemo(() => ({ palette, setPalette }), [palette, setPalette])

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  )
}

export function usePalette(): Ctx {
  const ctx = React.useContext(PaletteContext)
  if (!ctx) {
    return { palette: DEFAULT_PALETTE, setPalette: () => {} }
  }
  return ctx
}
