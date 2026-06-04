import { useEffect, useState, useRef } from "react";
import { getUniverses, searchAnimeList, createUniverse } from "../api/api";

export default function Home({ onOpenUniverse }) {
    const [universes, setUniverses] = useState([]);
    const [query, setQuery] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [universeName, setUniverseName] = useState("");
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        loadUniverses();
    }, []);

    async function loadUniverses() {
        const data = await getUniverses();
        setUniverses(data.universes);
    }

    async function handleSearch(searchQuery) {
        if (!searchQuery.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setLoading(true);
        const data = await searchAnimeList(searchQuery);
        if (data.results?.length > 0) {
            setSuggestions(data.results);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
        setLoading(false);
    }

    function handleSuggestionClick(suggestion) {
        setUniverseName(suggestion.title);
        setQuery(suggestion.title)
        setShowSuggestions(false);
        setShowModal(true);
    }

    async function handleCreate() {
        if (!universeName.trim()) return;
        setImporting(true);
        await createUniverse(query, universeName);
        setImporting(false);
        setShowModal(false);
        setQuery("");
        setSearchResult(null);
        loadUniverses();
    }

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", fontFamily: "sans-serif" }}>
        <h1>Anime Watchlist</h1>

        {/* Suchfeld */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <input
        type="text"
        value={query}
        onChange={e => {
            const val = e.target.value;
            setQuery(val);
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                handleSearch(val);
            }, 400);
        }}
        onKeyDown={e => {
            if (e.key === "Enter") {
                clearTimeout(debounceRef.current);
                handleSearch(query);
            }
        }}
        placeholder="Anime suchen..."
        style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "14px"
        }}
        />
        <button
        onClick={() => {
            clearTimeout(debounceRef.current);
            handleSearch(query);
        }}
        disabled={loading}
        style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px"
        }}
        >
        {loading ? "..." : "Suchen"}
        </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
            <div style={{
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                marginTop: "4px",
                marginBottom: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                overflow: "hidden"
            }}>
                {suggestions.map((s, i) => (
                    <div
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontSize: "14px",
                            borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                        {s.title}
                    </div>
                ))}
            </div>
        )}

        {/* Universe Liste */}
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

        {/* Modal */}
        {showModal && (
            <div style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.4)",
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "center",
                       zIndex: 100
            }}>
            <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "28px",
                width: "480px",
                maxWidth: "90vw",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
            }}>
            <h2 style={{ marginTop: 0 }}>Universe benennen</h2>

            <input
            type="text"
            value={universeName}
            onChange={e => setUniverseName(e.target.value)}
            placeholder="Universe Name..."
            style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                marginBottom: "12px",
                boxSizing: "border-box"
            }}
            />

            {/* Vorschläge */}
            <div style={{ marginBottom: "16px" }}>
            {suggestions.map((s, i) => (
                <div
                key={i}
                onClick={() => setUniverseName(s.title)}
                style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    background: universeName === s.title ? "#eff6ff" : "transparent",
                    color: universeName === s.title ? "#2563eb" : "#374151",
                    marginBottom: "4px"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.background = universeName === s.title ? "#eff6ff" : "transparent"}
                >
                {s.title}
                </div>
            ))}
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
            onClick={() => setShowModal(false)}
            style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                fontSize: "13px"
            }}
            >
            Abbrechen
            </button>
            <button
            onClick={handleCreate}
            disabled={importing}
            style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px"
            }}
            >
            {importing ? "Importiere..." : "Universe erstellen"}
            </button>
            </div>
            </div>
            </div>
        )}
        </div>
    );
}
