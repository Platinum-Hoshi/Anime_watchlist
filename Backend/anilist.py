import requests

ANILIST_URL = "https://graphql.anilist.co"

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
        "title": anime["title"]["romaji"],
        "format": anime["format"],
        "episodes": anime["episodes"],
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
        Page(page: 1, perPage: 5) {
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
            }
        }
    }
    """

    response = requests.post(
        ANILIST_URL,
        json={"query": query, "variables": {"search": name}}
    )

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
            "year": m["seasonYear"]
        }
        for m in media
    ]

