import { useState } from 'react';
import './App.css';

const CATEGORY_LIST = [
  { key: 'ones', label: 'ONES', description: '1의 합' },
  { key: 'twos', label: 'TWOS', description: '2의 합' },
  { key: 'threes', label: 'THREES', description: '3의 합' },
  { key: 'fours', label: 'FOURS', description: '4의 합' },
  { key: 'fives', label: 'FIVES', description: '5의 합' },
  { key: 'sixes', label: 'SIXES', description: '6의 합' },
  { key: 'choice', label: 'CHOICE', description: '모든 주사위의 합' },
  { key: 'fourOfAKind', label: '4 OF A KIND', description: '같은 숫자 4개 이상' },
  { key: 'fullHouse', label: 'FULL HOUSE', description: '25점' },
  { key: 'smallStraight', label: 'SMALL STRAIGHT', description: '15점' },
  { key: 'largeStraight', label: 'LARGE STRAIGHT', description: '30점' },
  { key: 'yacht', label: 'YACHT', description: '50점' },
];

const INITIAL_DICE = [1, 1, 1, 1, 1];

function rollDice(dice, held) {
  return dice.map((value, index) => {
    if (held[index]) {
      return value;
    }

    return Math.floor(Math.random() * 6) + 1;
  });
}

function getCounts(dice) {
  const counts = Array(7).fill(0);

  dice.forEach((value) => {
    counts[value] += 1;
  });

  return counts;
}

function calculateScore(category, dice) {
  const counts = getCounts(dice);
  const sum = dice.reduce((total, value) => total + value, 0);

  switch (category) {
    case 'ones':
      return counts[1] * 1;

    case 'twos':
      return counts[2] * 2;

    case 'threes':
      return counts[3] * 3;

    case 'fours':
      return counts[4] * 4;

    case 'fives':
      return counts[5] * 5;

    case 'sixes':
      return counts[6] * 6;

    case 'choice':
      return sum;

    case 'fourOfAKind':
      return counts.some((count) => count >= 4) ? sum : 0;

    case 'fullHouse': {
      const hasThree = counts.some((count) => count === 3);
      const hasTwo = counts.some((count) => count === 2);
      const hasYacht = counts.some((count) => count === 5);

      return hasYacht || (hasThree && hasTwo) ? 25 : 0;
    }

    case 'smallStraight': {
      const unique = [...new Set(dice)].sort((a, b) => a - b);
      const values = unique.join('');

      return (
        values.includes('1234') ||
        values.includes('2345') ||
        values.includes('3456')
      )
        ? 15
        : 0;
    }

    case 'largeStraight': {
      const unique = [...new Set(dice)].sort((a, b) => a - b);
      const values = unique.join('');

      return values === '12345' || values === '23456' ? 30 : 0;
    }

    case 'yacht':
      return counts.some((count) => count === 5) ? 50 : 0;

    default:
      return 0;
  }
}

function getTotalScore(scores) {
  return Object.values(scores).reduce(
    (total, score) => total + (score ?? 0),
    0,
  );
}

function DiceFace({ value, isHeld }) {
  const pipPositions = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: [
      'top-left',
      'top-right',
      'middle-left',
      'middle-right',
      'bottom-left',
      'bottom-right',
    ],
  };

  return (
    <div className={`die ${isHeld ? 'held' : ''}`}>
      {pipPositions[value].map((position) => (
        <span key={position} className={`pip ${position}`} />
      ))}

      {isHeld && <span className="hold-label">HOLD</span>}
    </div>
  );
}

