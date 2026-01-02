import { useState, useEffect } from 'react'
import { db } from '../utils/db'
import type { CardDeck } from '../types/flashcard'
import { useProgressStore } from '../store/progressStore'

interface DeckManagerProps {
  onSelectDeck?: (deckId: number) => void
  onRefresh?: () => void
}

export default function DeckManager({ onSelectDeck, onRefresh }: DeckManagerProps) {
  const [decks, setDecks] = useState<CardDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null)
  const { getProgress, resetProgress } = useProgressStore()

  const loadDecks = async () => {
    setLoading(true)
    try {
      const allDecks = await db.getAllDecks()
      setDecks(allDecks)
    } catch (error) {
      console.error('加載卡組失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDecks()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除這個卡組嗎？')) return

    try {
      await db.deleteDeck(id)
      resetProgress(id) // 同時刪除進度記錄
      await loadDecks()
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error('刪除卡組失敗:', error)
      alert('刪除失敗')
    }
  }

  const handleResetProgress = (deckId: number) => {
    if (!confirm('確定要重置學習進度嗎？')) return
    resetProgress(deckId)
    loadDecks()
  }

  const handleSelect = (deckId: number) => {
    setSelectedDeckId(deckId)
    if (onSelectDeck) {
      onSelectDeck(deckId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">加載中...</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">學習卡管理</h2>

      {decks.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          還沒有卡組，請先上傳CSV文件創建卡組
        </div>
      ) : (
        <div className="grid gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${
                selectedDeckId === deck.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{deck.name}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>卡片數量: {deck.cards.length}</p>
                    <p>創建時間: {new Date(deck.createdAt).toLocaleString('zh-CN')}</p>
                    {deck.id && getProgress(deck.id) > 0 && (
                      <p className="text-blue-600 font-medium">
                        學習進度: {getProgress(deck.id) + 1} / {deck.cards.length}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelect(deck.id!)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      學習
                    </button>
                    <button
                      onClick={() => handleDelete(deck.id!)}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      刪除
                    </button>
                  </div>
                  {deck.id && getProgress(deck.id) > 0 && (
                    <button
                      onClick={() => handleResetProgress(deck.id!)}
                      className="px-4 py-2 bg-gray-400 text-white text-sm rounded-md hover:bg-gray-500 transition-colors"
                    >
                      重置進度
                    </button>
                  )}
                </div>
              </div>

              {/* 顯示前几張卡片預覽 */}
              {deck.cards.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">預覽:</p>
                  <div className="space-y-2">
                    {deck.cards.slice(0, 3).map((card, idx) => (
                      <div key={idx} className="text-sm text-gray-600">
                        <span className="font-medium">Q:</span> {card.question.substring(0, 50)}
                        {card.question.length > 50 ? '...' : ''}
                      </div>
                    ))}
                    {deck.cards.length > 3 && (
                      <div className="text-sm text-gray-500">
                        還有 {deck.cards.length - 3} 張卡片...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadDecks}
        className="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
      >
        刷新列表
      </button>
    </div>
  )
}
