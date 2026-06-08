# Every NBA Franchise's Entire History in One Chart

*What 76 years of basketball looks like when you plot it all at once*

---

## The Idea

I wanted to build a single chart that answers a simple question: how has every NBA franchise *actually* done across its whole history? Not this season. Not a five-year window. The whole arc, from the founding game to today.

The metric I settled on is cumulative win-loss differential: for each season, take wins minus losses, then add it to the running total. If a team finishes 50-32, that's +18 for the year. After forty seasons of +18 years, the franchise is sitting at +720. The chart shows that number as a bar height for every year of a team's existence. Up is good. Down is bad. Flat stretches are .500 mediocrity. Steep rises are dynasties.

The result looks like a geological cross-section of each franchise — you can read the eras, the dynasties, the collapses, the rebuilds.

---

## Building It

The first version of this app used static CSV files — one per franchise era, hand-scraped and committed to the repo. That worked, but it meant the data was stale the moment I pushed it, and there were 40+ CSVs cluttering the directory. I wanted something that could pull fresh data on demand.

### Scraping Basketball Reference

[Basketball Reference](https://www.basketball-reference.com) has the canonical historical record for every NBA season. Each franchise has a page at `/teams/{ABBR}/` (e.g. `/teams/BOS/` for the Celtics) with a table listing every season: year, league, wins, losses, win percentage, playoff finish.

The HTML is server-rendered, so a plain HTTP request gets you the full table. No headless browser needed. The only trick is a reasonable `User-Agent` header.

Parsing works by splitting the HTML on `</tr>` and applying a few targeted regexes per row:

```python
for row in html.split("</tr>"):
    season_m = re.search(r'data-stat="season"[^>]*>.*?(\d{4})-\d{2}', row, re.DOTALL)
    lg_m     = re.search(r'data-stat="lg_id"[^>]*>.*?<a[^>]*>([^<]+)</a>', row, re.DOTALL)
    wins_m   = re.search(r'data-stat="wins"[^>]*>(\d+)', row)
    losses_m = re.search(r'data-stat="losses"[^>]*>(\d+)', row)
    if lg_m and wins_m and losses_m and lg_m.group(1).strip() == "NBA":
        end_year = int(season_m.group(1)) + 1   # 2024-25 → 2025
        ...
```

The `lg_id` filter matters: several franchises (Spurs, Pacers, Nets, Nuggets) also have ABA seasons on their page. Filtering to `NBA` only keeps the data consistent.

### The Data

The scraper outputs a single `nba_data.json` covering all 30 current NBA franchises, including their full historical arcs:

| Entry | Covers |
|-------|--------|
| **Brooklyn Nets** | NY/NJ Americans → NY Nets → NJ Nets → Brooklyn Nets |
| **Los Angeles Clippers** | Buffalo Braves → San Diego Clippers → LA Clippers |
| **Oklahoma City Thunder** | Seattle SuperSonics → OKC Thunder |
| **Utah Jazz** | New Orleans Jazz → Utah Jazz |
| **Sacramento Kings** | Rochester Royals → Cincinnati Royals → KC Kings → Sacramento Kings |

Each entry is a list of `{year, win_loss}` objects where `win_loss` is the cumulative total through that season.

The JSON comes out to about 91 KB for all 30 franchises — small enough to fetch on load with no perceptible delay.

### The Frontend

D3.js handles the chart. Two overlapping bar series share the same axes; one renders at 85% opacity in white, the other at 45% opacity in orange. The x-axis samples every 5 or 10 years depending on how many seasons a franchise has played, keeping the tick labels readable without overcrowding.

Year alignment between franchises with different start years is handled by filling the missing early years with the "last known" cumulative value — which for years before a franchise existed is zero. This means Charlotte Hornets (founded 1989) shows zero bars from 1950 to 1988 rather than crashing when paired with the Boston Celtics.

---

## What You Can See

A few comparisons worth looking at once you open the app:

**Boston Celtics vs. Los Angeles Lakers** — the two most storied franchises. Boston leads overall, but the gap has narrowed. The Celtics' 1960s dynasty (11 titles in 13 years under Bill Russell) built a lead that the Lakers spent the following four decades gradually closing. The Lakers surged past the Celtics in cumulative wins around 2010, then the gap reversed again with Boston's recent run.

**Golden State Warriors vs. anything** — before Steph Curry arrived, the Warriors spent roughly thirty years below .500 in cumulative terms. The franchise's all-time record was *negative* as recently as 2012. The bar chart shows this dramatically: a long descent from 1975 to 2012, then a vertical ascent during the dynasty years.

**San Antonio Spurs vs. Toronto Raptors** — both are post-merger franchises that joined the NBA around the same time (Spurs in 1977, Raptors in 1996). The Spurs' bar chart is one of the steadiest rising lines in the dataset — nearly unbroken upward slope through the Pop/Duncan era. The Raptors' chart shows a flat stretch in the early 2000s, a slow rise starting around 2013, and then the 2019 championship visible as a sharp uptick.

**Memphis Grizzlies vs. Charlotte Hornets** — two franchises that have never seriously contended for a title but have had very different trajectories. Memphis trends slightly negative (the Vancouver years were rough), while Charlotte oscillates around zero.

---

## Running It

```bash
git clone https://github.com/pkseeg/nba-history-app
cd nba-history-app

# Pull fresh data (takes ~2 min, respects rate limits)
python3 scraper.py

# Serve
python3 -m http.server 8080
# open http://localhost:8080
```

The scraper runs in about 90 seconds for all 30 franchises (3-second delay between requests to avoid hammering Basketball Reference). You can scrape individual teams:

```bash
python3 scraper.py BOS LAL GSW
```

---

*Built with D3.js and Basketball Reference data. [Source on GitHub](https://github.com/pkseeg/nba-history-app).*
