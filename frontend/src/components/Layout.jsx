import { useNavigate } from 'react-router-dom'

export function ThemeToggle({ darkMode, setDarkMode }) {
  return (
    <button type="button" className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} reading theme`} title={`Switch to ${darkMode ? 'light' : 'dark'} reading theme`}>
      <span aria-hidden="true">{darkMode ? '☀' : '◉'}</span><span>{darkMode ? 'Skeptiq' : 'Refocus'}</span>
    </button>
  )
}

export function Header({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const goTo = (path) => { window.scrollTo(0, 0); navigate(path) }
  return (
    <header className="site-header"><div className="shell header-inner">
      <button className="brand" onClick={() => goTo('/')} aria-label="Skeptique home"><span className="brand-mark">{darkMode ? '◉' : 'S'}</span><span><strong>{darkMode ? 'Skeptique / Refocus' : 'Skeptiq'}</strong><small>{darkMode ? 'A clearer view through every lens' : 'Question the spin'}</small></span></button>
      <nav className="main-nav" aria-label="Main navigation"><button onClick={() => goTo('/')}>Stories</button><button onClick={() => goTo('/methodology')}>How it works</button></nav>
      <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
    </div></header>
  )
}

export function Footer() {
  const navigate = useNavigate()
  const openMethodology = () => { window.scrollTo(0, 0); navigate('/methodology') }
  return (
    <footer className="site-footer"><div className="shell footer-inner">
      <div><strong>Skeptique</strong><p>Context for the news—not a verdict on the truth.</p><small>No outlet was declared objectively correct in the making of this website.</small></div>
      <div className="footer-links"><button onClick={openMethodology}>Methodology</button><span>Originally started at Hack Western; independently developed since.</span></div>
    </div></footer>
  )
}

export function PageShell({ children, darkMode, setDarkMode }) {
  return <div className={`app-shell ${darkMode ? 'refocus-theme' : 'skeptiq-theme'}`}><Header darkMode={darkMode} setDarkMode={setDarkMode} />{children}<Footer /></div>
}
