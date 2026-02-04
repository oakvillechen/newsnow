import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://nationalpost.com"
  const html: any = await myFetch(baseURL)
  const $ = cheerio.load(html)

  const news: NewsItem[] = []
  const seen = new Set<string>()

  // Find all article cards
  $("article.article-card").each((_, el) => {
    const $el = $(el)

    // Get the headline text
    const headlineText = $el.find(".article-card__headline").text().trim()
      || $el.find("h2, h3").first().text().trim()

    // Get the article link
    const link = $el.find("a.article-card__link").attr("href")
      || $el.find("a").first().attr("href")

    if (headlineText && link && !seen.has(link)) {
      seen.add(link)
      news.push({
        url: link.startsWith("http") ? link : `${baseURL}${link}`,
        title: headlineText,
        id: link,
      })
    }
  })

  // Also check for article card links directly
  $("a.article-card__link").each((_, el) => {
    const $el = $(el)
    const link = $el.attr("href")
    const title = $el.text().trim() || $el.attr("aria-label")

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
    throw new Error("Cannot fetch National Post data")
  }

  return news.slice(0, 30)
})
