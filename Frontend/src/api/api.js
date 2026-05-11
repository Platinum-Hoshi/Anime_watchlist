const BASE_URL = "http://localhost:8000";

export async function getUniverses() {
    const res = await fetch(`${BASE_URL}/universes`);
    return res.json();
}

export async function getUniverses(id) {
    const res = await fetch(`${BASE_URL}/universes/${id}`);
    return res.json();
}

export async function updateProgress(nodeID, progress) {
    const res = await fetch(`${BASE_URL}/node/${nodeId}/progress`, {
        method: "PATCH",
        headers: {
            "Content-Type": "applications/json"
        },
        body: JSON.stringify({ progress })
    });
    return res.json();
}

