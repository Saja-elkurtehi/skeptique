const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://saja-elkurtehi.github.io',
  process.env.FRONTEND_URL,
].filter(Boolean));

app.disable("x-powered-by");

app.use(cors({
  origin(origin, callback) {
    const isLocalPreview = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || allowedOrigins.has(origin) || isLocalPreview) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: "100kb" }));

const localStories = require("./data/stories.json");

/* -------------------------------------------------------
   CACHING
------------------------------------------------------- */
const STORY_TTL = 1000 * 60 * 30; // 30 min
const storyCache = new Map(); // hash -> { data, timestamp }

/* -------------------------------------------------------
   AI CALL (Gemini via OpenRouter)
------------------------------------------------------- */
async function callGemini(prompt, temperature = 0.2) {
  if (!OPENROUTER_API_KEY) return null;

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.5-pro",
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Skeptique",
        },
        timeout: 7000,
      }
    );

    const msg = res.data.choices?.[0]?.message?.content;
    if (!msg) return null;

    return typeof msg === "string"
      ? msg.trim()
      : msg.map((p) => p.text).join(" ").trim();
  } catch (err) {
    console.error("Gemini Error:", err.response?.data || err.message);
    return null;
  }
}

/* -------------------------------------------------------
   NEWS FETCH
------------------------------------------------------- */
async function fetchArticles(topic) {
  if (!NEWS_API_KEY) return [];

  const res = await axios.get("https://newsapi.org/v2/everything", {
    params: {
      q: topic,
      language: "en",
      sortBy: "relevancy",
      pageSize: 8,
      apiKey: NEWS_API_KEY,
    },
    timeout: 10000,
  });

  return (res.data.articles || []).map((a, i) => ({
    id: `newsapi-${i}`,
    name: a.source?.name || "Unknown",
    title: a.title || "Untitled",
    summary: a.description || a.content || "",
    url: a.url,
    imageUrl: a.urlToImage || null,
  }));
}

/* -------------------------------------------------------
   CHEAP HEURISTIC TONE + FRAME
------------------------------------------------------- */
function inferTone(summary) {
  const s = summary.toLowerCase();
  if (/(crisis|threat|danger|urgent|collapse)/.test(s)) return "Alarmist";
  if (/(breakthrough|progress|improve|success)/.test(s)) return "Optimistic";
  if (/(study|analysis|report|data)/.test(s)) return "Analytical";
  return "Neutral";
}

function inferFrame(summary) {
  const s = summary.toLowerCase();
  if (/(law|regulation|policy|government|election)/.test(s)) return "Political";
  if (/(economy|market|cost|industry|business)/.test(s)) return "Economic";
  if (/(health|civilian|rights|community)/.test(s)) return "Humanitarian";
  if (/(security|defense|cyber|attack)/.test(s)) return "Security";
  return "Other";
}

const { assessBiasSignal } = require('../frontend/src/lib/framing.cjs');

function annotateArticles(articles) {
  articles.forEach((article) => {
    article.tone = inferTone(article.summary || "");
    article.frame = inferFrame(`${article.title || ""} ${article.summary || ""}`);
    article.bias = assessBiasSignal(article);
  });
}

function fallbackSynthesis(topic, articles) {
  const usable = articles.filter((article) => article.summary).slice(0, 3);
  const frames = [...new Set(articles.map((article) => article.frame).filter((frame) => frame && frame !== "Other"))];
  const coverageNote = frames.length
    ? `The coverage emphasizes ${frames.slice(0, 3).join(", ").toLowerCase()} dimensions.`
    : "The available excerpts do not share one clearly dominant frame.";
  const evidence = usable.map((article) => `${article.name} reports that ${article.summary.replace(/[.!?]+$/, "")}`).join("; ");

  return {
    summary: {
      content: evidence
        ? `Current reporting on ${topic} includes several distinct developments: ${evidence}. ${coverageNote}`
        : `Current reporting on ${topic} is available below. ${coverageNote}`,
      oneSentence: usable[0] ? `${usable[0].summary} ${coverageNote}` : null,
      eli5: `Different outlets are highlighting different parts of ${topic}; compare the source cards below to see where their emphasis changes.`,
      dataOnly: "Review the linked articles for figures and primary evidence; automated extraction was unavailable for this refresh.",
      politicalAngle: frames.includes("Political") ? "At least one available excerpt emphasizes policy, government, or regulation." : "No strong political frame was detected in the available excerpts.",
      humanitarianAngle: frames.includes("Humanitarian") ? "At least one available excerpt emphasizes effects on people or communities." : "No strong humanitarian frame was detected in the available excerpts.",
    },
    blindSpots: [
      "The available excerpts may omit important context from the full articles",
      "Source availability may overrepresent outlets indexed by the news provider",
      "Claims repeated across outlets may still originate from the same underlying source",
    ],
    labels: [],
  };
}

