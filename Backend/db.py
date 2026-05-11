import sqlite3

DB_NAME = "watchlist.db"

def get_conn():
    conn = sqlite3.connect(DB_NAME)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_conn()  # erstellt und/oder öffnet die datei watchlist.db
    c = conn.cursor()   # Steuerung für SQL-Befehle


    # Universes
    c.execute("""
    CREATE TABLE IF NOT EXISTS universes (  
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        main_anime_id INTEGER
    )
    """)
    # -Erstellt die Tabelle watchlist, wenn sie noch nicht existiert90285465898917911
    # -eindeutige ID
    # -ID von AniList
    # -Anime Titel (String)
    # -aktueller Status 
    # -wie viele Episoden geschaut sind
    # -Gesamtanzahl Episoden

    # Anime Nodes
    c.execute("""
    CREATE TABLE IF NOT EXISTS anime_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        universe_id INTEGER,
        anime_id INTEGER UNIQUE,
        title TEXT,
        format TEXT,
        cover_image TEXT,
        banner_image TEXT,
        total_episodes INTEGER,
        FOREIGN KEY (universe_id) REFERENCES universes(id)
    )
    """)

    # Graph Relations
    c.execute("""
    CREATE table IF NOT EXISTS relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_node_id INTEGER,
        to_node_id INTEGER,
        relation_type TEXT
    )
    """)

    # Progress pro Node
    c.execute("""
    CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id INTEGER UNIQUE,
        watched_episodes INTEGER,
        status TEXT
    )
    """)

    conn.commit()   # schreibt Änderungen in die Datei
    conn.close()    # schliesst die DB sauber

def get_or_create_universe(name):
    conn = get_conn()
    c = conn.cursor()

    c.execute("SELECT id FROM universes WHERE name = ?", (name,))
    row = c.fetchone()

    if row:
        conn.close()
        return row[0]

    c.execute("INSERT INTO universes (name) VALUES (?)", (name,))
    conn.commit()

    universe_id = c.lastrowid
    conn.close()

    return universe_id

def add_anime_node(universe_id, anime):
    existing = get_node_by_anime_id(anime["id"])
    if existing:
        return existing

    conn = get_conn()
    c = conn.cursor()

    c.execute("""
    INSERT INTO anime_nodes (
        universe_id,
        anime_id,
        title,
        format,
        cover_image,
        banner_image,
        total_episodes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        universe_id,
        anime["id"],
        anime["title"]["romaji"],
        anime["format"],
        anime["cover"],
        anime["banner"],
        anime["episodes"]
    ))

    node_id = c.lastrowid

    c.execute("""
    INSERT INTO progress (
        node_id,
        watched_episodes,
        status
    )
    VALUES (?, 0, 'planned')
    """, (node_id,))

    conn.commit()
    conn.close()

    return node_id

def add_relation(from_node_id, to_node_id, relation_type):
    conn = get_conn()
    c = conn.cursor()

    c.execute("""
    INSERT INTO relations (from_node_id, to_node_id, relation_type)
    VALUES (?, ?, ?)
    """, (from_node_id, to_node_id, relation_type))

    conn.commit()
    conn.close()

def update_progress(node_id, progress):
    conn = get_conn()
    c = conn.cursor()

    c.execute("""
    SELECT total_episodes
    FROM anime_nodes
    WHERE id = ?
    """, (node_id,))

    row = c.fetchone()
    if not row:
        conn.close()
        return

    total = row[0]

    if total and progress >= total:
        status = "completed"
    else:
        status = "watching"

    c.execute("""
    UPDATE progress
    SET watched_episodes = ?, status = ?
    WHERE node_id = ?
    """, (progress, status, node_id))

    conn.commit()
    conn.close()

def get_universe(universe_id):
    conn = get_conn()
    c = conn.cursor()

    # nodes + progress join
    c.execute("""
    SELECT
        anime_nodes.id,
        anime_nodes.title,
        anime_nodes.format,
        anime_nodes.total_episodes,
        progress.watched_episodes,
        progress.status
    FROM anime_nodes
    LEFT JOIN progress
    ON anime_nodes.id = progress.node_id
    WHERE anime_nodes.universe_id = ?
    """, (universe_id))

    rows = c.fetchall()

    nodes = []

    for row in rows:
        status = row[5]
        nodes.append({
            "id": row[0],
            "title": row[1],
            "format": row[2],
            "episodes": row[3],
            "progress": row[4],
            "status": status,
            "color": get_status_color(status)
        })

    # relations
    c.execute("""
    SELECT
        from_node_id,
        to_node_id,
        relation_type
    FROM relations
    WHERE from_node_id IN (
        SELECT id FROM anime_nodes
        WHERE universe_id = ?
    )
    OR to_node_id IN (
        SELECT id FROM anime_nodes
        WHERE universe_id = ?
    )
    """, (universe_id, universe_id))

    relations_rows = c.fetchall()
    edges = []

    for row in relations_rows:
        edges.append({
            "source": row[0],
            "target": row[1],
            "type": row[2]
        })

    conn.close()

    stats = calculate_universe_stats(nodes)
    return {
        "nodes": nodes,
        "edges": edges,
        "stats": stats
    }

def get_node_by_anime_id(anime_id):
    conn = get_conn()
    c = conn.cursor()

    c.execute("""
    SELECT id FROM anime_nodes
    WHERE anime_id = ?
    """, (anime_id,))

    row = c.fetchone()

    conn.close()

    if row:
        return row[0]

    return None

def get_status_color(status):
    if status == "completed":
        return "green"

    if status == "watching":
        return "yellow"

    return "gray"

def get_all_universes():
    conn = get_conn()
    c = conn.cursor

    c.execute("""
    SELECT id, name, main_anime_id
    FROM universes
    """)

    rows = c.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "name": r[1],
            "main_anime_id": r[2]
        }
        for r in rows
    ]

def calculate_universe_stats(nodes):
    total_episodes = 0
    watched_episodes = 0
    completed = 0
    watching = 0
    planned = 0

    for node in nodes:
        episodes = node["episodes"] or 0
        progress = node["progress"] or 0

        total_episodes += episodes
        watched_episodes += progress

        status = node["status"]

        if status == "completed":
            completed += 1
        elif status == "watching":
            watching += 1
        else:
            planned += 1

    completion = 0

    if total_episodes > 0:
        completion = round(
            (watched_episodes / total_episodes) * 100,
            1
        )

    return {
        "completion": completion,
        "total_episodes": total_episodes,
        "watched_episodes": watched_episodes,
        "completed_count": completed,
        "watching_count": watching,
        "planned_count": planned
    }