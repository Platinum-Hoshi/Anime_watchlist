const BASE_URL = "http://192.168.36.160:8000";

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
