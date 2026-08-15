from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from anilist import (
    get_anime,
    get_anime_by_id,
    search_anime_list
)
from db import (
    init_db,
    get_or_create_universe,
    add_anime_node,
    add_relation,
    update_progress,
    get_universe,
    get_node,
    get_node_by_anime_id,
    get_all_universes,
    update_node_cover,
    delete_universe,
    find_anime_in_universes,
    toggle_skip
)

app = FastAPI() # API gestartet

@app.on_event("startup")   # Funktion aufrufen
def startup():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProgressUpdate(BaseModel):
    progress: int

class CreateUniverse(BaseModel):
    query: str
    universe_name: str

@app.get("/search") # Daten Lesen (wenn /serach geöffnet wird)
def search_anime(query: str):   # Funktion bekommt einen Parameter (Anime-name)
    return get_anime(query)

@app.get("/search/list")
def search_list(query: str):
    return {"results": search_anime_list(query)}

@app.get("/search/relations")
def search_relations(query: str):
    anime = get_anime(query)
    if not anime:
        return {"main": None, "chain": []}

    chain = []
    for edge in anime["graph"]["edges"]:
        rel_type = edge["relation_type"]
        if rel_type in ["SEQUEL", "PREQUEL"]:
            node = next(
                (n for n in anime["graph"]["nodes"] if n["id"] == edge["target"]),
                None
            )
            if node:
                title = node["title"] if isinstance(node["title"], str) else (
                    node["title"].get("english") or node["title"].get("romaji", "")
                )

                chain.append({
                    "id": node["id"],
                    "title": title,
                    "relation_type": rel_type
                })

        return {
            "main": {
                "id": anime["id"],
                "title": anime["title"]["english"] or anime["title"]["romaji"],
            },
            "chain": chain
        }

@app.post("/universe/create")
def create_universe(data: CreateUniverse):
    anime = get_anime(data.query)
    universe_id = get_or_create_universe(data.universe_name, anime.get("cover"))

    import_recrusive_universe(
        universe_id,
        anime["id"]
    )

    return {
        "message": "universe imported",
        "universe_id": universe_id
    }

@app.get("/universe/{universe_id}") # Daten lesen
def universe(universe_id: int):
    return get_universe(universe_id)

@app.patch("/node/{node_id}/progress") # bestehende Daten ändern
def change_progress(node_id: int, data: ProgressUpdate):
    update_progress(node_id, data.progress)

    return {    # Antwort an User
        "message": "progress updated",
        "node_id": node_id,
        "progress": data.progress
    }

def import_recrusive_universe(
    universe_id,
    anime_id,
    visited=None
):
    if visited is None:
        visited = set()

    if anime_id in visited:
        return

    visited.add(anime_id)
    anime = get_anime_by_id(anime_id)

    if anime is None:
        return
    
    update_node_cover(anime_id, anime.get("cover"))

    graph = anime["graph"]
    node_map = {}

    #nodes speichern
    for node in graph["nodes"]:
        node_id = add_anime_node(universe_id, {
            "id": node["id"],
            "title": {
                "english": node["title"] if isinstance(node["title"], str) else node["title"].get("english", ""),
                "romaji": node["title"] if isinstance(node["title"], str) else node["title"].get("romaji", "")
            },
            "format": node["format"],
            "episodes": node["episodes"],
            "cover": node.get("cover")
        })

        node_map[node["id"]] = node_id

    # relations speichern
    SKIP_RELATIONS = {"CHARACTER", "OTHER", "CONTAINS", "COMPILATION"}
    EXECLUDE_FORMATS = {"MANGA", "NOVEL", "ONE_SHOT", "MUSIC", "MANHWA", "MANHUA"}

    for edge in graph["edges"]:
        source_id = node_map.get(edge["source"])
        target_id = node_map.get(edge["target"])

        if source_id and target_id:
            add_relation(
                source_id,
                target_id,
                edge["relation_type"]
            )

        # recursive crawl
        if edge["relation_type"] in SKIP_RELATIONS:
            continue

        target_node = next(
            (n for n in graph["nodes"] if n["id"] == edge["target"]),
            None
        )
        target_format = (target_node or {}).get("format") or ""

        if target_format.upper() in EXECLUDE_FORMATS:
            continue

        import_recrusive_universe(
            universe_id,
            edge["target"],
            visited
        )

@app.get("/universes")
def universes():
    return {
        "universes": get_all_universes()
    }

@app.get("/nodes/{node_id}")
def node(node_id: int):
    return get_node(node_id)

@app.delete("/universe/{universe_id}")
def remove_universe(universe_id: int):
    delete_universe(universe_id)
    return {"message": "universe deleted", "universe_id": universe_id}

@app.get("/search/exists")
def check_anime_exists(anime_id: int):
    result = find_anime_in_universes(anime_id)
    return {"exists": result is not None, "universe": result}

@app.patch("/node/{node_id}/skip")
def skip_node(node_id: int);
    toggle_skip(node_id)
    return {"message": "skip toggled", "node_id": node_id}
