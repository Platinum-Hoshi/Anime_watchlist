import { useEffect, useState, useRef } from "react";
import { getUniverses, searchAnimeList, createUniverse, deleteUniverse, checkAnimeExists } from "../api/api";

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
    const [existsWarning, setExistsWarning] = useState(null);

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

    async function handleSuggestionClick(suggestion) {
        setUniverseName(suggestion.title);
        setQuery(suggestion.title);
        setShowSuggestions(false);

        const result = await checkAnimeExists(suggestion.id);
        if (result.exists) {
            setExistsWarning(result.universe);
        } else {
            setExistsWarning(null);
        }

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
                            borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                        {s.cover && (
                            <img
                                src={s.cover}
                                alt={s.title}
                                style={{
                                    width: "36px",
                                    height: "52px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                    flexShrink: 0
                                }}
                            />
                        )}
                    <div>
                        <div style={{ fontWeight: "500" }}>{s.title}</div>
                        <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                            {s.format} {s.year ? `· ${s.year}` : ""}
                        </div>
                    </div>
                </div>
            ))}
        </div>
        )}

        {/* Universe Liste */}
        {universes.map(u => (
        <div
            key={u.id}
            style={{
                padding: "16px",
                marginBottom: "10px",
                background: u.status === "completed" ? "#d1fae5" : "#fff",
                border: u.status === "completed" ? "1px solid #6ee7b7" : "1px solid #e0e0e0",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "16px"
            }}
        >
            {/* Cover + Titel */}
            <div
                onClick={() => onOpenUniverse(u.id)}
                style={{ display: "flex", alignItems: "center", gap: "16px", flex: 2, cursor: "pointer" }}
            >
                {u.cover && (
                    <img
                        src={u.cover}
                        alt={u.name}
                        style={{
                            width: "48px",
                            height: "68px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            flexShrink: 0
                        }}
                    />
                )}
                <h3 style={{ margin: 0 }}>{u.name}</h3>
            </div>

            {/* Status + Prozent */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <span style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "500",
                    border: "1px solid",
                    borderColor: u.status === "completed" ? "#6ee7b7" : u.status === "watching" ? "#fde047" : "#d1d5db",
                    background: u.status === "completed" ? "#d1fae5" : u.status === "watching" ? "#fef9c3" : "#f1f5f9",
                    color: u.status === "completed" ? "#065f46" : u.status === "watching" ? "#854d0e" : "#475569"
                }}>
                    {u.status === "completed" ? "Fertig" : u.status === "watching" ? "Am Schauen" : "Geplant"}
                </span>
                <span style={{ fontSize: "13px", color: "#888", fontWeight: "500" }}>
                    {u.completion}%
                </span>
            </div>

            {/* Delete */}
            <button
                onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`"${u.name}" wirklich löschen?`)) {
                        await deleteUniverse(u.id);
                        loadUniverses();
                    }
                }}
                style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #fca5a5",
                    background: "#fff",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                    flexShrink: 0
                }}
            >
                Löschen
            </button>
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

            {existsWarning && (
                <div style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "#fef9c3",
                    border: "1px solid #fde047",
                    marginBottom: "16px",
                    fontSize: "13px",
                    color: "#854d0e"
                }}>
                    Dieser Anime ist bereits im Universe <strong>"{existsWarning.universe_name}"</strong> vorhanden.
                    <div
                        onClick={() => {
                            setShowModal(false);
                            onOpenUniverse(existsWarning.universe_id);
                        }}
                        style={{
                            marginTop: "8px",
                            color: "#2563eb",
                            cursor: "pointer",
                            fontSize: "13px"
                        }}
                    >
                        <strong>{existsWarning.universe_name}</strong>
                    </div>
                </div>
            )}

            {!existsWarning && (
                <>
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
                </>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowModal(false)}
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
                {!existsWarning && (
                    <button onClick={handleCreate} disabled={importing}
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
                )}
            </div>

            </div>
            </div>
        )}
        </div>
    );
}