/* -------------------------------------------------------
   SEMANTIC HASH (for caching)
------------------------------------------------------- */
function articleHash(articles) {
  return crypto
    .createHash("sha1")
    .update(articles.map((a) => a.title + a.name).join("|"))
    .digest("hex");
}

/* -------------------------------------------------------
   SINGLE AI CALL: summary + blind spots + fallback tone/frame
------------------------------------------------------- */
  async function aiSynthesize(topic, articles) {
    const text = articles
      .map(
        (a, i) =>
          `Article ${i + 1} (${a.name}): ${a.title}\n${a.summary || "No summary"}`
      )
      .join("\n\n");

    const prompt = `
  You are a media analyst.

  Analyze reporting on "${topic}".

  Return STRICT JSON ONLY. No commentary. No markdown.

  Schema:
  {
    "summary": {
      "content": "2–4 neutral sentences",
      "oneSentence": "Exactly one sentence",
      "eli5": "A plain-language explanation for a general audience",
      "dataOnly": "Only concrete figures and verifiable claims, or a note that none are available",
      "politicalAngle": "The key political or policy implications",
      "humanitarianAngle": "The key effects on people and communities"
    },
    "blindSpots": ["item 1","item 2","item 3"],
    "labels": [
      {"id":"newsapi-0","tone":"Neutral","frame":"Political"}
    ]
  }

  Articles:
  ${text}
  `;

    const raw = await callGemini(prompt, 0.2);

    if (!raw) {
      console.warn("AI returned nothing; using source-based fallback");
      return fallbackSynthesis(topic, articles);
    }

    console.log("🧠 RAW AI OUTPUT:\n", raw);

    // 🔒 Defensive JSON extraction
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn("No JSON object found in AI output");
      return fallbackSynthesis(topic, articles);
    }

    try {
      return JSON.parse(match[0]);
    } catch (err) {
      console.error("AI JSON parse failed:", err.message);
      return fallbackSynthesis(topic, articles);
    }
  }


/* -------------------------------------------------------
   ROUTES
------------------------------------------------------- */

app.get("/", (_, res) => {
  res.json({ message: "Skeptique backend running", status: "ok" });
});

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    newsConfigured: Boolean(NEWS_API_KEY),
    aiConfigured: Boolean(OPENROUTER_API_KEY),
  });
});

/* LANDING — NO AI */
app.get("/stories", (_, res) => {
  res.json(
    Object.values(localStories).map((s) => ({
      id: s.id,
      title: s.title,
      tags: s.tags,
      sourcesCount: s.sourcesCount ?? s.sources?.length ?? 0,
      lastUpdated: s.lastUpdated,
    }))
  );
});

/* SAVED STORY VIEW — instant, with no external calls */
app.get("/stories/:id", (req, res) => {
  const story = localStories[req.params.id];
  if (!story) return res.status(404).json({ error: "Not found" });

  res.json({ ...story, isLive: false });
});

