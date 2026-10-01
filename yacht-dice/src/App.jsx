import { useState } from 'react'
import Home from './Home'
import Game from './Game'

function App() {
  const [screen, setScreen] = useState('home')

  if (screen === 'game') {
    return <Game />
  }

  return <Home onStart={() => setScreen('game')} />
}

export default App
