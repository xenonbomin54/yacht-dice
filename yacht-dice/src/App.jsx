import { useState } from 'react'
import './App.css'

const CATEGORY_LIST = [
  { id: 'ones', name: 'ONES', description: '1의 합' },
  { id: 'twos', name: 'TWOS', description: '2의 합' },
  { id: 'threes', name: 'THREES', description: '3의 합' },
  { id: 'fours', name: 'FOURS', description: '4의 합' },
  { id: 'fives', name: 'FIVES', description: '5의 합' },
  { id: 'sixes', name: 'SIXES', description: '6의 합' },
  { id: 'choice', name: 'CHOICE', description: '합계' },
  { id: 'fourOfAKind', name: '4 OF A KIND', description: '포카드' },
  { id: 'fullHouse', name: 'FULL HOUSE', description: '풀하우스' },
  { id: 'smallStraight', name: 'SMALL STRAIGHT', description: '스몰 스트레이트' },
  { id: 'largeStraight', name: 'LARGE STRAIGHT', description: '라지 스트레이트' },
  { id: 'yacht', name: 'YACHT', description: '야추' },
]

const INITIAL_DICE = [1, 1, 1, 1, 1]

function rollDice(dice, held) {
  return dice.map((value, index) =>
    held[index] ? value : Math.floor(Math.random() * 6) + 1
  )
}

function getCounts(dice) {
  return dice.reduce((counts, value) => {
    counts[value] += 1
    return counts
  }, [0, 0, 0, 0, 0, 0, 0])
}

function calculateScore(category, dice) {
  const counts = getCounts(dice)
  const total = dice.reduce((sum, value) => sum + value, 0)

  switch (category) {
    case 'ones':
      return counts[1] * 1

    case 'twos':
      return counts[2] * 2

    case 'threes':
      return counts[3] * 3

    case 'fours':
      return counts[4] * 4

    case 'fives':
      return counts[5] * 5

    case 'sixes':
      return counts[6] * 6

    case 'choice':
      return total

    case 'fourOfAKind':
      return counts.some((count) => count >= 4) ? total : 0

    case 'fullHouse':
      return counts.includes(5) ||
        (counts.includes(3) && counts.includes(2))
        ? 25
        : 0

    case 'smallStraight': {
      const unique = new Set(dice)
      const hasSmallStraight =
        (unique.has(1) && unique.has(2) && unique.has(3) && unique.has(4)) ||
        (unique.has(2) && unique.has(3) && unique.has(4) && unique.has(5)) ||
        (unique.has(3) && unique.has(4) && unique.has(5) && unique.has(6))

      return hasSmallStraight ? 15 : 0
    }

    case 'largeStraight': {
      const sorted = [...new Set(dice)].sort((a, b) => a - b).join('')

      return sorted === '12345' || sorted === '23456' ? 30 : 0
    }

    case 'yacht':
      return counts.includes(5) ? 50 : 0

    default:
      return 0
  }
}

function getTotalScore(scores) {
  return Object.values(scores).reduce(
    (total, score) => total + (score ?? 0),
    0
  )
}

