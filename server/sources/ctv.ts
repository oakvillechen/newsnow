import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

// CTV News no longer provides RSS feeds, scraping HTML instead
export default defineSource(async () => {
  const baseURL = "https://www.ctvnews.ca"
  const html: any = await myFetch(baseURL)
  const $ = cheerio.load(html)

  const news: NewsItem[] = []
  const seen = new Set<string>()

  // Find all article links on the homepage
  $("a[href*='/article/'], a[href*='/photos/']").each((_, el) => {
    const $el = $(el)
    const link = $el.attr("href")
    const title = $el.text().trim()

    // Filter out navigation links, empty titles, and very short titles
    if (
      title
      && link
      && !seen.has(link)
      && title.length > 20
      && !link.includes("/video/")
      && !title.toLowerCase().includes("opens in new window")
    ) {
      seen.add(link)
      news.push({
        url: link.startsWith("http") ? link : `${baseURL}${link}`,
        title,
        id: link,
      })
    }
  })

  if (news.length === 0) {
    throw new Error("Cannot fetch CTV News data")
  }

  return news.slice(0, 30)
})
