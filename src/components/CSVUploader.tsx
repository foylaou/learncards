import { useState } from 'react'
import { parseCSV } from '../utils/csvParser'
import { db } from '../utils/db'

interface CSVUploaderProps {
  onUploadSuccess?: (deckId: number) => void
}

export default function CSVUploader({ onUploadSuccess }: CSVUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deckName, setDeckName] = useState('')
  const [success, setSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setSuccess(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('請選擇CSV文件')
      return
    }

    if (!deckName.trim()) {
      setError('請輸入卡組名稱')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      // 確保數據庫已初始化
      await db.init()

      const cards = await parseCSV(selectedFile)

      if (cards.length === 0) {
        throw new Error('CSV文件中沒有找到有效的學習卡')
      }

      const deckId = await db.addDeck({
        name: deckName,
        cards,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      setDeckName('')
      setSelectedFile(null)
      setSuccess(true)

      // 延遲調用成功回調，讓用戶看到成功消息
      setTimeout(() => {
        if (onUploadSuccess) {
          onUploadSuccess(deckId)
        }
      }, 1000)
    } catch (err) {
      console.error('上傳錯誤:', err)
      setError(err instanceof Error ? err.message : '上傳失敗')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">上傳學習卡</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          卡組名稱
        </label>
        <input
          type="text"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="輸入卡組名稱"
          disabled={uploading}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          選擇CSV文件
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          disabled={uploading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {selectedFile && (
          <p className="text-sm text-gray-600 mt-2">
            已選擇: {selectedFile.name}
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || !selectedFile || !deckName.trim()}
        className="w-full px-6 py-3 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
      >
        {uploading ? '上傳中...' : '上傳'}
      </button>

      {success && (
        <div className="text-green-600 text-sm mt-2 font-medium">
          ✓ 上傳成功！
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm mt-2">
          {error}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-2">CSV格式說明：</p>
        <ul className="list-disc list-inside space-y-1">
          <li>第1列：題目</li>
          <li>第2列：答案</li>
          <li>支持使用引號包含逗號</li>
        </ul>
      </div>
    </div>
  )
}
