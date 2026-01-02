import type { CardDeck } from '../types/flashcard'

const DB_NAME = 'LearnCardsDB'
const DB_VERSION = 1
const DECK_STORE = 'decks'

class IndexedDBHelper {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(DECK_STORE)) {
          const deckStore = db.createObjectStore(DECK_STORE, {
            keyPath: 'id',
            autoIncrement: true
          })
          deckStore.createIndex('name', 'name', { unique: false })
          deckStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  async addDeck(deck: Omit<CardDeck, 'id'>): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DECK_STORE], 'readwrite')
      const store = transaction.objectStore(DECK_STORE)
      const request = store.add(deck)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllDecks(): Promise<CardDeck[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DECK_STORE], 'readonly')
      const store = transaction.objectStore(DECK_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getDeck(id: number): Promise<CardDeck | undefined> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DECK_STORE], 'readonly')
      const store = transaction.objectStore(DECK_STORE)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateDeck(deck: CardDeck): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DECK_STORE], 'readwrite')
      const store = transaction.objectStore(DECK_STORE)
      const request = store.put(deck)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async deleteDeck(id: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DECK_STORE], 'readwrite')
      const store = transaction.objectStore(DECK_STORE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const db = new IndexedDBHelper()
