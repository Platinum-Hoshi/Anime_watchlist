import { useEffect, useState } from "react";
import Home from "./pages/home";
import Universe from "./pages/universe";

// Adresse -> Seite: "#/universe/12" ist das Universe mit der ID 12, alles andere die Startseite
function readLocation() {
    const m = window.location.hash.match(/^#\/universe\/(\d+)$/);
    return m ? { page: "universe", id: Number(m[1]) } : { page: "home", id: null };
}

export default function App() {
    const initial = readLocation();
    const [page, setPage] = useState(initial.page);
    const [universeId, setUniverseId] = useState(initial.id);

    // Pfeil "zurück" / "vor" des Browsers
    useEffect(() => {
        const onPop = () => {
            const loc = readLocation();
            setPage(loc.page);
            setUniverseId(loc.id);
        };
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    function openUniverse(id) {
        if (page === "universe") {
            // von einem Universe zum anderen: Eintrag ersetzen, damit "zurück" zur Übersicht führt
            window.history.replaceState(window.history.state, "", `#/universe/${id}`);
        } else {
            window.history.pushState({ inApp: true }, "", `#/universe/${id}`);
        }
        setUniverseId(id);
        setPage("universe");
    }

    function goHome() {
        if (window.history.state && window.history.state.inApp) {
            window.history.back();
        } else {
            // Seite wurde direkt über einen Link geöffnet: nicht aus der App herausspringen
            window.history.replaceState(null, "", "#/");
            setPage("home");
            setUniverseId(null);
        }
    }

    if (page === "universe") {
        return (
            <Universe
                id={universeId}
                onBack={goHome}
                onOpenUniverse={openUniverse}
            />
        );
    }

    return <Home onOpenUniverse={openUniverse} />;
}
