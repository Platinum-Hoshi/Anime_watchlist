import re
import requests

ANILIST_URL = "https://graphql.anilist.co"

def clean_description(text):
    if not text:
        return None
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return text.strip() or None

def format_date(date):
    """AniList liefert {year, month, day}, einzelne Teile können fehlen."""
    if not date or not date.get("year"):
        return None
    if date.get("month") and date.get("day"):
        return f"{date['day']:02d}.{date['month']:02d}.{date['year']}"
    return str(date["year"])

def get_anime(name: str):
    query = """
    query ($search: String) {
        Media(search: $search, type: ANIME) {
            id
            title {
                native
                romaji
                english
            }
            coverImage {
                large
                medium
            }
            bannerImage
            seasonYear
            status
            format
            description
            genres
            episodes

            relations {
                edges {
                    relationType
                    id
                    node {
                        id
                        format
                        title {
                            native
                            romaji
                            english
                            }
                        episodes
                        }
                    }
                }
        }
    }
    """

    variables = {
    "search": name
    }

    response = requests.post(
        ANILIST_URL,
        json={
            "query": query,
            "variables": variables
        }
    )

    data = response.json()

    anime = data["data"]["Media"]

    graph = build_graph(anime)

    return format_anime(anime, graph)

def get_anime_by_id(anime_id: int):
    query = """
    query ($id: Int) {
        Media(id: $id, type: ANIME) {
            id
            title {
                native
                romaji
                english
            }
            seasonYear
            status
            format
            description
            genres
            episodes
            coverImage {
                large
                medium
            }
            bannerImage
            relations {
                edges{
                    relationType
                    node {
                        id
                        format
                        title {
                            native
                            romaji
                            english
                        }
                        episodes
                    }
                }
            }
        }
    }
    """

    response = requests.post(
        ANILIST_URL,
        json={
            "query": query,
            "variables": {
                "id": anime_id
            }
        }
    )

    data = response.json()

    if not data.get("data"):
        return None

    anime = data["data"]["Media"]

    if anime is None:
        return None

    graph = build_graph(anime)
    return format_anime(anime, graph)

def format_anime(anime, graph):
    return {
        "id": anime["id"],
        "title": {
            "romaji": anime["title"]["romaji"],
            "english": anime["title"]["english"],
            "native": anime["title"]["native"],
        },
        "cover": (anime.get("coverImage") or {}).get("large"),
        "banner": anime.get("bannerImage"),
        "year": anime["seasonYear"],
        "status": anime["status"],
        "format": anime["format"],
        "episodes": anime["episodes"],
        "genres": anime["genres"],
        "description": anime["description"],
        "graph": graph
    }

def build_graph(anime):
    nodes = []
    edges = []

    # main anime node
    main_node = {
        "id": anime["id"],
        "title": anime["title"].get("english") or anime["title"].get("romaji", ""),
        "format": anime["format"],
        "episodes": anime["episodes"],
        "cover": (anime.get("coverImage") or {}).get("large"),
        "main": True
    }

    nodes.append(main_node)

    #relations
    for edge in anime["relations"]["edges"]:
        relation_type = edge["relationType"]
        node = edge["node"]

        relation_node = {
            "id": node["id"],
            "title": node["title"],
            "format": node["format"],
            "episodes": node["episodes"],
            "cover": None,
            "main": False
        }

        nodes.append(relation_node)

        edges.append({

            "source": anime["id"],
            "target": node["id"],
            "relation_type": relation_type
        })

    return {
        "nodes": nodes,
        "edges": edges
    }

def search_anime_list(name: str):
    query = """
    query ($search: String) {
        Page(page: 1, perPage: 10) {
            media(search: $search, type: ANIME) {
                id
                title {
                    romaji
                    english
                }
                coverImage {
                    large
                }
                format
                seasonYear
                status
                episodes
                description(asHtml: false)
                startDate {
                    year
                    month
                    day
                }
            }
        }
    }
    """

    response = requests.post(
        ANILIST_URL,
        json={"query": query, "variables": {"search": name}}
    )

    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text[:500])
    data = response.json()

    if not data.get("data"):
        return[]

    media = data["data"]["Page"]["media"]

    return [
        {
            "id": m["id"],
            "title": m["title"]["english"] or m["title"]["romaji"],
            "cover": (m.get("coverImage") or {}).get("large"),
            "format": m["format"],
            "year": m["seasonYear"],
            "status": m.get("status"),
            "episodes": m.get("episodes"),
            "description": clean_description(m.get("description")),
            "start_date": format_date(m.get("startDate"))
        }
        for m in media
    ]
