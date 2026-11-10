import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API_BASE_URL from '../config'
import { createSearchFallback, getSavedStory } from '../data/stories'
import { PageShell } from './Layout'

const storyCache = new Map()
const summaryModes = {
  content: 'Full context',
  oneSentence: 'One sentence',
  eli5: 'Plain language',
  dataOnly: 'Data only',
  politicalAngle: 'Policy angle',
  humanitarianAngle: 'Human impact',
}

function SignalMeter({ bias }) {
  const score = bias?.score ?? 0
  return <div className="signal-meter">
    <div className="signal-label"><span>Framing intensity</span><strong>{bias ? `${bias.label} · ${score}/100` : 'Not scored'}</strong></div>
    <div className="signal-track"><span style={{ width: `${score}%` }} /></div>
  </div>
}

function SourceCard({ source, onOpen }) {
  return <button className="source-card" onClick={onOpen}>
    <div className="source-card-head">
      <div className="source-avatar">{source.imageUrl ? <img src={source.imageUrl} alt="" /> : (source.name || '?').charAt(0)}</div>
      <div><span className="source-name">{source.name || 'Unknown source'}</span><span className="source-frame">{source.frame || 'Other'} frame · {source.tone || 'Neutral'} tone</span></div>
    </div>
    <h3>{source.title || 'Untitled article'}</h3>
    <p>{source.summary || 'No excerpt is available for this article.'}</p>
    <SignalMeter bias={source.bias} />
    <div className="source-card-action"><span>View article analysis</span><span aria-hidden="true">→</span></div>
  </button>
}

function ArticleModal({ source, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEscape)
    document.body.classList.add('modal-open')
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.classList.remove('modal-open') }
  }, [onClose])

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="article-modal" role="dialog" aria-modal="true" aria-labelledby="article-modal-title">
      <button className="modal-close" onClick={onClose} aria-label="Close article analysis">×</button>
      <div className="modal-source"><div className="source-avatar">{(source.name || '?').charAt(0)}</div><div><strong>{source.name || 'Unknown source'}</strong><span>{source.frame || 'Other'} frame · {source.tone || 'Neutral'} tone</span></div></div>
      <h2 id="article-modal-title">{source.title || 'Untitled article'}</h2>
      <p className="modal-summary">{source.summary || 'No excerpt is available for this article.'}</p>
      <SignalMeter bias={source.bias} />
      <div className="signal-evidence"><h3>Why this score?</h3><ul>{(source.bias?.signals || ['This article has not been scored.']).map((signal) => <li key={signal}>{signal}</li>)}</ul><p>This score describes language in the available headline and excerpt. It is not a political leaning or factuality rating. Numbers look authoritative; methodology makes them accountable.</p></div>
      <div className="modal-actions"><button onClick={onClose}>Continue comparing</button>{source.url && <a href={source.url} target="_blank" rel="noreferrer">Open original article ↗</a>}</div>
    </section>
  </div>
}

