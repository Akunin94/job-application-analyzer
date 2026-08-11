/**
 * Claude models sometimes wrap JSON responses in markdown code fences
 * (```json ... ```) despite being instructed not to. Strip that wrapper
 * before parsing.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return JSON.parse(fenced[1]);

  // Opening fence with no closing one — the response was cut off mid-generation.
  // Parse the body anyway so the error names the real problem (truncated JSON)
  // instead of the stray backticks.
  const unclosed = trimmed.match(/^```(?:json)?\s*([\s\S]*)$/);
  if (unclosed) return JSON.parse(unclosed[1]);

  return JSON.parse(trimmed);
}
