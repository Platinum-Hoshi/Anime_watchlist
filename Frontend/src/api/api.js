const BASE_URL = "http://192.168.36.163:8000";

export async function getUniverses() {
    const res = await fetch(`${BASE_URL}/universes`);
    return res.json();
}

export async function getUniverse(id) {
    const res = await fetch(`${BASE_URL}/universe/${id}`);
    return res.json();
}

export async function updateProgress(nodeId, progress) {
    const res = await fetch(`${BASE_URL}/node/${nodeId}/progress`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ progress })
    });
    return res.json();
}

export async function searchAnime(query) {
    const res = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
    return res.json();
}

export async function searchRelations(query) {
    const res = await fetch(`${BASE_URL}/search/relations?query=${encodeURIComponent(query)}`);
    return res.json();
}

export async function createUniverse(query, universeName) {
    const res = await fetch(`${BASE_URL}/universe/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, universe_name: universeName })
    });
    return res.json();
}

export async function searchAnimeList(query) {
    const res = await fetch(`${BASE_URL}/search/list?query=${encodeURIComponent(query)}`);
    return res.json();
}

export async function deleteUniverse(id) {
    const res = await fetch(`${BASE_URL}/universe/${id}`, {
        method: "DELETE"
    });
    return res.json
}

export async function checkAnimeExists(animeId) {
    const res = await fetch(`${BASE_URL}/search/exists?anime_id=${animeId}`);
    return res.json();
}

export async function toggleSkip(nodeId) {
    const res = await fetch(`${BASE_URL}/node/${nodeId}/skip`, {
        method: "PATCH"
    });
    return res.json();
}
