// A transparent keyword heuristic, not a calibrated measure of bias.
function assessBiasSignal(article) {
  const title = article.title || '';
  const text = `${title} ${article.summary || ''}`.trim().toLowerCase();
  if (!text) return null;
  const loaded = [...new Set(text.match(/\b(shocking|disasters?|outrage(?:ous|d)?|radical(?:s)?|extrem(?:e|ist|ists)|devastat(?:ing|ed|ion)|chaos|destroy(?:s|ed|ing)?|destruction|betray(?:s|ed|ing|al)?|disgrace(?:ful)?|threat(?:s|en|ens|ened|ening)?|cris(?:is|es))\b/g) || [])];
  const certainty = [...new Set(text.match(/\b(obviously|undeniably|clearly|always|never|everyone|nobody|must)\b/g) || [])];
  const attribution = [...new Set(text.match(/\b(according to|reported|data|study|research|officials said|evidence)\b/g) || [])];
  const punctuation = Math.min(10, (title.match(/[!?]/g) || []).length * 5);
  // Attribution is evidence to inspect, not a discount on loaded wording.
  const score = Math.min(100, loaded.length * 9 + certainty.length * 6 + punctuation);
  const signals = [];
  if (loaded.length) signals.push(`Loaded-language matches: ${loaded.join(', ')}`);
  if (certainty.length) signals.push(`Certainty matches: ${certainty.join(', ')}`);
  if (punctuation) signals.push(`Headline punctuation: +${punctuation}`);
  if (!score) signals.push('No terms in this limited keyword list matched. This does not establish neutral framing.');
  if (attribution.length) signals.push(`Attribution cues (not scored): ${attribution.join(', ')}`);
  return { score, label: score === 0 ? 'No matches' : score < 25 ? 'Low' : score < 50 ? 'Moderate' : score < 75 ? 'Elevated' : 'High', signals, methodology: 'language-framing-v2' };
}

module.exports = { assessBiasSignal };