/* OPTIONAL LIVE REFRESH */
app.get("/stories/:id/live", async (req, res) => {
  const story = localStories[req.params.id];
  if (!story) return res.status(404).json({ error: "Not found" });

  let articles = [];
  try {
    articles = await fetchArticles(story.title);
  } catch (err) {
    console.error("News fetch failed; returning saved story:", err.message);
  }
  if (!articles.length) {
    return res.status(503).json({
      error: NEWS_API_KEY
        ? "No recent articles were found for this topic"
        : "Live coverage is not configured on this server",
    });
  }

  const hash = articleHash(articles);
  const cached = storyCache.get(hash);

  if (cached && Date.now() - cached.timestamp < STORY_TTL) {
    return res.json(cached.data);
  }

  annotateArticles(articles);

  const ai = await aiSynthesize(story.title, articles);

  // AI fallback refinement
  if (ai?.labels) {
    const map = new Map(ai.labels.map((l) => [l.id, l]));
    articles.forEach((a) => {
      if (map.has(a.id)) {
        a.tone = map.get(a.id).tone;
        a.frame = map.get(a.id).frame;
      }
    });
  }

  const result = {
    ...story,
    isLive: true,
    sourcesCount: articles.length,
    sources: articles,
    lastUpdated: "Just now",
    combinedSummary: {
      ...story.combinedSummary,
      content: ai?.summary?.content || story.combinedSummary?.content || "Not available",
      oneSentence: ai?.summary?.oneSentence || null,
      eli5: ai?.summary?.eli5 || null,
      dataOnly: ai?.summary?.dataOnly || null,
      politicalAngle: ai?.summary?.politicalAngle || null,
      humanitarianAngle: ai?.summary?.humanitarianAngle || null,
    },
    blindSpots: {
      items: ai?.blindSpots?.length ? ai.blindSpots : story.blindSpots?.items || [],
    },
  };

  storyCache.set(hash, {
    data: result,
    timestamp: Date.now(),
  });

  res.json(result);
});
/* -------------------------------------------------------
   SEARCH STORY — WITH AI SYNTHESIS
------------------------------------------------------- */
app.get("/search/story", async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 120);

  if (q.length < 2) {
    return res.status(400).json({ error: "Query too short" });
  }

  try {
    // 1. Fetch articles
    const articles = await fetchArticles(q);

    if (!articles.length) {
      return res.status(503).json({
        error: NEWS_API_KEY
          ? "No recent articles were found for that topic"
          : "Live search is not configured on this server",
      });
    }

    // 2. Hash for caching
    const hash = articleHash(articles);
    const cached = storyCache.get(hash);

    if (cached && Date.now() - cached.timestamp < STORY_TTL) {
      return res.json(cached.data);
    }

    // 3. Transparent language and framing signals
    annotateArticles(articles);

    // 4. AI synthesis (summary + blind spots + per-article labels)
    const ai = await aiSynthesize(q, articles);

    if (ai?.labels) {
      const map = new Map(ai.labels.map((l) => [l.id, l]));
      articles.forEach((a) => {
        if (map.has(a.id)) {
          a.tone = map.get(a.id).tone;
          a.frame = map.get(a.id).frame;
        }
      });
    }

    // 5. Final response (MATCHES StoryView EXPECTATIONS)
    const result = {
      id: `search:${q}`,
      title: q,
      tags: ["Search"],
      sourcesCount: articles.length,
      sources: articles,
      lastUpdated: "Live",
      isLive: true,
      combinedSummary: {
        content:
          ai?.summary?.content ||
          "This topic was generated from a live search across multiple news outlets.",
        oneSentence: ai?.summary?.oneSentence || null,
        eli5: ai?.summary?.eli5 || null,
        dataOnly: ai?.summary?.dataOnly || null,
        politicalAngle: ai?.summary?.politicalAngle || null,
        humanitarianAngle: ai?.summary?.humanitarianAngle || null,
      },
      blindSpots: {
        items: ai?.blindSpots || [],
      },
    };

    // 6. Cache it
    storyCache.set(hash, {
      data: result,
      timestamp: Date.now(),
    });

    res.json(result);
  } catch (err) {
    console.error("Search story AI error:", err.message);
    res.status(502).json({ error: "The news service is temporarily unavailable" });
  }
});

app.use((err, _req, res, _next) => {
  console.error("Request error:", err.message);
  res.status(500).json({ error: "The server could not process this request" });
});



/* -------------------------------------------------------
   START SERVER
------------------------------------------------------- */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Skeptique backend running at http://localhost:${PORT}`);
  });
}

module.exports = app;
module.exports._internal = { inferTone, inferFrame, assessBiasSignal, articleHash, fallbackSynthesis };