export default function App() {
  const [dice, setDice] = useState(INITIAL_DICE);
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [rollCount, setRollCount] = useState(0);
  const [turn, setTurn] = useState(1);
  const [scores, setScores] = useState({});
  const [gameOver, setGameOver] = useState(false);

  const canRoll = rollCount < 3 && !gameOver;

  const handleRoll = () => {
    if (!canRoll) return;

    const nextDice = rollDice(dice, held);

    setDice(nextDice);
    setRollCount((count) => count + 1);
  };

  const handleHold = (index) => {
    if (rollCount === 0 || gameOver) return;

    setHeld((current) =>
      current.map((value, i) => (i === index ? !value : value)),
    );
  };

  const handleScore = (category) => {
    if (rollCount === 0 || scores[category] !== undefined || gameOver) {
      return;
    }

    const score = calculateScore(category, dice);

    const nextScores = {
      ...scores,
      [category]: score,
    };

    setScores(nextScores);

    if (turn >= 12) {
      setGameOver(true);
      return;
    }

    setTurn((current) => current + 1);
    setDice(INITIAL_DICE);
    setHeld([false, false, false, false, false]);
    setRollCount(0);
  };

  const handleReset = () => {
    setDice(INITIAL_DICE);
    setHeld([false, false, false, false, false]);
    setRollCount(0);
    setTurn(1);
    setScores({});
    setGameOver(false);
  };

  if (gameOver) {
    const totalScore = getTotalScore(scores);
    const yachtCount = Object.entries(scores).filter(
      ([category, score]) => category === 'yacht' && score === 50,
    ).length;

    return (
      <main className="game-shell">
        <section className="result-card">
          <p className="eyebrow">GAME COMPLETE</p>

          <h1 className="result-title">YACHT</h1>

          <div className="result-score">
            <span>FINAL SCORE</span>
            <strong>{totalScore}</strong>
          </div>

          {yachtCount > 0 && (
            <div className="yacht-result">
              <span>YACHT!</span>
              <strong>50</strong>
            </div>
          )}

          <button className="reset-button" onClick={handleReset}>
            NEW GAME
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <div>
          <p className="eyebrow">DICE GAME</p>
          <h1>YACHT</h1>
        </div>

        <div className="turn-info">
          <span>TURN</span>
          <strong>{turn} / 12</strong>
        </div>
      </header>

      <div className="game-board">
        <section className="dice-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR DICE</p>
              <h2>ROLL & HOLD</h2>
            </div>

            <span className="roll-count">
              {rollCount} / 3 ROLLS
            </span>
          </div>

          <div className="dice-container">
            {dice.map((value, index) => (
              <button
                key={index}
                className="die-button"
                onClick={() => handleHold(index)}
                disabled={rollCount === 0}
                aria-label={`Die ${index + 1}: ${value}`}
              >
                <DiceFace value={value} isHeld={held[index]} />
              </button>
            ))}
          </div>

          <div className="dice-controls">
            <button
              className="roll-button"
              onClick={handleRoll}
              disabled={!canRoll}
            >
              {rollCount === 0 ? 'ROLL DICE' : 'ROLL AGAIN'}
            </button>

            <button className="reset-button" onClick={handleReset}>
              RESET
            </button>
          </div>

          <p className="hint">
            {rollCount === 0
              ? 'Roll the dice to begin.'
              : rollCount >= 3
                ? 'Choose a score category.'
                : 'Click a die to hold it.'}
          </p>
        </section>

        <section className="score-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SCORE CARD</p>
              <h2>CHOOSE A CATEGORY</h2>
            </div>

            <div className="total-score">
              <span>TOTAL</span>
              <strong>{getTotalScore(scores)}</strong>
            </div>
          </div>

          <div className="score-list">
            {CATEGORY_LIST.map((category) => {
              const used = scores[category.key] !== undefined;
              const preview =
                rollCount > 0
                  ? calculateScore(category.key, dice)
                  : null;

              return (
                <button
                  key={category.key}
                  className={`score-row ${used ? 'used' : ''}`}
                  onClick={() => handleScore(category.key)}
                  disabled={used || rollCount === 0}
                >
                  <div className="score-category">
                    <strong>{category.label}</strong>
                    <span>{category.description}</span>
                  </div>

                  <div className="score-value">
                    {used ? (
                      <span className="confirmed-score">
                        {scores[category.key]}
                      </span>
                    ) : preview !== null ? (
                      <span className="preview-score">{preview}</span>
                    ) : (
                      <span className="empty-score">—</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
