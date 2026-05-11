import { useEffect, useState } from "react";
import { getUniverses } from "../api/api";

export default function Home() {
    const [universes, setUniverses] = useState([]);

    useEffect(() => {
        getUniverses().then(data => {
            setUniverses(data.universes);
        });
    }, []);

    return (
        <div>
            <h1>Anime universes</h1>

            {universes.map(u => (
                <div key={u.id}>
                    <h3>{u.name}</h3>
                </div>
            ))}
        </div>
    );
}
