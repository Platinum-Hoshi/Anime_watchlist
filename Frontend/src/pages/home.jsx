import { useEffect, useState } from "react";
import { getUniverses } from "../api/api";

export default function Home({ onOpenUniverse }) {
    const [universes, setUniverses] = useState([]);

    useEffect(() => {
        getUniverses().then(data => {
            setUniverses(data.universes);
        });
    }, []);

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", fontFamily: "sans-serif" }}>
        <h1>Anime Watchlist</h1>
        {universes.map(u => (
            <div
            key={u.id}
            onClick={() => onOpenUniverse(u.id)}
            style={{
                padding: "16px",
                marginBottom: "10px",
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
            }}
            >
            <h3 style={{ margin: 0 }}>{u.name}</h3>
            </div>
        ))}
        </div>
    );
}
