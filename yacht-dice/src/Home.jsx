import { useEffect, useState } from 'react'
import './Home.css'

const RULES = [
  {
    title: '게임 진행',
    items: [
      '총 12턴이며, 한 턴에 주사위를 최대 3번 굴릴 수 있어요.',
      '굴린 뒤 마음에 드는 주사위를 클릭하면 아래 칸에 HOLD돼요. HOLD한 주사위는 다음 굴림에서 그대로 유지돼요.',
      '굴림을 마치면 점수판에서 칸을 하나 골라 점수를 기록하고 턴을 끝내요. 각 칸은 한 번만 쓸 수 있어요.',
    ],
  },
  {
    title: '점수 계산',
    items: [
      'Aces ~ Sixes: 해당 숫자 주사위 눈의 합',
      'Choice: 다섯 주사위 눈의 합',
      '4 of a Kind: 같은 눈 4개 이상이면 전체 눈의 합',
      'Full House: 3개 + 2개 조합이면 25점',
      'S. Straight: 연속된 4개의 숫자면 15점',
      'L. Straight: 연속된 5개의 숫자면 30점',
      'Yacht: 다섯 개가 모두 같으면 50점',
    ],
  },
  {
    title: '보너스',
    items: [
      'Aces ~ Sixes의 합이 63점 이상이면 보너스 35점이 자동으로 더해져요.',
    ],
  },
]

function Home({ onStart }) {
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    if (!showRules) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowRules(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showRules])

  return (
    <main className="home">
      <div className="home-inner">
        <p className="eyebrow">YACHT DICE</p>
        <h1 className="home-title">YACHT</h1>

        <div className="home-buttons">
          <button type="button" className="home-start" onClick={onStart}>
            시작하기
          </button>

          <button
            type="button"
            className="home-rules"
            onClick={() => setShowRules(true)}
          >
            게임 방법
          </button>
        </div>
      </div>

      {showRules && (
        <div
          className="rules-backdrop"
          onClick={() => setShowRules(false)}
        >
          <section
            className="rules-modal"
            role="dialog"
            aria-modal="true"
            aria-label="게임 방법"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="rules-header">
              <h2>게임 방법</h2>

              <button
                type="button"
                className="rules-close"
                onClick={() => setShowRules(false)}
                aria-label="닫기"
              >
                ✕
              </button>
            </header>

            <div className="rules-body">
              {RULES.map((section) => (
                <div className="rules-section" key={section.title}>
                  <h3>{section.title}</h3>

                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="rules-ok"
              onClick={() => setShowRules(false)}
            >
              확인
            </button>
          </section>
        </div>
      )}
    </main>
  )
}

export default Home
