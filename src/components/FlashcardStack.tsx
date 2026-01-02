import {
    animate,
    easeIn,
    mix,
    motion,
    progress,
    useMotionValue,
    useTransform,
    wrap,
} from "motion/react"

import { useEffect, useRef, useState } from "react"
import type { Flashcard } from "../types/flashcard"
import { useProgressStore } from "../store/progressStore"

interface FlashcardStackProps {
    cards?: Flashcard[]
    maxRotate?: number
    deckId?: number
}

export default function FlashcardStack({
    cards = [],
    maxRotate = 5,
    deckId,
}: FlashcardStackProps) {
    const { getProgress, setProgress } = useProgressStore()
    const [currentIndex, setCurrentIndex] = useState(() => {
        // 從store獲取上次的進度
        return deckId ? getProgress(deckId) : 0
    })
    const ref = useRef<HTMLUListElement>(null)
    const [width, setWidth] = useState(400)

    useEffect(() => {
        if (!ref.current) return
        setWidth(ref.current.offsetWidth)
    }, [])

    // 當deckId變化時，加載對應的進度
    useEffect(() => {
        if (deckId) {
            const savedProgress = getProgress(deckId)
            setCurrentIndex(savedProgress)
        }
    }, [deckId, getProgress])

    // 當currentIndex變化時，保存進度
    useEffect(() => {
        if (deckId !== undefined) {
            setProgress(deckId, currentIndex)
        }
    }, [currentIndex, deckId, setProgress])

    if (cards.length === 0) {
        return (
            <div className="text-center text-gray-500 p-8">
                沒有學習卡，請先上傳CSV文件
            </div>
        )
    }

    return (
        <>
            <ul className="stack" ref={ref}>
                {cards.map((card, index) => {
                    return (
                        <StackCard
                            {...card}
                            minDistance={width * 0.5}
                            maxRotate={maxRotate}
                            key={index}
                            index={index}
                            currentIndex={currentIndex}
                            totalCards={cards.length}
                            setNextCard={() => {
                                setCurrentIndex(
                                    wrap(0, cards.length, currentIndex + 1)
                                )
                            }}
                        />
                    )
                })}
            </ul>

            <Instructions />
            <Stylesheet />
        </>
    )
}

interface StackCardProps {
    question: string
    answer: string
    index: number
    totalCards: number
    currentIndex: number
    maxRotate: number
    minDistance?: number
    minSpeed?: number
    setNextCard: () => void
}

function StackCard({
    question,
    answer,
    index,
    currentIndex,
    totalCards,
    maxRotate,
    setNextCard,
    minDistance = 400,
    minSpeed = 50,
}: StackCardProps) {
    const [isFlipped, setIsFlipped] = useState(false)

    const baseRotation = mix(0, maxRotate, Math.sin(index))
    const x = useMotionValue(0)
    const rotate = useTransform(
        x,
        [0, 400],
        [baseRotation, baseRotation + 10],
        { clamp: false }
    )
    // 创建反向旋转来保持文字水平
    const counterRotate = useTransform(
        rotate,
        (r) => -r
    )
    const zIndex = totalCards - wrap(totalCards, 0, index - currentIndex + 1)

    const onDragEnd = () => {
        const distance = Math.abs(x.get())
        const speed = Math.abs(x.getVelocity())

        if (distance > minDistance || speed > minSpeed) {
            setNextCard()
            setIsFlipped(false)

            animate(x, 0, {
                type: "spring",
                stiffness: 600,
                damping: 50,
            })
        } else {
            animate(x, 0, {
                type: "spring",
                stiffness: 300,
                damping: 50,
            })
        }
    }

    const opacity = progress(totalCards * 0.25, totalCards * 0.75, zIndex)
    const progressInStack = progress(0, totalCards - 1, zIndex)
    const scale = mix(0.5, 1, easeIn(progressInStack))

    // 重置翻轉狀態當卡片不再是當前卡片時
    useEffect(() => {
        if (index !== currentIndex) {
            setIsFlipped(false)
        }
    }, [currentIndex, index])

    return (
        <motion.li
            className="item"
            style={{
                zIndex,
                rotate,
                x,
                top: "50%",
                left: "50%",
                translateX: "-50%",
                translateY: "-50%"
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity,
                scale
            }}
            whileTap={index === currentIndex ? { scale: 0.97 } : {}}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8
            }}
            drag={index === currentIndex ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={onDragEnd}
            onClick={() => {
                if (index === currentIndex) {
                    setIsFlipped(!isFlipped)
                }
            }}
        >
            <motion.div
                className="card-inner"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                }}
                style={{
                    transformStyle: "preserve-3d"
                }}
            >
                <div className="card-face card-front">
                    <motion.div className="card-content" style={{ rotate: counterRotate }}>
                        <div className="card-label">題目</div>
                        <p className="card-text">{question}</p>
                    </motion.div>
                </div>
                <div className="card-face card-back">
                    <motion.div className="card-content" style={{ rotate: counterRotate }}>
                        <div className="card-label">答案</div>
                        <p className="card-text">{answer}</p>
                    </motion.div>
                </div>
            </motion.div>
        </motion.li>
    )
}

function Instructions() {
    return (
        <div className="instructions">
            輕點卡片查看答案 · 左右滑動切換
        </div>
    )
}

function Stylesheet() {
    return (
        <style>
            {`
          .stack {
            position: relative;
            width: min(420px, 90vw);
            height: min(600px, 75vh);
            list-style: none;
            margin: 0 auto;
            padding: 0;
          }

          @media (max-width: 640px) {
            .stack {
              width: 90vw;
              height: 70vh;
              max-height: 550px;
            }
          }

          .item {
            width: 100%;
            height: 100%;
            border-radius: 24px;
            overflow: visible;
            position: absolute;
            cursor: pointer;
            perspective: 1200px;
            touch-action: pan-y;
          }

          .card-inner {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
          }

          .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px;
            box-shadow:
              0 10px 40px rgba(0, 0, 0, 0.15),
              0 2px 8px rgba(0, 0, 0, 0.1);
            transition: box-shadow 0.3s ease;
          }

          .card-face:active {
            box-shadow:
              0 5px 20px rgba(0, 0, 0, 0.2),
              0 1px 4px rgba(0, 0, 0, 0.15);
          }

          .card-front {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .card-back {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            transform: rotateY(180deg);
          }

          .card-content {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
          }

          .card-label {
            font-size: 12px;
            font-weight: 700;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: rgba(255, 255, 255, 0.95);
            padding: 6px 16px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            backdrop-filter: blur(10px);
          }

          .card-text {
            font-size: clamp(18px, 4vw, 26px);
            font-weight: 500;
            text-align: center;
            line-height: 1.6;
            color: white;
            max-height: calc(100% - 60px);
            overflow-y: auto;
            user-select: none;
            -webkit-user-select: none;
            padding: 0 8px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
          }

          .card-text::-webkit-scrollbar {
            width: 6px;
          }

          .card-text::-webkit-scrollbar-track {
            background: transparent;
          }

          .card-text::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }

          @media (max-width: 640px) {
            .card-face {
              padding: 24px;
            }

            .card-label {
              font-size: 11px;
              letter-spacing: 1.5px;
              padding: 5px 12px;
            }

            .card-text {
              font-size: clamp(16px, 5vw, 20px);
              line-height: 1.5;
            }
          }

          .instructions {
            font-size: 14px;
            color: #6b7280;
            text-align: center;
            line-height: 1.6;
            padding: 24px 16px;
            max-width: 500px;
            margin: 0 auto;
          }
            `}
        </style>
    )
}
