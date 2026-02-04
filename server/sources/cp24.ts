import type { SourceGetter } from "#/types"

// CP24 no longer provides accessible RSS feeds
// Their feed endpoint is unreachable (connection reset)
// Users should rely on CityNews Toronto or other Toronto sources
export default (async () => {
  console.warn("CP24 RSS feed is no longer accessible")
  return []
}) as SourceGetter
