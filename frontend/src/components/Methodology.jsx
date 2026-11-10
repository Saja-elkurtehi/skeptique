import { PageShell } from './Layout'

export default function Methodology({ darkMode, setDarkMode }) {
  return <PageShell darkMode={darkMode} setDarkMode={setDarkMode}>
    <main className="method-page">
      <section className="method-hero shell"><span className="eyebrow">METHODOLOGY</span><h1>How Skeptique<br />reads the coverage</h1><p>The goal is not to calculate truth or assign an ideology to a publication. It is to make differences in language, framing, and emphasis easier to inspect.</p><aside className="method-aside"><strong>Fine print, because certainty is suspicious.</strong><span>If a media-analysis tool claims it has eliminated bias, check what it is selling.</span></aside></section>
      <section className="method-flow shell">
        <article><span>01</span><div><h2>Gather recent reporting</h2><p>Live analysis requests up to eight relevant English-language articles through NewsAPI. Saved briefs remain available immediately and do not wait for outside services.</p></div></article>
        <article><span>02</span><div><h2>Identify the primary frame</h2><p>A transparent keyword heuristic classifies the excerpt’s dominant frame—such as political, economic, humanitarian, or security. “Other” means no supported frame clearly dominates.</p></div></article>
        <article><span>03</span><div><h2>Measure framing intensity</h2><p>The 0–100 signal counts emotionally loaded terms, absolute claims, punctuation, and evidence or attribution cues in the available headline and excerpt. It measures language intensity, not left–right political ideology.</p><div className="scale-explainer"><span><i className="low" />0–24 Low</span><span><i className="moderate" />25–49 Moderate</span><span><i className="elevated" />50–74 Elevated</span><span><i className="high" />75–100 High</span></div></div></article>
        <article><span>04</span><div><h2>Synthesize points of agreement</h2><p>An AI model produces a combined summary and suggests possible blind spots. This output is a reading aid, not a fact-check, and should be verified against the linked articles.</p></div></article>
      </section>
      <section className="limitations shell"><div><span className="eyebrow">IMPORTANT LIMITATIONS</span><h2>What the signals cannot tell you</h2></div><ul><li>An article excerpt may not represent the complete article.</li><li>Low-intensity language does not guarantee factual accuracy.</li><li>High-intensity language can be appropriate for serious events.</li><li>Keyword classification can miss irony, context, and domain-specific language.</li><li>Source selection depends on the availability and ranking of the news provider.</li></ul></section>
    </main>
  </PageShell>
}
