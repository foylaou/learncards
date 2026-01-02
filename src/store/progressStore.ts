import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DeckProgress {
  deckId: number
  currentIndex: number
  lastStudied: Date
}

interface ProgressState {
  progress: Record<number, DeckProgress>
  setProgress: (deckId: number, currentIndex: number) => void
  getProgress: (deckId: number) => number
  resetProgress: (deckId: number) => void
  getAllProgress: () => DeckProgress[]
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      setProgress: (deckId, currentIndex) => {
        set((state) => ({
          progress: {
            ...state.progress,
            [deckId]: {
              deckId,
              currentIndex,
              lastStudied: new Date(),
            },
          },
        }))
      },

      getProgress: (deckId) => {
        const progress = get().progress[deckId]
        return progress?.currentIndex ?? 0
      },

      resetProgress: (deckId) => {
        set((state) => {
          const newProgress = { ...state.progress }
          delete newProgress[deckId]
          return { progress: newProgress }
        })
      },

      getAllProgress: () => {
        return Object.values(get().progress)
      },
    }),
    {
      name: 'flashcard-progress',
    }
  )
)
