"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RotateCcw } from "lucide-react"

type Grid = number[][]

const GRID_SIZE = 4

function createEmptyGrid(): Grid {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0))
}

function addRandomTile(grid: Grid): Grid {
  const newGrid = grid.map((row) => [...row])
  const emptyCells: [number, number][] = []

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (newGrid[i][j] === 0) {
        emptyCells.push([i, j])
      }
    }
  }

  if (emptyCells.length > 0) {
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    newGrid[row][col] = Math.random() < 0.9 ? 2 : 4
  }

  return newGrid
}

function initializeGrid(): Grid {
  let grid = createEmptyGrid()
  grid = addRandomTile(grid)
  grid = addRandomTile(grid)
  return grid
}

function slideRow(row: number[]): { newRow: number[]; score: number } {
  let score = 0
  const filtered = row.filter((val) => val !== 0)
  const newRow: number[] = []

  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2
      newRow.push(merged)
      score += merged
      i++
    } else {
      newRow.push(filtered[i])
    }
  }

  while (newRow.length < GRID_SIZE) {
    newRow.push(0)
  }

  return { newRow, score }
}

function rotateGrid(grid: Grid): Grid {
  const newGrid = createEmptyGrid()
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      newGrid[i][j] = grid[GRID_SIZE - 1 - j][i]
    }
  }
  return newGrid
}

function moveLeft(grid: Grid): { newGrid: Grid; score: number; moved: boolean } {
  let totalScore = 0
  let moved = false
  const newGrid = grid.map((row) => {
    const { newRow, score } = slideRow(row)
    totalScore += score
    if (newRow.join(",") !== row.join(",")) {
      moved = true
    }
    return newRow
  })
  return { newGrid, score: totalScore, moved }
}

function move(
  grid: Grid,
  direction: "left" | "right" | "up" | "down",
): { newGrid: Grid; score: number; moved: boolean } {
  let rotatedGrid = grid

  const rotations: Record<string, number> = {
    left: 0,
    down: 1,
    right: 2,
    up: 3,
  }

  for (let i = 0; i < rotations[direction]; i++) {
    rotatedGrid = rotateGrid(rotatedGrid)
  }

  const { newGrid, score, moved } = moveLeft(rotatedGrid)

  let finalGrid = newGrid
  for (let i = 0; i < (4 - rotations[direction]) % 4; i++) {
    finalGrid = rotateGrid(finalGrid)
  }

  return { newGrid: finalGrid, score, moved }
}

function canMove(grid: Grid): boolean {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) return true
      if (j < GRID_SIZE - 1 && grid[i][j] === grid[i][j + 1]) return true
      if (i < GRID_SIZE - 1 && grid[i][j] === grid[i + 1][j]) return true
    }
  }
  return false
}

function hasWon(grid: Grid): boolean {
  return grid.some((row) => row.some((cell) => cell === 2048))
}

function getTileStyle(value: number): string {
  if (value === 0) return "bg-muted"

  const styles: Record<number, string> = {
    2: "bg-secondary text-secondary-foreground",
    4: "bg-muted-foreground/20 text-foreground",
    8: "bg-muted-foreground/40 text-foreground",
    16: "bg-muted-foreground/60 text-background",
    32: "bg-muted-foreground/80 text-background",
    64: "bg-foreground/80 text-background",
    128: "bg-foreground/90 text-background",
    256: "bg-foreground text-background",
    512: "bg-primary text-primary-foreground",
    1024: "bg-primary text-primary-foreground font-bold",
    2048: "bg-primary text-primary-foreground font-bold",
  }

  return styles[value] || "bg-primary text-primary-foreground font-bold"
}

function getFontSize(value: number): string {
  if (value < 100) return "text-3xl md:text-4xl"
  if (value < 1000) return "text-2xl md:text-3xl"
  return "text-xl md:text-2xl"
}

export function Game2048() {
  const [grid, setGrid] = useState<Grid>(initializeGrid)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)

  const resetGame = useCallback(() => {
    setGrid(initializeGrid())
    setScore(0)
    setGameOver(false)
    setWon(false)
  }, [])

  const handleMove = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (gameOver) return

      const { newGrid, score: moveScore, moved } = move(grid, direction)

      if (moved) {
        const gridWithNewTile = addRandomTile(newGrid)
        setGrid(gridWithNewTile)
        setScore((prev) => {
          const newScore = prev + moveScore
          if (newScore > bestScore) {
            setBestScore(newScore)
          }
          return newScore
        })

        if (hasWon(gridWithNewTile) && !won) {
          setWon(true)
        }

        if (!canMove(gridWithNewTile)) {
          setGameOver(true)
        }
      }
    },
    [grid, gameOver, won, bestScore],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
      }

      switch (e.key) {
        case "ArrowUp":
          handleMove("up")
          break
        case "ArrowDown":
          handleMove("down")
          break
        case "ArrowLeft":
          handleMove("left")
          break
        case "ArrowRight":
          handleMove("right")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleMove])

  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    }

    const dx = touchEnd.x - touchStart.x
    const dy = touchEnd.y - touchStart.y

    const minSwipeDistance = 50

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipeDistance) {
        handleMove(dx > 0 ? "right" : "left")
      }
    } else {
      if (Math.abs(dy) > minSwipeDistance) {
        handleMove(dy > 0 ? "down" : "up")
      }
    }

    setTouchStart(null)
  }

  return (
    <Card className="w-full max-w-md border-2 border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-4xl font-bold tracking-tight">2048</CardTitle>
          <Button variant="outline" size="icon" onClick={resetGame}>
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">New Game</span>
          </Button>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex-1 bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Score</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>
          <div className="flex-1 bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Best</p>
            <p className="text-2xl font-bold">{bestScore}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="relative bg-muted-foreground/10 rounded-lg p-2 md:p-3"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-background/80 rounded-lg flex flex-col items-center justify-center z-10 backdrop-blur-sm">
              <p className="text-3xl font-bold mb-4">Game Over!</p>
              <Button onClick={resetGame}>Try Again</Button>
            </div>
          )}

          {/* Win Overlay */}
          {won && !gameOver && (
            <div className="absolute inset-0 bg-background/80 rounded-lg flex flex-col items-center justify-center z-10 backdrop-blur-sm">
              <p className="text-3xl font-bold mb-2">You Win!</p>
              <p className="text-muted-foreground mb-4">Continue playing?</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetGame}>
                  New Game
                </Button>
                <Button onClick={() => setWon(false)}>Continue</Button>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`
                    aspect-square rounded-md flex items-center justify-center
                    font-bold transition-all duration-100
                    ${getTileStyle(cell)}
                    ${getFontSize(cell)}
                  `}
                >
                  {cell !== 0 && cell}
                </div>
              )),
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">Use arrow keys or swipe to play</p>
      </CardContent>
    </Card>
  )
}
