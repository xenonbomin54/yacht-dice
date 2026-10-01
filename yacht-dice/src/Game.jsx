import { useEffect, useRef, useState } from 'react'
import './App.css'

/* -------------------- 점수판 데이터 -------------------- */

// 주사위 눈 / 아이콘용 3x3 패턴 (1 = 점)
const DICE_PATTERNS = {
  1: '000010000',
  2: '100000001',
  3: '100010001',
  4: '101000101',
  5: '101010101',
  6: '101101101',
}

const UPPER_CATEGORIES = [
  { id: 'ones', name: 'Aces', pattern: DICE_PATTERNS[1], dice: true },
  { id: 'twos', name: 'Deuces', pattern: DICE_PATTERNS[2], dice: true },
  { id: 'threes', name: 'Threes', pattern: DICE_PATTERNS[3], dice: true },
  { id: 'fours', name: 'Fours', pattern: DICE_PATTERNS[4], dice: true },
  { id: 'fives', name: 'Fives', pattern: DICE_PATTERNS[5], dice: true },
  { id: 'sixes', name: 'Sixes', pattern: DICE_PATTERNS[6], dice: true },
]

const CHOICE_CATEGORIES = [
  { id: 'choice', name: 'Choice', pattern: '010111010' },
]

const LOWER_CATEGORIES = [
  { id: 'fourOfAKind', name: '4 of a Kind', pattern: '101000101' },
  { id: 'fullHouse', name: 'Full House', pattern: '101000111' },
  { id: 'smallStraight', name: 'S. Straight', pattern: '100010001' },
  { id: 'largeStraight', name: 'L. Straight', pattern: '101101010' },
  { id: 'yacht', name: 'Yacht', pattern: '101010101' },
]

const BONUS_TARGET = 63
const BONUS_SCORE = 35

/* -------------------- 주사위 데이터 -------------------- */

const DICE_COUNT = 5
const INITIAL_DICE = [1, 1, 1, 1, 1]
const ROLL_DURATION = 1150

// 펠트 위에서 각 주사위가 놓이는 기준 위치 (% 단위, 주사위 중심)
const FELT_ANCHORS = [
  { x: 22, y: 24 },
  { x: 70, y: 22 },
  { x: 46, y: 50 },
  { x: 22, y: 76 },
  { x: 72, y: 76 },
]

/*
 * 위에서 내려다보는 시점이라 "앞면(front)"이 화면을 향한다.
 * 해당 숫자의 면이 앞으로 오도록 하는 회전값.
 *
 * 큐브 면 배치: 1 앞 / 6 뒤 / 3 오른쪽 / 4 왼쪽 / 2 위 / 5 아래
 */
const FACE_ROTATIONS = {
  1: { x: 0, y: 0, z: 0 },
  2: { x: -90, y: 0, z: 0 },
  3: { x: 0, y: -90, z: 0 },
  4: { x: 0, y: 90, z: 0 },
  5: { x: 90, y: 0, z: 0 },
  6: { x: 0, y: 180, z: 0 },
}

const CUBE_FACES = [
  { className: 'cube-front', value: 1 },
  { className: 'cube-back', value: 6 },
  { className: 'cube-right', value: 3 },
  { className: 'cube-left', value: 4 },
  { className: 'cube-top', value: 2 },
  { className: 'cube-bottom', value: 5 },
]

function createInitialRotations() {
  return INITIAL_DICE.map((value) => ({ ...FACE_ROTATIONS[value] }))
}

function createInitialPlacements() {
  return FELT_ANCHORS.map(() => ({
    dx: 0,
    dy: 0,
    angle: Math.random() * 50 - 25,
  }))
}

// 현재 각도에서 앞으로 여러 바퀴 돌고, 목표 각도에서 정확히 멈춘다.
function spinAxis(current, target, minTurns, extraTurns) {
  const delta = (((target - current) % 360) + 360) % 360
  const turns = minTurns + Math.floor(Math.random() * (extraTurns + 1))

  return current + delta + turns * 360
}

function createRollingRotation(current, value) {
  const target = FACE_ROTATIONS[value]

  return {
    x: spinAxis(current.x, target.x, 2, 2),
    y: spinAxis(current.y, target.y, 3, 2),
    z: spinAxis(current.z, target.z, 1, 1),
  }
}

// 굴릴 때마다 펠트 위 위치(살짝)와 평면 회전 각도를 새로 정한다.
function createPlacement(previousAngle) {
  return {
    dx: (Math.random() - 0.5) * 7,
    dy: (Math.random() - 0.5) * 7,
    angle: previousAngle + 90 + Math.random() * 270,
  }
}

function rollDice(dice, held) {
  return dice.map((value, index) =>
    held[index] ? value : Math.floor(Math.random() * 6) + 1
  )
}

