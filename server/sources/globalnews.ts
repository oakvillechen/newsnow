import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

// Helper function to deduplicate titles that appear twice in a row
function deduplicateTitle(title: string): string {
  const trimmed = title.trim()
  const len = trimmed.length

  // Check for exact halves (even length)
  if (len % 2 === 0) {
    const half = len / 2
    const firstHalf = trimmed.substring(0, half)
    const secondHalf = trimmed.substring(half)
    if (firstHalf === secondHalf) {
      return firstHalf
    }
  }

  // Check for repeated suffix at various positions (handles off-by-one and variable splits)
  // Look for cases where stringA + stringA forms the title
  for (let i = Math.floor(len / 2) - 10; i <= Math.floor(len / 2) + 10; i++) {
    if (i > 10 && i < len - 10) {
      const candidate = trimmed.substring(0, i)
      const remainder = trimmed.substring(i)
      if (candidate === remainder) {
        return candidate
      }
    }
  }

  // Last resort: check if a significant portion repeats
  // Look for the pattern where the first N characters match the last N characters
  for (let n = Math.floor(len / 2); n >= len / 2 - 20 && n > 15; n--) {
    const prefix = trimmed.substring(0, n)
    const suffix = trimmed.substring(len - n)
    if (prefix === suffix && n * 2 >= len - 5) {
      // The string is essentially doubled with minimal extra chars
      return prefix
    }
  }

  return trimmed
}

export default defineSource(async () => {
  const baseURL = "https://globalnews.ca"
  const html: any = await myFetch(baseURL)
  const $ = cheerio.load(html)

  const news: NewsItem[] = []
  const seen = new Set<string>()

  // Find all article items
  $("li.c-posts__item").each((_, el) => {
    const $el = $(el)

    // Get the headline text - prioritize the visible headline from the headline link
    // Featured articles have two headline spans - one visible in headlineLink, one hidden in detailsLink
    let headlineText = ""

    // First try: Get from the main headline link (always visible)
    const headlineLink = $el.find("a.c-posts__headlineLink").first()
    if (headlineLink.length) {
      headlineText = headlineLink.find("span.c-posts__headlineText").first().text().trim()
    }

    // Second try: Get from inner link (for simpler card layouts)
    if (!headlineText) {
      const innerLink = $el.find("a.c-posts__inner").first()
      if (innerLink.length) {
        headlineText = innerLink.find("span.c-posts__headlineText").first().text().trim()
      }
    }

    // Third try: Direct span (for other layouts)
    if (!headlineText) {
      headlineText = $el.find("span.c-posts__headlineText").first().text().trim()
    }

    // Apply deduplication as safety net
    headlineText = deduplicateTitle(headlineText)

    // Get the article link
    const link = $el.find("a.c-posts__inner").attr("href")
      || $el.find("a.c-posts__headlineLink").attr("href")

    // Get time info if available
    const timeInfo = $el.find(".c-posts__info").first().text().trim()

    if (headlineText && link && !seen.has(link)) {
      seen.add(link)
      news.push({
        url: link.startsWith("http") ? link : `${baseURL}${link}`,
        title: headlineText,
        id: link,
        extra: timeInfo ? { info: timeInfo } : undefined,
      })
    }
  })

  // Also check for standalone headline links that might not be in list items
  $("a.c-posts__headlineLink, a.c-posts__inner").each((_, el) => {
    const $el = $(el)
    const link = $el.attr("href")
    let title = $el.find("span.c-posts__headlineText").first().text().trim()
      || $el.clone().children().remove().end().text().trim()

    // Deduplicate in case of double scraping
    title = deduplicateTitle(title)

    if (title && link && !seen.has(link) && title.length > 10) {
      seen.add(link)
      news.push({
        url: link.startsWith("http") ? link : `${baseURL}${link}`,
        title,
        id: link,
      })
    }
  })

  if (news.length === 0) {
    throw new Error("Cannot fetch Global News data")
  }

  return news.slice(0, 30)
})
