# Anime Watchlist

A personal anime watchlist application built around the concept of **anime universes** — because most existing watchlists don't support the way I actually want to track anime.

Instead of managing individual series in isolation, Anime Watchlist groups related entries (main series, sequels, OVAs, movies, spin-offs) into a single **universe view**, giving you a complete picture of everything connected to an anime.

> Inspired by the relation graphs on [anisearch.de](https://anisearch.de).

## Notes

This is a personal side project and I work on it irregularly. The current active branch for frontend improvements is `claude.ai-frontend-improvement`.

---

## Concept

Most watchlists treat anime as flat lists. Anime Watchlist treats them as **universes**: when you add *Naruto*, you also get *Shippuden*, the OVAs, the movies, and *Boruto* — all in one place, with their relationships visualized as a graph.

---

## How It Works

1. Search for an anime by name
2. The app fetches the anime from AniList and recursively crawls all related entries (sequels, prequels, OVAs, movies, etc.)
3. Everything gets saved as a **universe** in a local SQLite database
4. The universe page shows:
   - Stats (completion %, watched episodes, counts by status)
   - A relation graph with color-coded watch status (planned / watching / completed)
   - Expandable bars for each entry — check off individual episodes or hit **+** for the next one
   - Relation links between entries — click to jump to the related bar

---

## Features (current & planned)

| Feature | Status |
|---|---|
| Search anime via AniList API | ✅ Done |
| Import full universe (recursive relation crawl) | ✅ Done |
| Universe overview with stats | ✅ Done |
| Relation graph with watch-status coloring | 🔄 In progress |
| Episode-level tracking (check off individual episodes) | 🔄 In progress |
| Clickable graph nodes → jump to anime bar | 🔄 In progress |
| Watchlist for future animes (planned / want to watch) | 📋 Planned |
| Overview of all universes / currently watching | 📋 Planned |

---

## Tech Stack

**Backend**
- Python / FastAPI
- SQLite (via `sqlite3`)
- AniList GraphQL API

**Frontend**
- React
- Cytoscape.js (relation graph)
- Vite

**Infrastructure**
- Docker / Docker Compose
