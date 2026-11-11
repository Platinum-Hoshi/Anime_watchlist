import { useState } from "react";
import Home from "./pages/home";
import Universe from "./pages/universe";
import { deleteUniverse } from "./api/api";

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
                <div style={{
                    maxWidth: "900px",
                    margin: "0 auto",
                    padding: "16px 24px 0 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <button
                        onClick={() => setPage("home")}
                        style={{
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

                    <button
                        onClick={async () => {
                            if (confirm("Dieses Universe wirklich löschen?")) {
                                await deleteUniverse(universeId);
                                setPage("home");
                            }
                        }}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: "1px solid #fca5a5",
                            background: "#fff",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "500"
                        }}
                    >
                        Löschen
                    </button>
                </div>
                <Universe id={universeId} />
            </div>
        );
    }

    return <Home onOpenUniverse={openUniverse} />;
}
