import { useState, useEffect } from 'react'
import './App.css'
import FlashcardStack from './components/FlashcardStack'
import DeckManager from './components/DeckManager'
import CSVUploader from './components/CSVUploader'
import { db } from './utils/db'
import type { CardDeck, Flashcard } from './types/flashcard'
import { useProgressStore } from './store/progressStore'

type Page = 'home' | 'study' | 'manage'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null)
  const [selectedDeck, setSelectedDeck] = useState<CardDeck | null>(null)
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([])
  const [isShuffled, setIsShuffled] = useState(false)
  const [recentDeck, setRecentDeck] = useState<CardDeck | null>(null)
  const [allDecks, setAllDecks] = useState<CardDeck[]>([])
  const [selectedDeckIds, setSelectedDeckIds] = useState<number[]>([])

  const { getAllProgress, getProgress } = useProgressStore()

  useEffect(() => {
    // 初始化數據庫
   void db.init()
  }, [])

  // 加載所有卡組和最近學習的卡組
  useEffect(() => {
    const loadDecks = async () => {
      const decks = await db.getAllDecks()
      setAllDecks(decks)

      const allProgress = getAllProgress()
      if (allProgress.length === 0) {
        setRecentDeck(null)
        return
      }

      // 找到最近學習的卡組
      const mostRecent = allProgress.sort((a, b) =>
        new Date(b.lastStudied).getTime() - new Date(a.lastStudied).getTime()
      )[0]

      if (mostRecent) {
        const deck = decks.find(d => d.id === mostRecent.deckId)
        if (deck) {
          setRecentDeck(deck)
        }
      }
    }

    if (currentPage === 'home') {
      loadDecks()
    }
  }, [getAllProgress, currentPage])

  const shuffleArray = (array: Flashcard[]): Flashcard[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  useEffect(() => {
    // 當選擇卡組時，加載卡組數據
    if (selectedDeckId) {
      db.getDeck(selectedDeckId).then((deck) => {
        if (deck) {
          setSelectedDeck(deck)
          if (isShuffled) {
            setShuffledCards(shuffleArray(deck.cards))
          } else {
            setShuffledCards(deck.cards)
          }
        }
      })
    }
  }, [selectedDeckId, isShuffled])

  const handleUploadSuccess = () => {
    alert('上傳成功！')
    // 刷新頁面以顯示新的卡組
    window.location.reload()
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
    setSelectedDeck(null)
    setSelectedDeckId(null)
    setIsShuffled(false)
  }

  const handleStartStudy = () => {
    setCurrentPage('study')
  }

  const handleCustomStudy = async () => {
    if (selectedDeckIds.length === 0) return

    // 合并选中的卡组
    const selectedDecks = allDecks.filter(d => selectedDeckIds.includes(d.id!))
    const allCards = selectedDecks.flatMap(d => d.cards)

    // 创建一个临时的合并卡组
    const mergedDeck: CardDeck = {
      id: -1, // 临时ID
      name: selectedDecks.map(d => d.name).join(' + '),
      cards: isShuffled ? shuffleArray(allCards) : allCards,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setSelectedDeck(mergedDeck)
    setShuffledCards(mergedDeck.cards)
    setCurrentPage('study')
  }

  const toggleDeckSelection = (deckId: number) => {
    setSelectedDeckIds(prev =>
      prev.includes(deckId)
        ? prev.filter(id => id !== deckId)
        : [...prev, deckId]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 導航欄 */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-purple-600">學習卡</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentPage('home')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentPage === 'home'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                首頁
              </button>
              <button
                onClick={() => setCurrentPage('manage')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentPage === 'manage'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                管理
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容區 */}
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'home' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                學習卡
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                開始你的學習之旅
              </p>
            </div>

            {/* 继续学习 */}
            {recentDeck && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    繼續學習
                  </h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    最近學習
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    {recentDeck.name}
                  </h4>
                  <div className="text-gray-600 text-sm">
                    <p className="mb-2">共 {recentDeck.cards.length} 張卡片</p>
                    {recentDeck.id && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${((getProgress(recentDeck.id) + 1) / recentDeck.cards.length * 100).toFixed(0)}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {getProgress(recentDeck.id) + 1} / {recentDeck.cards.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDeckId(recentDeck.id!)
                    setCurrentPage('study')
                  }}
                  className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-md font-medium"
                >
                  繼續學習
                </button>
              </div>
            )}

            {/* 自定义学习 */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                自訂學習
              </h3>

              {allDecks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  還沒有卡組，請先上傳CSV文件
                </p>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-80 overflow-y-auto pr-2">
                    {allDecks.map(deck => (
                      <label
                        key={deck.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedDeckIds.includes(deck.id!)
                            ? 'bg-purple-50 border-2 border-purple-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDeckIds.includes(deck.id!)}
                          onChange={() => toggleDeckSelection(deck.id!)}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {deck.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {deck.cards.length} 張卡片
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedDeckIds.length > 0 && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-700 mb-2">
                        已選擇 {selectedDeckIds.length} 個卡組，共{' '}
                        {allDecks
                          .filter(d => selectedDeckIds.includes(d.id!))
                          .reduce((sum, d) => sum + d.cards.length, 0)}{' '}
                        張卡片
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="shuffle-custom"
                          checked={isShuffled}
                          onChange={(e) => setIsShuffled(e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="shuffle-custom" className="text-sm text-gray-700 cursor-pointer">
                          隨機題目順序
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCustomStudy}
                    disabled={selectedDeckIds.length === 0}
                    className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    開始學習
                  </button>
                </>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentPage('manage')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                管理所有卡組
              </button>
            </div>
          </div>
        )}

        {currentPage === 'manage' && !selectedDeck && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <CSVUploader onUploadSuccess={handleUploadSuccess} />
            </div>
            <DeckManager
              onSelectDeck={(deckId) => {
                setSelectedDeckId(deckId)
                setCurrentPage('manage')
              }}
              onRefresh={() => {}}
            />
          </div>
        )}

        {currentPage === 'manage' && selectedDeck && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {selectedDeck.name}
              </h2>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  共有 {selectedDeck.cards.length} 張學習卡
                </p>

                <div className="flex items-center gap-3 mb-6">
                  <input
                    type="checkbox"
                    id="shuffle"
                    checked={isShuffled}
                    onChange={(e) => setIsShuffled(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="shuffle" className="text-gray-700 cursor-pointer">
                    隨機題目順序
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleStartStudy}
                  className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors font-medium"
                >
                  開始學習
                </button>
                <button
                  onClick={() => {
                    setSelectedDeck(null)
                    setSelectedDeckId(null)
                    setIsShuffled(false)
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'study' && selectedDeck && (
          <div className="flex flex-col items-center">
            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                ← 返回
              </button>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedDeck.name}
              </h2>
              {isShuffled && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  隨機模式
                </span>
              )}
            </div>
            <FlashcardStack
              cards={shuffledCards}
              deckId={selectedDeckId!}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
