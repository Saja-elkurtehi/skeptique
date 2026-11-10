import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import StoryView from './components/StoryView'
import Methodology from './components/Methodology'
import './App.css'
import './index.css'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false

    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      try {
        return JSON.parse(saved)
      } catch {
        return false
      }
    }

    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return true
    }

    return false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    const root = document.documentElement
    darkMode ? root.classList.add('dark') : root.classList.remove('dark')
  }, [darkMode])

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Landing darkMode={darkMode} setDarkMode={setDarkMode} />}
        />
        <Route
          path="/stories/:id"
          element={<StoryView darkMode={darkMode} setDarkMode={setDarkMode} />}
        />
        <Route
          path="/methodology"
          element={<Methodology darkMode={darkMode} setDarkMode={setDarkMode} />}
        />
      </Routes>
    </Router>
  )
}

export default App