export default function StoryView({ darkMode, setDarkMode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const initialStory = storyCache.get(id) || getSavedStory(id) || (id?.startsWith('search:') ? createSearchFallback(id.slice(7)) : null)
  const [story, setStory] = useState(initialStory)
  const [loading, setLoading] = useState(() => !initialStory)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const [mode, setMode] = useState('content')
  const [selectedSource, setSelectedSource] = useState(null)
  const goHome = () => { window.scrollTo(0, 0); navigate('/') }
  const storyThemes = { 1: ['technology', 'Technology systems'], 2: ['health', 'Health research'], 3: ['environment', 'Climate & environment'], 4: ['consumer', 'Consumer affairs'] }
  const [storyTheme, themeLabel] = storyThemes[id] || ['search', 'Live coverage search']

  useEffect(() => {
    if (!id || storyCache.has(id) || getSavedStory(id)) return
    const controller = new AbortController()
    const isSearch = id.startsWith('search:')
    const endpoint = isSearch ? `${API_BASE_URL}/search/story?q=${encodeURIComponent(id.slice(7))}` : `${API_BASE_URL}/stories/${id}`
    fetch(endpoint, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Unable to load this story') } return response.json() })
      .then((data) => { storyCache.set(id, data); setStory(data) })
      .catch((err) => {
        if (err.name !== 'AbortError' && !isSearch) setError(err.message)
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [id])

  const refreshLive = async () => {
    setRefreshing(true); setRefreshError('')
    try {
      const response = await fetch(`${API_BASE_URL}/stories/${id}/live`)
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Live coverage is unavailable') }
      const data = await response.json(); storyCache.set(id, data); setStory(data)
    } catch (err) { setRefreshError(err.message) } finally { setRefreshing(false) }
  }

  const retrySearch = async () => {
    setRefreshing(true); setRefreshError('')
    try {
      const query = id.slice(7)
      const response = await fetch(`${API_BASE_URL}/search/story?q=${encodeURIComponent(query)}`)
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Live analysis is unavailable') }
      const data = await response.json(); storyCache.set(id, data); setStory(data)
    } catch { setRefreshError('The live analysis service is unavailable. The saved parts of Skeptique still work.') } finally { setRefreshing(false) }
  }

  if (loading) return <div className="app-shell"><div className="story-loading"><span className="loader" /><h1>{id?.startsWith('search:') ? 'Gathering live coverage' : 'Opening saved brief'}</h1><p>{id?.startsWith('search:') ? 'Finding articles and comparing their framing. This can take a few seconds.' : 'Loading the analysis…'}</p></div></div>
  if (error || !story) return <PageShell darkMode={darkMode} setDarkMode={setDarkMode}><main className="error-page"><span>!</span><h1>We couldn’t load this story</h1><p>{error}</p><button onClick={goHome}>Back to stories</button></main></PageShell>

  const sources = story.sources || []
  const availableModes = Object.entries(summaryModes).filter(([key]) => story.combinedSummary?.[key])
  const summary = story.combinedSummary?.[mode] || story.combinedSummary?.content || 'No summary is available.'

  return <PageShell darkMode={darkMode} setDarkMode={setDarkMode}>
    <main className={`story-page story-theme story-theme-${storyTheme}`}>
      <section className="story-hero shell">
        <button className="back-button" onClick={goHome}>← All stories</button>
        <div className="story-theme-art" aria-hidden="true"><span /><span /><span /><i /></div>
        <div className="story-theme-label">{themeLabel}</div>
        <div className="story-kicker"><span>{story.isLive ? 'LIVE COVERAGE' : 'SAVED BRIEF'}</span><span>{sources.length ? `${sources.length} sources` : 'Overview only'}</span><span>{story.lastUpdated || 'Today'}</span></div>
        <h1>{story.title || 'Untitled story'}</h1>
        <div className="tag-list centered">{story.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
        {!id.startsWith('search:') && <div className="live-refresh"><button onClick={refreshLive} disabled={refreshing}>{refreshing ? <><span className="mini-loader" /> Refreshing coverage…</> : story.isLive ? 'Refresh again' : 'Refresh with live articles'}</button><p>Because one headline is a sample size of one.</p></div>}
        {id.startsWith('search:') && story.offline && <div className="live-refresh"><button onClick={retrySearch} disabled={refreshing}>{refreshing ? <><span className="mini-loader" /> Connecting…</> : 'Try live analysis again'}</button><p>Your search is safe. Current articles will appear here when the analysis service is available.</p></div>}
        {refreshError && <div className="inline-error">{refreshError}</div>}
      </section>

      <section className="summary-panel shell">
        <div className="summary-heading"><div><span className="eyebrow">POINTS OF AGREEMENT</span><h2>Combined brief</h2></div><span className="ai-badge">AI-assisted</span></div>
        {availableModes.length > 1 && <div className="summary-tabs" role="tablist">{availableModes.map(([key, label]) => <button role="tab" aria-selected={mode === key} className={mode === key ? 'active' : ''} onClick={() => setMode(key)} key={key}>{label}</button>)}</div>}
        <p className="summary-text">{summary}</p>
        <p className="disclosure">Verify important claims in the original reporting. AI can wear uncertainty like a confidence costume.</p>
      </section>

      <section className="sources-panel shell">
        <div className="section-head"><div><span className="eyebrow">COMPARE THE COVERAGE</span><h2>Source perspectives</h2></div><p>Scores describe language intensity in the available excerpt—not political ideology or factual accuracy.</p></div>
        {sources.length ? <div className="source-grid">{sources.map((source, index) => <SourceCard source={source} onOpen={() => setSelectedSource(source)} key={source.id || index} />)}</div> : <div className="empty-panel"><h3>Context requires more than one source</h3><p>The saved brief is ready. Load live coverage before trusting a headline that arrived alone.</p>{!id.startsWith('search:') && <button onClick={refreshLive} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Bring in the receipts'}</button>}</div>}
      </section>

      <section className="blindspots-panel shell">
        <div><span className="eyebrow">QUESTIONS TO KEEP OPEN</span><h2>Potential blind spots</h2><p>Every frame crops something. These are prompts for further reading, not proof that the coverage is wrong.</p></div>
        <ol>{story.blindSpots?.items?.length ? story.blindSpots.items.map((item) => <li key={item}>{item}</li>) : <li>No specific blind spots were generated for this brief.</li>}</ol>
      </section>
    </main>
    {selectedSource && <ArticleModal source={selectedSource} onClose={() => setSelectedSource(null)} />}
  </PageShell>
}