function App() {
  const [dice, setDice] = useState(INITIAL_DICE)
  const [held, setHeld] = useState([false, false, false, false, false])
  const [rollCount, setRollCount] = useState(0)
  const [turn, setTurn] = useState(1)
  const [scores, setScores] = useState({})
  const [gameOver, setGameOver] = useState(false)

  const handleRoll = () => {
    if (rollCount >= 3 || gameOver) return

    setDice((current) => rollDice(current, held))
    setRollCount((current) => current + 1)
  }

  const toggleHold = (index) => {
    if (rollCount === 0 || gameOver) return

    setHeld((current) =>
      current.map((value, i) => (i === index ? !value : value))
    )
  }

  const selectCategory = (category) => {
    if (gameOver || scores[category] !== undefined || rollCount === 0) {
      return
    }

    const score = calculateScore(category, dice)

    setScores((current) => ({
      ...current,
      [category]: score,
    }))

    if (turn >= 12) {
      setGameOver(true)
      return
    }

    setTurn((current) => current + 1)
    setDice(INITIAL_DICE)
    setHeld([false, false, false, false, false])
    setRollCount(0)
  }

  const resetGame = () => {
    setDice(INITIAL_DICE)
    setHeld([false, false, false, false, false])
    setRollCount(0)
    setTurn(1)
    setScores({})
    setGameOver(false)
  }

  const totalScore = getTotalScore(scores)

  if (gameOver) {
    return (
      <main className="game result-screen">
        <section className="result-card">
          <p className="eyebrow">GAME COMPLETE</p>

          <div className="result-title">
            <span>YOUR</span>
            <h1>SCORE</h1>
          </div>

          <div className="final-score">
            <span>TOTAL SCORE</span>
            <strong>{totalScore}</strong>
          </div>

          <div className="final-yacht">
            {scores.yacht === 50 ? (
              <>
                <span className="yacht-symbol">★</span>
                <strong>YACHT!</strong>
                <span>완벽한 다섯 개의 주사위</span>
              </>
            ) : (
              <>
                <span className="yacht-symbol">🎲</span>
                <strong>GAME OVER</strong>
                <span>12턴을 모두 완료했습니다.</span>
              </>
            )}
          </div>

          <button className="new-game-button" onClick={resetGame}>
            NEW GAME
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="game">
      <header className="header">
        <div>
          <p className="eyebrow">YACHT DICE</p>
          <h1>YACHT</h1>
        </div>

        <div className="turn-info">
          <span>TURN</span>
          <strong>{turn} / 12</strong>
        </div>
      </header>

      <section className="game-board">
        <div className="dice-area">
          <div className="dice-header">
            <div>
              <p className="section-label">YOUR DICE</p>
              <h2>주사위를 굴려보세요</h2>
            </div>

            <div className="roll-counter">
              <span>ROLL</span>
              <strong>{rollCount} / 3</strong>
            </div>
          </div>

          <div className="dice-container">
            {dice.map((value, index) => (
              <button
                className={`die ${held[index] ? 'held' : ''}`}
                key={index}
                onClick={() => toggleHold(index)}
                aria-label={`${value} 주사위${held[index] ? ' 홀드됨' : ''}`}
              >
                <div className={`dots dots-${value}`}>
                  {Array.from({ length: value }).map((_, dotIndex) => (
                    <span key={dotIndex} />
                  ))}
                </div>

                {held[index] && <span className="held-label">HOLD</span>}
              </button>
            ))}
          </div>

          <p className="hold-guide">
            {rollCount === 0
              ? 'ROLL을 눌러 주사위를 굴리세요'
              : rollCount >= 3
                ? '점수판에서 카테고리를 선택하세요'
                : '주사위를 클릭하면 HOLD할 수 있어요'}
          </p>

          <div className="actions">
            <button
              className="roll-button"
              onClick={handleRoll}
              disabled={rollCount >= 3}
            >
              <span className="roll-icon">↻</span>
              {rollCount >= 3 ? 'ROLL END' : 'ROLL DICE'}
            </button>

            <button className="reset-button" onClick={resetGame}>
              RESET
            </button>
          </div>
        </div>

        <aside className="score-card">
          <div className="score-card-header">
            <div>
              <p className="section-label">SCORE BOARD</p>
              <h2>점수판</h2>
            </div>

            <div className="total-score">
              <span>TOTAL</span>
              <strong>{totalScore}</strong>
            </div>
          </div>

          <div className="score-list">
            {CATEGORY_LIST.map((category) => {
              const used = scores[category.id] !== undefined
              const preview =
                rollCount > 0 && !used
                  ? calculateScore(category.id, dice)
                  : scores[category.id]

              return (
                <button
                  className={`score-row ${used ? 'used' : ''}`}
                  key={category.id}
                  onClick={() => selectCategory(category.id)}
                  disabled={used || rollCount === 0}
                >
                  <div>
                    <strong>{category.name}</strong>
                    <span>{category.description}</span>
                  </div>

                  <span className={`score-value ${used ? 'confirmed' : ''}`}>
                    {preview ?? '—'}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="score-guide">
            {rollCount === 0
              ? '주사위를 먼저 굴려주세요'
              : '원하는 점수를 클릭해서 턴을 종료하세요'}
          </p>
        </aside>
      </section>
    </main>
  )
}

export default App
