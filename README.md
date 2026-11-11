# Anime Watchlist

A personal anime watchlist application built around the concept of **anime universes** — because most existing watchlists don't support the way I actually want to track anime.

Instead of managing individual series in isolation, Anime Watchlist groups related entries (main series, sequels, OVAs, movies, spin-offs) into a single **universe view**, giving you a complete picture of everything connected to an anime.

> Inspired by the relation graphs on [anisearch.de](https://anisearch.de).

## Notes

This is a personal side project and I work on it irregularly. Development happens on the `main` branch.

---

## Concept

Most watchlists treat anime as flat lists. Anime Watchlist treats them as **universes**: when you add *Naruto*, you also get *Shippuden*, the OVAs, the movies, and *Boruto* — all in one place, with their relationships visualized as a graph.

---

## How It Works

1. Type an anime name into the search field — suggestions (top 5, with cover, format and year) appear while you type
2. Pick a result and **name the universe** (you choose the name, so a prequel set in the past or a different entry point can still end up in the universe you want)
3. If the anime is already part of an existing universe, the app tells you and links to it instead of importing it twice
4. The app fetches the anime from AniList and recursively crawls all related entries, then saves everything as a **universe** in a local SQLite database
5. The home page lists all universes with cover, status (planned / watching / completed) and completion percentage
6. The universe page shows:
   - Name, cover and stats (completion %, watched episodes, counts by status)
   - A relation graph with color-coded status — click a node to jump to its bar
   - The **main story** (sequels / prequels) as individual bars, with side stories, OVAs, movies and specials grouped by format underneath
   - Per entry: cover, format, progress, a **+ Episode** button, a **Skip** button, expandable episode boxes and grouped relation links

### Colors

| Color | Meaning |
|---|---|
| Gray | Planned |
| Yellow | Watching |
| Green | Completed |
| Blue | Skipped (does not count towards the universe stats) |

### What gets imported

The crawl follows sequels, prequels, side stories, spin-offs and alternatives. It ignores `CHARACTER`, `OTHER`, `CONTAINS` and `COMPILATION` relations (otherwise unrelated series that merely share a character get pulled in) and skips everything you can't watch: manga, novels, one-shots, music, manhwa and manhua.

---

## Features

| Feature | Status |
|---|---|
| Search anime via AniList API with live suggestions | ✅ Done |
| Import full universe (recursive relation crawl) | ✅ Done |
| Custom universe naming | ✅ Done |
| Duplicate check (anime already in another universe) | ✅ Done |
| Universe overview with status, completion % and covers | ✅ Done |
| Universe page with stats | ✅ Done |
| Relation graph with watch-status coloring | ✅ Done |
| Clickable graph nodes → jump to anime bar | ✅ Done |
| Episode-level tracking (episode boxes and + Episode) | ✅ Done |
| Main story vs. specials grouped by format | ✅ Done |
| Relations grouped into categories per entry | ✅ Done |
| Skip entries (excluded from stats) | ✅ Done |
| Delete universe | ✅ Done |
| Backup export / import (JSON) | ✅ Done |
| API hardening (rate limit, error messages when AniList is down) | 📋 Planned |
| Watchlist for future animes: one collapsible tile per franchise, sequels get attached to the existing tile | 📋 Planned |
| Toggle between universes and watchlist on the home page | 📋 Planned |
| Update a universe when new media is released | 📋 Planned |
| "Coming soon" banner for upcoming releases | 📋 Planned |
| Graph improvements | 📋 Planned |

---

## Getting Started

You only need Docker and Docker Compose.

```bash
git clone https://github.com/Platinum-Hoshi/Anime_watchlist.git
cd Anime_watchlist
docker-compose up --build
```

Then open `http://localhost:5173` (or `http://<server-ip>:5173` if it runs on another machine).

- The frontend forwards all API calls from `/api` to the backend container, so no IP address needs to be configured. The same applies behind a reverse proxy or a Cloudflare Tunnel — only the frontend (port 5173) has to be reachable.
- The backend API docs are available at `http://localhost:8000/docs` when the port is accessible.
- The database is stored locally in `Backend/watchlist.db` and is not part of the repository.

### Backup

Use **Backup erstellen** on the home page to download all data as a JSON file. **Backup laden** restores it and **replaces** all current data. Use it before updating or moving the app to another machine.

---

## Known Limitations

- **AniList availability:** The AniList API has been running in a degraded state (about 30 requests per minute instead of the documented 90) and is occasionally switched off completely (HTTP 403 "temporarily disabled"). When that happens, searching and importing don't work until AniList is back. Large universes take a while to import.
- **No login:** The app has no authentication. If you expose it to the internet, put it behind something like Cloudflare Access or a reverse proxy with auth — anyone with access can delete universes or replace all data via the backup import.

---

## Tech Stack

**Backend**
- Python / FastAPI
- SQLite (via `sqlite3`)
- AniList GraphQL API

**Frontend**
- React
- Cytoscape.js (relation graph)
- Vite (dev server with API proxy)

**Infrastructure**
- Docker / Docker Compose
