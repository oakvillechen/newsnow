import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://www.thestar.com"
  const html: any = await myFetch(baseURL)
  const $ = cheerio.load(html)

  const news: NewsItem[] = []
  const seen = new Set<string>()

  // Find all article containers
  $("article.tnt-asset-type-article").each((_, el) => {
    const $el = $(el)

    // Get the headline text
    const headlineText = $el.find(".tnt-headline").text().trim()
      || $el.find("h1, h2, h3, h4").first().text().trim()

    // Get the article link
    const link = $el.find("a.tnt-asset-link").attr("href")
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

  // Also check for tnt-headline links directly
  $(".tnt-headline a, a.tnt-asset-link").each((_, el) => {
    const $el = $(el)
    const link = $el.attr("href")
    const title = $el.text().trim()

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
    throw new Error("Cannot fetch Toronto Star data")
  }

  return news.slice(0, 30)
})