/* -------------------- 점수 계산 -------------------- */

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
        (unique.has(1) &&
          unique.has(2) &&
          unique.has(3) &&
          unique.has(4)) ||
        (unique.has(2) &&
          unique.has(3) &&
          unique.has(4) &&
          unique.has(5)) ||
        (unique.has(3) &&
          unique.has(4) &&
          unique.has(5) &&
          unique.has(6))

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

function getUpperScore(scores) {
  return UPPER_CATEGORIES.reduce(
    (sum, category) => sum + (scores[category.id] ?? 0),
    0
  )
}

function getBonus(scores) {
  return getUpperScore(scores) >= BONUS_TARGET ? BONUS_SCORE : 0
}

function getTotalScore(scores) {
  const base = Object.values(scores).reduce(
    (total, score) => total + (score ?? 0),
    0
  )

  return base + getBonus(scores)
}

/* -------------------- Pips -------------------- */

function DicePips({ value }) {
  return (
    <div className="dots">
      {DICE_PATTERNS[value].split('').map((cell, index) => (
        <span key={index} className={cell === '1' ? 'pip' : 'blank'} />
      ))}
    </div>
  )
}

/* -------------------- Die -------------------- */

function Die({
  value,
  rotation,
  angle,
  held,
  rolling,
  place,
  left,
  top,
  disabled,
  onClick,
}) {
  const isRolling = rolling && !held

  const style = {
    '--rotate-x': `${rotation.x}deg`,
    '--rotate-y': `${rotation.y}deg`,
    '--rotate-z': `${rotation.z}deg`,
    '--angle': `${place === 'rack' ? 0 : angle}deg`,
  }

  if (place === 'felt') {
    style.left = `${left}%`
    style.top = `${top}%`
  }

  return (
    <div
      className={`die-pos in-${place} ${isRolling ? 'is-rolling' : ''}`}
      style={style}
    >
      <div className="die-shadow" />

      <button
        type="button"
        className="die"
        onClick={onClick}
        disabled={disabled}
        aria-label={`${value} 주사위${held ? ' 홀드됨' : ''}`}
      >
        <div className="die-lift">
          <div className="cube">
            {CUBE_FACES.map((face) => (
              <div key={face.className} className={`cube-face ${face.className}`}>
                <DicePips value={face.value} />
              </div>
            ))}
          </div>
        </div>
      </button>
    </div>
  )
}

/* -------------------- Scoreboard parts -------------------- */

function PixelIcon({ pattern, dice = false }) {
  return (
    <span className={`pixel-icon ${dice ? 'is-dice' : ''}`} aria-hidden="true">
      {pattern.split('').map((cell, index) => (
        <i key={index} className={cell === '1' ? 'on' : ''} />
      ))}
    </span>
  )
}

function ScoreRow({ category, value, used, disabled, onSelect }) {
  return (
    <button
      type="button"
      className={`sb-row ${used ? 'is-used' : ''}`}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className="sb-label">
        <PixelIcon pattern={category.pattern} dice={category.dice} />
        {category.name}
      </span>

      <span className={`sb-cell ${used ? 'is-confirmed' : 'is-preview'}`}>
        {value}
      </span>
    </button>
  )
}

/* -------------------- App -------------------- */

