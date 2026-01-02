import type { Flashcard } from '../types/flashcard'

export async function parseCSV(file: File): Promise<Flashcard[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const cards = parseCSVText(text)
        resolve(cards)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function parseCSVText(text: string): Flashcard[] {
  const lines = text.split('\n').filter(line => line.trim())
  const cards: Flashcard[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // 解析CSV行，处理可能包含逗号的引号字段
    const fields = parseCSVLine(line)

    if (fields.length >= 2) {
      cards.push({
        question: fields[0].trim(),
        answer: fields[1].trim()
      })
    }
  }

  return cards
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 双引号转义
        current += '"'
        i++
      } else {
        // 切换引号状态
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // 字段分隔符
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // 添加最后一个字段
  fields.push(current)

  // 移除字段两端的引号
  return fields.map(field => {
    field = field.trim()
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1)
    }
    return field
  })
}
