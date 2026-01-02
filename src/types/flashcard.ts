export interface Flashcard {
  id?: number
  question: string
  answer: string
}

export interface CardDeck {
  id?: number
  name: string
  cards: Flashcard[]
  createdAt: Date
  updatedAt: Date
}
