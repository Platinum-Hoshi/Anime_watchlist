import { useState } from "react";
import Home from "./pages/home";
import Universe from "./pages/universe";

export default function App() {
    const [page, setPage] = useState("home");
    const [universeId, setUniverseId] = useState(null);

    function openUniverse(id) {
        setUniverseId(id);
        setPage("universe");
    }

    if (page === "universe") {
        return (
            <div>
            <button
            onClick={() => setPage("home")}
            style={{
                margin: "16px 24px",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                fontSize: "13px"
            }}
            >
            ← Back
            </button>
            <Universe id={universeId} />
            </div>
        );
    }

    return <Home onOpenUniverse={openUniverse} />;
}
