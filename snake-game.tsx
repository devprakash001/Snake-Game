'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

// Define types
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = [number, number]
type Difficulty = 'Easy' | 'Normal' | 'Hard'

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SNAKE: Position[] = [[5, 5]]
const INITIAL_DIRECTION: Direction = 'RIGHT'

const GAME_SPEEDS: Record<Difficulty, number> = {
  Easy: 200,
  Normal: 150,
  Hard: 100
}

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [food, setFood] = useState<Position>([0, 0])
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [cellSize, setCellSize] = useState(CELL_SIZE)
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal')
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)

  function getRandomPosition(): Position {
    return [
      Math.floor(Math.random() * GRID_SIZE),
      Math.floor(Math.random() * GRID_SIZE)
    ]
  }

  const handleResize = useCallback(() => {
    if (gameAreaRef.current) {
      const { width, height } = gameAreaRef.current.getBoundingClientRect()
      const newSize = Math.floor(Math.min(width, height) / GRID_SIZE)
      setCellSize(newSize)
    }
    setIsMobile(window.innerWidth < 768)
  }, [])

  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying) return

    const newSnake = [...snake]
    const [headX, headY] = newSnake[0]

    let newHead: Position
    switch (direction) {
      case 'UP':
        newHead = [headX, (headY - 1 + GRID_SIZE) % GRID_SIZE]
        break
      case 'DOWN':
        newHead = [headX, (headY + 1) % GRID_SIZE]
        break
      case 'LEFT':
        newHead = [(headX - 1 + GRID_SIZE) % GRID_SIZE, headY]
        break
      case 'RIGHT':
        newHead = [(headX + 1) % GRID_SIZE, headY]
        break
    }

    // Check for collision with self
    if (newSnake.some((segment, index) => index !== 0 && segment[0] === newHead[0] && segment[1] === newHead[1])) {
      setGameOver(true)
      setIsPlaying(false)
      return
    }

    newSnake.unshift(newHead)

    // Check if snake ate food
    if (newHead[0] === food[0] && newHead[1] === food[1]) {
      setFood(getRandomPosition())
      setScore(prevScore => prevScore + 1)
    } else {
      newSnake.pop()
    }

    setSnake(newSnake)
  }, [snake, direction, food, gameOver, isPlaying])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return
      switch (e.key) {
        case 'ArrowUp':
          setDirection(prev => prev !== 'DOWN' ? 'UP' : prev)
          break
        case 'ArrowDown':
          setDirection(prev => prev !== 'UP' ? 'DOWN' : prev)
          break
        case 'ArrowLeft':
          setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev)
          break
        case 'ArrowRight':
          setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('resize', handleResize)
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }
    }
  }, [moveSnake, handleResize, isPlaying])

  useEffect(() => {
    if (isPlaying) {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }
      gameIntervalRef.current = setInterval(moveSnake, GAME_SPEEDS[difficulty])
    }
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }
    }
  }, [isPlaying, difficulty, moveSnake])

  useEffect(() => {
    setFood(getRandomPosition())
  }, [])

  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setFood(getRandomPosition())
    setGameOver(false)
    setScore(0)
    setIsPlaying(true)
  }

  const handleTouchStart = (newDirection: Direction) => {
    if (!isPlaying) return
    // Prevent 180-degree turns
    if (
      (direction === 'UP' && newDirection === 'DOWN') ||
      (direction === 'DOWN' && newDirection === 'UP') ||
      (direction === 'LEFT' && newDirection === 'RIGHT') ||
      (direction === 'RIGHT' && newDirection === 'LEFT')
    ) {
      return;
    }
    setDirection(newDirection)
  }

  const startGame = () => {
    resetGame()
    setIsPlaying(true)
  }

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value as Difficulty)
    if (isPlaying) {
      resetGame()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 p-4">
      <motion.h1 
        className="text-4xl md:text-5xl font-bold mb-4 md:mb-8 text-white text-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Snake Game
      </motion.h1>
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <motion.div 
          className="text-xl md:text-2xl font-semibold text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Score: {score}
        </motion.div>
        <Select onValueChange={handleDifficultyChange} value={difficulty}>
          <SelectTrigger className="w-[180px] bg-white bg-opacity-20 text-white border-white border-opacity-20">
            <SelectValue placeholder="Select Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <motion.div 
        ref={gameAreaRef}
        className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg border-2 border-white border-opacity-20 rounded-lg overflow-hidden"
        style={{
          width: GRID_SIZE * cellSize,
          height: GRID_SIZE * cellSize,
          position: 'relative'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnimatePresence>
          {snake.map((segment, index) => (
            <motion.div
              key={`${segment[0]}-${segment[1]}`}
              className="bg-green-400"
              style={{
                position: 'absolute',
                width: cellSize,
                height: cellSize,
                left: segment[0] * cellSize,
                top: segment[1] * cellSize,
                borderRadius: index === 0 ? '50%' : '20%'
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </AnimatePresence>
        <motion.div
          className="bg-red-500"
          style={{
            position: 'absolute',
            width: cellSize,
            height: cellSize,
            left: food[0] * cellSize,
            top: food[1] * cellSize,
            borderRadius: '50%'
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
      {isMobile && isPlaying && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div></div>
          <Button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
            onClick={() => handleTouchStart('UP')}
          >
            <ArrowUp className="w-6 h-6 text-white" />
          </Button>
          <div></div>
          <Button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
            onClick={() => handleTouchStart('LEFT')}
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <div></div>
          <Button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
            onClick={() => handleTouchStart('RIGHT')}
          >
            <ArrowRight className="w-6 h-6 text-white" />
          </Button>
          <div></div>
          <Button
            className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
            onClick={() => handleTouchStart('DOWN')}
          >
            <ArrowDown className="w-6 h-6 text-white" />
          </Button>
          <div></div>
        </div>
      )}
      <AnimatePresence>
        {(gameOver || !isPlaying) && (
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {gameOver ? (
              <>
                <p className="text-2xl md:text-3xl font-bold mb-4 text-white">Game Over!</p>
                <Button 
                  onClick={resetGame}
                  className="bg-white text-purple-600 hover:bg-purple-100 transition-colors duration-200"
                >
                  Play Again
                </Button>
              </>
            ) : (
              <Button 
                onClick={startGame}
                className="bg-white text-purple-600 hover:bg-purple-100 transition-colors duration-200"
              >
                Start Game
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

