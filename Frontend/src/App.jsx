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
            <Universe
                id={universeId}
                onBack={() => setPage("home")}
                onOpenUniverse={openUniverse}
            />
        );
    }

    return <Home onOpenUniverse={openUniverse} />;
}