function Game() {
  const [dice, setDice] = useState(INITIAL_DICE)
  const [held, setHeld] = useState([false, false, false, false, false])
  const [rollCount, setRollCount] = useState(0)
  const [turn, setTurn] = useState(1)
  const [scores, setScores] = useState({})
  const [gameOver, setGameOver] = useState(false)

  const [rotations, setRotations] = useState(createInitialRotations)
  const [placements, setPlacements] = useState(createInitialPlacements)
  const [rolling, setRolling] = useState(false)

  const timerRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const handleRoll = () => {
    if (rollCount >= 3 || gameOver || rolling) return

    const nextDice = rollDice(dice, held)

    const nextRotations = nextDice.map((value, index) =>
      held[index]
        ? rotations[index]
        : createRollingRotation(rotations[index], value)
    )

    setRolling(true)
    setRotations(nextRotations)
    setPlacements((current) =>
      current.map((placement, index) =>
        held[index] ? placement : createPlacement(placement.angle)
      )
    )
    setRollCount((current) => current + 1)

    // 실제 숫자도 애니메이션이 끝나는 순간 확정한다.
    timerRef.current = setTimeout(() => {
      setDice(nextDice)
      setRolling(false)
    }, ROLL_DURATION)
  }

  const toggleHold = (index) => {
    if (rollCount === 0 || gameOver || rolling) return

    setHeld((current) =>
      current.map((value, i) => (i === index ? !value : value))
    )
  }

  const startNextTurn = () => {
    setDice(INITIAL_DICE)
    setHeld([false, false, false, false, false])
    setRollCount(0)
    setRotations(createInitialRotations())
    setPlacements(createInitialPlacements())
  }

  const selectCategory = (category) => {
    if (
      gameOver ||
      rolling ||
      scores[category] !== undefined ||
      rollCount === 0
    ) {
      return
    }

    const score = calculateScore(category, dice)

    setScores({
      ...scores,
      [category]: score,
    })

    if (turn >= 12) {
      setGameOver(true)
      return
    }

    setTurn((current) => current + 1)
    startNextTurn()
  }

  const resetGame = () => {
    clearTimeout(timerRef.current)

    startNextTurn()
    setTurn(1)
    setScores({})
    setGameOver(false)
    setRolling(false)
  }

  const upperScore = getUpperScore(scores)
  const bonus = getBonus(scores)
  const totalScore = getTotalScore(scores)

  const canHold = rollCount > 0 && !rolling && !gameOver

  const renderRow = (category) => {
    const used = scores[category.id] !== undefined

    const value = used
      ? scores[category.id]
      : rollCount > 0 && !rolling
        ? calculateScore(category.id, dice)
        : ''

    return (
      <ScoreRow
        key={category.id}
        category={category}
        value={value}
        used={used}
        disabled={used || rollCount === 0 || rolling}
        onSelect={() => selectCategory(category.id)}
      />
    )
  }

  // 보관함: 값 순서대로 정렬해서 가운데 칸부터 채운다.
  const heldDice = dice
    .map((value, index) => ({ value, index }))
    .filter((item) => held[item.index])
    .sort((a, b) => a.value - b.value || a.index - b.index)

  const rackOffset = Math.floor((DICE_COUNT - heldDice.length) / 2)

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

          <div className="tray-wrap">
            <div className="tray">
              <div className="felt">
                {dice.map((value, index) =>
                  held[index] ? null : (
                    <Die
                      key={index}
                      value={value}
                      rotation={rotations[index]}
                      angle={placements[index].angle}
                      held={false}
                      rolling={rolling}
                      place="felt"
                      left={FELT_ANCHORS[index].x + placements[index].dx}
                      top={FELT_ANCHORS[index].y + placements[index].dy}
                      disabled={!canHold}
                      onClick={() => toggleHold(index)}
                    />
                  )
                )}
              </div>

              <div className="rack">
                {Array.from({ length: DICE_COUNT }).map((_, slot) => {
                  const item = heldDice[slot - rackOffset]

                  return (
                    <div className="rack-slot" key={slot}>
                      {item && (
                        <Die
                          key={item.index}
                          value={item.value}
                          rotation={rotations[item.index]}
                          angle={0}
                          held
                          rolling={rolling}
                          place="rack"
                          disabled={!canHold}
                          onClick={() => toggleHold(item.index)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <p className="hold-guide">
            {rollCount === 0
              ? 'ROLL을 눌러 주사위를 굴리세요'
              : rollCount >= 3
                ? '점수판에서 카테고리를 선택하세요'
                : '주사위를 클릭하면 아래 칸에 HOLD할 수 있어요'}
          </p>

          <div className="actions">
            <button
              className="roll-button"
              onClick={handleRoll}
              disabled={rollCount >= 3 || rolling}
            >
              <span className="roll-icon">↻</span>
              {rolling
                ? 'ROLLING...'
                : rollCount >= 3
                  ? 'ROLL END'
                  : 'ROLL DICE'}
            </button>

            <button className="reset-button" onClick={resetGame}>
              RESET
            </button>
          </div>
        </div>

        <aside className="score-card">
          <div className="sb-head">
            <div className="sb-turn">
              <span>Turn</span>
              <strong>{turn}/12</strong>
            </div>
            <div className="sb-player">YOU</div>
          </div>

          <div className="sb-title">Categories</div>

          {UPPER_CATEGORIES.map(renderRow)}

          <div className="sb-block">
            <div className="sb-sum">
              <span className="sb-sum-label">Subtotal</span>
              <span className="sb-sum-cell">
                {upperScore}/{BONUS_TARGET}
              </span>
            </div>
            <div className="sb-sum">
              <span className="sb-sum-label">+{BONUS_SCORE} Bonus</span>
              <span className="sb-sum-cell">
                {bonus > 0 ? `+${bonus}` : ''}
              </span>
            </div>
          </div>

          <div className="sb-note">
            Bonus if <PixelIcon pattern={DICE_PATTERNS[1]} dice />-
            <PixelIcon pattern={DICE_PATTERNS[6]} dice /> are over{' '}
            {BONUS_TARGET} points
          </div>

          <div className="sb-group">{CHOICE_CATEGORIES.map(renderRow)}</div>

          <div className="sb-group">{LOWER_CATEGORIES.map(renderRow)}</div>

          <div className="sb-total">
            <span className="sb-total-label">Total</span>
            <span className="sb-total-cell">{totalScore}</span>
          </div>

          <p className="score-guide">
            {rollCount === 0
              ? '주사위를 먼저 굴려주세요'
              : '원하는 칸을 클릭해서 턴을 종료하세요'}
          </p>
        </aside>
      </section>
    </main>
  )
}

export default Game
