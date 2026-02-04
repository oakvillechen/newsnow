import type { SourceGetter } from "#/types"

// CTV News no longer provides RSS feeds as of 2024
// This fetcher returns an empty array to prevent errors
// Users should rely on other Canadian news sources like CBC
export default (async () => {
  console.warn("CTV News no longer provides RSS feeds")
  return []
}) as SourceGetter
