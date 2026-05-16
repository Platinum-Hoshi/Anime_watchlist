from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from anilist import (
    get_anime,
    get_anime_by_id
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
    get_all_universes
)

app = FastAPI() # API gestartet

@app.on_event("startup")   # Funktion aufrufen
def startup():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProgressUpdate(BaseModel):
    progress: int

class CreateUniverse(BaseModel):
    query: str

@app.get("/search") # Daten Lesen (wenn /serach geöffnet wird)
def search_anime(query: str):   # Funktion bekommt einen Parameter (Anime-name)
    return get_anime(query)

@app.post("/universe/create")
def create_universe(data: CreateUniverse):
    anime = get_anime(data.query)
    universe_name = anime["title"]["romaji"]
    universe_id = get_or_create_universe(universe_name)

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
    
    graph = anime["graph"]
    node_map = {}

    #nodes speichern
    for node in graph["nodes"]:
        node_id = add_anime_node(universe_id, {
            "id": node["id"],
            "title": {
                "romaji": node["title"] if isinstance(node["title"], str) else node["title"].get("romaji", "")
            },
            "format": node["format"],
            "episodes": node["episodes"]
        })

        node_map[node["id"]] = node_id

    # relations speichern
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
