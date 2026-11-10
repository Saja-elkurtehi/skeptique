const stories = {
  1: {
    id: 1,
    title: 'Global Technology Policy',
    tags: ['Technology', 'Innovation', 'Regulation'],
    lastUpdated: 'Saved brief',
    combinedSummary: {
      content: 'Major technology companies and regulatory bodies are evaluating new standards for data protection, AI deployment, cybersecurity resilience, and digital market competition. Discussions emphasize balancing innovation with user safety while ensuring fair practices across industries.',
    },
    blindSpots: { items: ['Long-term effects of algorithmic regulation on small developers', 'Environmental cost of large-scale data centers', 'Transparency around cross-border data sharing agreements'] },
    sources: [],
  },
  2: {
    id: 2,
    title: 'Public Health Research',
    tags: ['Health', 'Science', 'Wellness'],
    lastUpdated: 'Saved brief',
    combinedSummary: {
      content: 'Researchers are examining trends in disease prevention, early diagnostics, and new treatment technologies. Advances in wearable devices, nutrition studies, and mental health initiatives are contributing to ongoing efforts to improve population well-being.',
    },
    blindSpots: { items: ['Impact of rising healthcare costs on early detection programs', 'Gaps in research participation across different communities', 'Long-term effects of emerging digital health tools'] },
    sources: [],
  },
  3: {
    id: 3,
    title: 'Environmental Sustainability',
    tags: ['Environment', 'Sustainability', 'Science'],
    lastUpdated: 'Saved brief',
    combinedSummary: {
      content: 'New sustainability initiatives focus on reducing emissions, improving waste management, and expanding renewable energy adoption. Researchers highlight the importance of ecosystem restoration and long-term planning to address rising environmental pressures.',
    },
    blindSpots: { items: ['Potential financial barriers to large-scale renewable transitions', 'Limited discussion on biodiversity loss outside protected regions', 'Long-term monitoring gaps in environmental restoration projects'] },
    sources: [],
  },
  4: {
    id: 4,
    title: 'Consumer Safety & Standards',
    tags: ['Business', 'Safety', 'Regulation'],
    lastUpdated: 'Saved brief',
    combinedSummary: {
      content: 'Consumer protection agencies are revisiting safety standards for products ranging from household electronics to food packaging. The goal is to enhance transparency, ensure durability, and improve labeling practices that help consumers make informed choices.',
    },
    blindSpots: { items: ['Limited clarity around enforcement of new labeling rules', 'Potential for hidden manufacturing costs affecting product quality', 'Gaps in testing standards for emerging smart devices'] },
    sources: [],
  },
}

export const savedStories = Object.values(stories)
export const getSavedStory = (id) => stories[String(id)] || null

export function createSearchFallback(query) {
  const topic = decodeURIComponent(query || '').trim() || 'this topic'
  return {
    id: `search:${topic}`,
    title: `Coverage of “${topic}”`,
    tags: ['Search', 'Live analysis'],
    lastUpdated: 'Awaiting live sources',
    combinedSummary: {
      content: `Skeptique needs a connection to the analysis service to gather and compare current reporting about ${topic}. The rest of the application remains available while that service reconnects.`,
    },
    blindSpots: { items: ['Which claims are repeated across independent sources?', 'Whose perspective is quoted, and whose is absent?', 'What evidence would change the leading interpretation?'] },
    sources: [],
    offline: true,
  }
}
