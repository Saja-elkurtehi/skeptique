import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../config'
import { savedStories } from '../data/stories'
import { PageShell } from './Layout'

function StoryCard({ topic, index, onOpen }) {
  const themes = { 1: 'technology', 2: 'health', 3: 'environment', 4: 'consumer' }
  const theme = themes[topic.id] || 'search'
  return <button className={`topic-card topic-${theme}`} onClick={onOpen}>
    <span className="topic-visual" aria-hidden="true"><i /><i /><i /></span>
    <div className="topic-card-meta"><span className="topic-index">{String(index + 1).padStart(2, '0')}</span><span>{topic.lastUpdated || 'Saved brief'}</span></div>
    <h3>{topic.title}</h3>
    <p>Review the shared facts, compare framing, and identify questions the coverage may leave open.</p>
    <div className="topic-card-footer"><div className="tag-list">{topic.tags?.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div><span className="card-arrow" aria-hidden="true">→</span></div>
  </button>
}

export default function Landing({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const [topics, setTopics] = useState(savedStories)
  const [query, setQuery] = useState('')

  const fetchTopics = useCallback(async (signal) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stories`, { signal })
      if (!response.ok) throw new Error()
      setTopics(await response.json())
    } catch (err) {
      if (err.name !== 'AbortError') setTopics(savedStories)
    }
  }, [])

  useEffect(() => { const controller = new AbortController(); fetchTopics(controller.signal); return () => controller.abort() }, [fetchTopics])

  const search = (event) => {
    event.preventDefault()
    const value = query.trim()
    if (value.length >= 2) navigate(`/stories/search:${encodeURIComponent(value)}`)
  }
  const openPage = (path) => { window.scrollTo(0, 0); navigate(path) }

  return <PageShell darkMode={darkMode} setDarkMode={setDarkMode}>
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow">{darkMode ? 'ADJUST THE LENS' : 'QUESTION THE SPIN'}</span>
          <h1>{darkMode ? <><span className="focus-word">REFOCUS</span><br />the story.</> : <>Read beyond<br />the headline.</>}</h1>
          <p>{darkMode ? 'Bring the coverage into focus. Compare the same event through different editorial lenses, then inspect what each frame includes—and leaves outside the shot.' : 'Compare the spin, separate shared facts from interpretation, and catch what the headline leaves out.'}</p>
          <form className="search-form" onSubmit={search}>
            <label className="sr-only" htmlFor="news-search">Search a news topic</label><span aria-hidden="true">⌕</span>
            <input id="news-search" value={query} onChange={(event) => setQuery(event.target.value)} minLength={2} maxLength={120} required placeholder="Search a topic, policy, or event" />
            <button type="submit">Analyze coverage</button>
          </form>
          <p className="hero-note"><span>Independent analysis</span><span>Source links included</span><span>Methods disclosed</span></p>
          <aside className="skeptic-warning"><strong>⚠️ Warning: May cause decreased trust in media.</strong><span>We consider this a feature.</span></aside>
        </div>
        <div className="hero-panel" aria-label="How Skeptique organizes a story">
          {darkMode && <div className="aperture-graphic" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>}
          <div className="brief-window">
            <div className="window-top"><span /><span /><span /><em>Coverage brief</em></div>
            <div className="window-story"><small>SHARED FACTS</small><span className="line long" /><span className="line" /></div>
            <div className="window-sources">
              <div><i className="source-dot blue" /><span><b>Source A</b><small>Policy frame · Low signal</small></span></div>
              <div><i className="source-dot amber" /><span><b>Source B</b><small>Economic frame · Moderate signal</small></span></div>
              <div><i className="source-dot green" /><span><b>Source C</b><small>Human impact · Low signal</small></span></div>
            </div>
            <div className="window-question">What context is missing?</div>
          </div>
        </div>
      </section>

      <section className="topics-section" id="stories"><div className="shell">
        <div className="section-head"><div><span className="eyebrow">START WITH A BRIEF</span><h2>Current topics</h2></div><p>Saved briefs open instantly. Refresh live coverage only when you want the latest articles.</p></div>
        <div className="topic-grid">{topics.map((topic, index) => <StoryCard key={topic.id} topic={topic} index={index} onOpen={() => openPage(`/stories/${topic.id}`)} />)}</div>
      </div></section>

      <section className="principles shell">
        <div className="section-head"><div><span className="eyebrow">DESIGNED FOR SKEPTICISM</span><h2>Useful signals, clear limits</h2></div></div>
        <div className="principle-grid">
          <article><span>01</span><h3>Compare, don’t coronate</h3><p>No outlet gets the “objective truth” crown. Skeptique shows where the framing changes and leaves the judgment to you.</p></article>
          <article><span>02</span><h3>Receipts over vibes</h3><p>Every live article keeps its link, excerpt, detected frame, and scoring evidence. A confident label without evidence is just branding.</p></article>
          <article><span>03</span><h3>Distrust this dashboard too</h3><p>Automated analysis can be wrong. Our methods and limitations stay visible because skepticism should include the tool doing the skeptical work.</p></article>
        </div>
        <button className="text-link" onClick={() => openPage('/methodology')}>Read how the analysis works <span>→</span></button>
      </section>
    </main>
  </PageShell>
}
