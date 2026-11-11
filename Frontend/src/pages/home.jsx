import { useEffect, useState, useRef } from "react";
import {
    getUniverses,
    searchAnimeList,
    createUniverse,
    checkAnimeExists,
    exportBackup,
    importBackup,
    getWatchlist,
    addToWatchlist,
    removeWatchlistItem,
    deleteWatchlistTile
} from "../api/api";

const roundBtn = (bg, color, borderColor = "transparent") => ({
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: `1px solid ${borderColor}`,
    background: bg,
    color,
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "700",
    lineHeight: 1,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0
});

const colTitle = { margin: "0 0 12px 0", fontSize: "15px", color: "#c2410c", fontWeight: "600" };

const inputStyle = {
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #fdba74",
    fontSize: "14px",
    boxSizing: "border-box"
};

export default function Home({ onOpenUniverse }) {
    // Universen
    const [universes, setUniverses] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [nameFilter, setNameFilter] = useState("");
    const [sortBy, setSortBy] = useState("default");

    // Suche
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);

    // Universe-Modal
    const [showModal, setShowModal] = useState(false);
    const [universeName, setUniverseName] = useState("");
    const [importing, setImporting] = useState(false);
    const [existsWarning, setExistsWarning] = useState(null);

    // Watchlist
    const [view, setView] = useState("universes");
    const [watchlist, setWatchlist] = useState([]);
    const [openTiles, setOpenTiles] = useState([]);
    const [watchSearch, setWatchSearch] = useState("");
    const [busyTile, setBusyTile] = useState(null);

    // Einstellungen
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState("backups");

    useEffect(() => {
        loadUniverses();
        loadWatchlist();
    }, []);

    async function loadUniverses() {
        const data = await getUniverses();
        setUniverses(data.universes);
    }

    async function loadWatchlist() {
        const data = await getWatchlist();
        setWatchlist(data.watchlist);
    }

    // ---------- Suche ----------
    async function handleSearch(searchQuery) {
        if (!searchQuery.trim()) {
            setSuggestions([]);
            setSearched(false);
            return;
        }
        setLoading(true);
        try {
            const data = await searchAnimeList(searchQuery);
            setSuggestions(data.results || []);
        } catch {
            setSuggestions([]);
        }
        setSearched(true);
        setLoading(false);
    }

    // Grüner Plus-Knopf: als Universe hinzufügen (mit Namens-Fenster)
    async function handleSuggestionClick(suggestion) {
        setUniverseName(suggestion.title);
        setQuery(suggestion.title);

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
        setSuggestions([]);
        setSearched(false);
        loadUniverses();
    }

    // Gelber Stern-Knopf: direkt zur Watchlist
    async function handleStar(suggestion) {
        try {
            const res = await addToWatchlist(suggestion.id);
            await loadWatchlist();
            if (res.status === "exists") alert("Dieser Anime ist schon in der Watchlist.");
        } catch (err) {
            alert(err.message);
        }
    }

    // ---------- Watchlist ----------
    function toggleTile(id) {
        setOpenTiles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    async function handleImportTile(tile) {
        if (!confirm(`"${tile.name}" als Universe importieren? Die Kachel wird danach aus der Watchlist entfernt.`)) return;
        setBusyTile(tile.id);
        try {
            await createUniverse(tile.items[0].title, tile.name);
            await deleteWatchlistTile(tile.id);
            await loadUniverses();
            await loadWatchlist();
            setView("universes");
        } catch {
            alert("Import fehlgeschlagen (ist AniList erreichbar?).");
        }
        setBusyTile(null);
    }

    async function handleDeleteTile(tile) {
        if (!confirm(`"${tile.name}" aus der Watchlist entfernen?`)) return;
        await deleteWatchlistTile(tile.id);
        loadWatchlist();
    }

    async function handleRemoveItem(itemId) {
        await removeWatchlistItem(itemId);
        loadWatchlist();
    }

    // ---------- Backup ----------
    async function handleExport() {
        const data = await exportBackup();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `anime-watchlist-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm("Alle aktuellen Daten werden durch das Backup ersetzt. Fortfahren?")) {
            e.target.value = "";
            return;
        }

        try {
            const data = JSON.parse(await file.text());
            await importBackup(data);
            loadUniverses();
            loadWatchlist();
        } catch {
            alert("Das Backup konnte nicht gelesen werden.");
        }
        e.target.value = "";
    }

    // ---------- abgeleitete Daten ----------
    const watchlistAnimeIds = new Set(watchlist.flatMap(t => t.items.map(i => i.anime_id)));

    const visibleUniverses = universes
        .filter(u => statusFilter === "all" || u.status === statusFilter)
        .filter(u => u.name.toLowerCase().includes(nameFilter.trim().toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "percent_desc") return b.completion - a.completion;
            if (sortBy === "percent_asc") return a.completion - b.completion;
            return 0;
        });

    const visibleWatchlist = watchlist.filter(t => {
        const q = watchSearch.trim().toLowerCase();
        if (!q) return true;
        return t.name.toLowerCase().includes(q) || t.items.some(i => i.title.toLowerCase().includes(q));
    });

    // ---------- Watchlist-Kachel (wird in beiden Ansichten benutzt) ----------
    function renderTile(tile) {
        const isOpen = openTiles.includes(tile.id);
        return (
            <div
                key={tile.id}
                style={{
                    marginBottom: "10px",
                    background: "#f8fafc",
                    border: "1px solid #d1d5db",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    overflow: "hidden"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px" }}>
                    <div
                        onClick={() => toggleTile(tile.id)}
                        style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0, cursor: "pointer" }}
                    >
                        {tile.cover && (
                            <img
                                src={tile.cover}
                                alt={tile.name}
                                style={{ width: "40px", height: "56px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                            />
                        )}
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: "600", fontSize: "14px" }}>{tile.name}</div>
                            <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                                {tile.items.length} {tile.items.length === 1 ? "Eintrag" : "Einträge"} {isOpen ? "▲" : "▼"}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleImportTile(tile)}
                        disabled={busyTile === tile.id}
                        title="Als Universe hinzufügen"
                        style={{ ...roundBtn("#16a34a", "#fff"), opacity: busyTile === tile.id ? 0.5 : 1 }}
                    >
                        {busyTile === tile.id ? "…" : "+"}
                    </button>
                </div>

                {isOpen && (
                    <div style={{ borderTop: "1px solid #e5e7eb", background: "#fff" }}>
                        {tile.items.map(item => (
                            <div
                                key={item.id}
                                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}
                            >
                                {item.cover && (
                                    <img
                                        src={item.cover}
                                        alt={item.title}
                                        style={{ width: "28px", height: "40px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                                    />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{item.title}</div>
                                    <div style={{ fontSize: "11px", color: "#888" }}>
                                        {item.format} {item.year ? `· ${item.year}` : ""}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    title="Aus Watchlist entfernen"
                                    style={{ border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <div style={{ padding: "8px 12px", textAlign: "right" }}>
                            <button
                                onClick={() => handleDeleteTile(tile)}
                                style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}
                            >
                                Ganze Kachel entfernen
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ---------- Render ----------
    return (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px", fontFamily: "sans-serif" }}>

            {/* Kopfzeile: Titel links, Umschalter in der Mitte */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: "24px", gap: "12px" }}>
                <h1 style={{ margin: 0, color: "#ea580c" }}>Anime Watchlist</h1>

                <div style={{ display: "flex", background: "#ffedd5", borderRadius: "10px", padding: "4px" }}>
                    {[["universes", "Universen"], ["watchlist", "Watchlist"]].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setView(key)}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "8px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                                background: view === key ? "#fff" : "transparent",
                                color: view === key ? "#ea580c" : "#9a3412",
                                boxShadow: view === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                            }}
                        >
                            {label}{key === "watchlist" && watchlist.length > 0 ? ` (${watchlist.length})` : ""}
                        </button>
                    ))}
                </div>

                <div />
            </div>

            <div style={{ display: "flex", alignItems: "stretch", flexWrap: "wrap", border: "1px solid #fed7aa", borderRadius: "12px", overflow: "hidden", background: "#fffaf5" }}>

                {/* ===== Linke Spalte: Suche ===== */}
                <div style={{ flex: "1 1 280px", minWidth: 0, background: "#fff", padding: "20px", borderRight: "1px solid #fed7aa" }}>
                    <h3 style={colTitle}>Suche</h3>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        <input
                            type="text"
                            value={query}
                            onChange={e => {
                                const val = e.target.value;
                                setQuery(val);
                                clearTimeout(debounceRef.current);
                                debounceRef.current = setTimeout(() => handleSearch(val), 400);
                            }}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    clearTimeout(debounceRef.current);
                                    handleSearch(query);
                                }
                            }}
                            placeholder="Anime suchen..."
                            style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                        />
                        <button
                            onClick={() => {
                                clearTimeout(debounceRef.current);
                                handleSearch(query);
                            }}
                            disabled={loading}
                            style={{
                                padding: "9px 14px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#ea580c",
                                color: "#fff",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "14px"
                            }}
                        >
                            {loading ? "..." : "Suchen"}
                        </button>
                    </div>

                    {searched && !loading && suggestions.length === 0 && (
                        <p style={{ color: "#888", fontSize: "13px" }}>
                            Keine Treffer (oder AniList ist gerade nicht erreichbar).
                        </p>
                    )}

                    <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", paddingRight: "4px" }}>
                    {suggestions.map(s => {
                        const inWatchlist = watchlistAnimeIds.has(s.id);
                        return (
                            <div
                                key={s.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "10px",
                                    marginBottom: "8px",
                                    background: "#fff",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "10px"
                                }}
                            >
                                {s.cover && (
                                    <img
                                        src={s.cover}
                                        alt={s.title}
                                        style={{ width: "40px", height: "56px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                                    />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: "500", fontSize: "14px" }}>{s.title}</div>
                                    <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                                        {s.format} {s.year ? `· ${s.year}` : ""}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <button
                                        onClick={() => handleSuggestionClick(s)}
                                        title="Als Universe hinzufügen"
                                        style={roundBtn("#16a34a", "#fff")}
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => handleStar(s)}
                                        disabled={inWatchlist}
                                        title={inWatchlist ? "Bereits in der Watchlist" : "Zur Watchlist hinzufügen"}
                                        style={{ ...roundBtn("#facc15", "#854d0e"), opacity: inWatchlist ? 0.4 : 1, cursor: inWatchlist ? "default" : "pointer" }}
                                    >
                                        ★
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>

                {/* ===== Mittlere Spalte ===== */}
                <div style={{ flex: "2 1 400px", minWidth: 0, padding: "20px" }}>

                    {view === "universes" && (
                        <>
                            <h3 style={colTitle}>Meine Universen</h3>

                            {/* Filter */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                                <input
                                    type="text"
                                    value={nameFilter}
                                    onChange={e => setNameFilter(e.target.value)}
                                    placeholder="Nach Name filtern..."
                                    style={{ ...inputStyle, flex: "1 1 160px" }}
                                />
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="all">Alle Status</option>
                                    <option value="planned">Geplant</option>
                                    <option value="watching">Am Schauen</option>
                                    <option value="completed">Fertig</option>
                                </select>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="default">Standard-Reihenfolge</option>
                                    <option value="name">Name A–Z</option>
                                    <option value="percent_desc">Fortschritt hoch → tief</option>
                                    <option value="percent_asc">Fortschritt tief → hoch</option>
                                </select>
                            </div>

                            {visibleUniverses.length === 0 && (
                                <p style={{ color: "#888", fontSize: "13px" }}>
                                    {universes.length === 0 ? "Noch keine Universen. Suche links einen Anime und klicke auf +." : "Kein Universe passt zu den Filtern."}
                                </p>
                            )}

                            {visibleUniverses.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => onOpenUniverse(u.id)}
                                    style={{
                                        padding: "16px",
                                        marginBottom: "10px",
                                        background: u.status === "completed" ? "#f0fdf4" : u.status === "watching" ? "#fefce8" : "#f8fafc",
                                        border: u.status === "completed" ? "1px solid #6ee7b7" : u.status === "watching" ? "1px solid #fde047" : "1px solid #d1d5db",
                                        borderRadius: "12px",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        cursor: "pointer"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 2, minWidth: 0 }}>
                                        {u.cover && (
                                            <img
                                                src={u.cover}
                                                alt={u.name}
                                                style={{ width: "48px", height: "68px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                                            />
                                        )}
                                        <h3 style={{ margin: 0 }}>{u.name}</h3>
                                    </div>

                                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                                        <span style={{
                                            display: "inline-block",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500",
                                            border: "1px solid",
                                            borderColor: u.status === "completed" ? "#6ee7b7" : u.status === "watching" ? "#fde047" : "#d1d5db",
                                            background: u.status === "completed" ? "#6ee7b7" : u.status === "watching" ? "#fef9c3" : "#f1f5f9",
                                            color: u.status === "completed" ? "#065f46" : u.status === "watching" ? "#854d0e" : "#475569"
                                        }}>
                                            {u.status === "completed" ? "Fertig" : u.status === "watching" ? "Am Schauen" : "Geplant"}
                                        </span>
                                        <span style={{ fontSize: "13px", color: "#888", fontWeight: "500", minWidth: "44px", textAlign: "right" }}>
                                            {u.completion}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {view === "watchlist" && (
                        <>
                            <h3 style={colTitle}>Watchlist</h3>
                            <input
                                type="text"
                                value={watchSearch}
                                onChange={e => setWatchSearch(e.target.value)}
                                placeholder="In der Watchlist suchen..."
                                style={{ ...inputStyle, width: "100%", marginBottom: "12px" }}
                            />
                            {visibleWatchlist.length === 0 && (
                                <p style={{ color: "#888", fontSize: "13px" }}>
                                    {watchlist.length === 0 ? "Noch nichts auf der Watchlist. Klicke bei einem Suchergebnis auf ★." : "Keine Treffer in der Watchlist."}
                                </p>
                            )}
                            {visibleWatchlist.map(renderTile)}
                        </>
                    )}
                </div>

                {/* ===== Rechte Spalte: Watchlist-Übersicht (nur in der Universen-Ansicht) ===== */}
                {view === "universes" && (
                    <div style={{ flex: "1 1 300px", minWidth: 0, background: "#fff", padding: "20px", borderLeft: "1px solid #fed7aa" }}>
                        <h3 style={colTitle}>Watchlist</h3>
                        <input
                            type="text"
                            value={watchSearch}
                            onChange={e => setWatchSearch(e.target.value)}
                            placeholder="In der Watchlist suchen..."
                            style={{ ...inputStyle, width: "100%", marginBottom: "12px" }}
                        />
                        {visibleWatchlist.length === 0 && (
                            <p style={{ color: "#888", fontSize: "13px" }}>
                                {watchlist.length === 0 ? "Noch nichts auf der Watchlist. Klicke bei einem Suchergebnis auf ★." : "Keine Treffer in der Watchlist."}
                            </p>
                        )}
                        {visibleWatchlist.map(renderTile)}
                    </div>
                )}
            </div>

            {/* Zahnrad unten links */}
            <button
                onClick={() => setShowSettings(true)}
                title="Einstellungen"
                style={{
                    position: "fixed",
                    left: "16px",
                    bottom: "16px",
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    fontSize: "22px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
                }}
            >
                ⚙
            </button>

            {/* Einstellungen */}
            {showSettings && (
                <div
                    onClick={() => setShowSettings(false)}
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: "#fff",
                            borderRadius: "16px",
                            width: "640px",
                            maxWidth: "92vw",
                            minHeight: "300px",
                            display: "flex",
                            overflow: "hidden",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
                        }}
                    >
                        {/* Linke Spalte: Kategorien */}
                        <div style={{ width: "180px", background: "#f8fafc", borderRight: "1px solid #e5e7eb", padding: "20px 12px" }}>
                            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", marginBottom: "10px", padding: "0 8px" }}>
                                EINSTELLUNGEN
                            </div>
                            {[["backups", "Backups"]].map(([key, label]) => (
                                <div
                                    key={key}
                                    onClick={() => setSettingsTab(key)}
                                    style={{
                                        padding: "8px 10px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        background: settingsTab === key ? "#fff7ed" : "transparent",
                                        color: settingsTab === key ? "#ea580c" : "#374151"
                                    }}
                                >
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* Mitte: Inhalt */}
                        <div style={{ flex: 1, padding: "24px" }}>
                            {settingsTab === "backups" && (
                                <>
                                    <h2 style={{ marginTop: 0 }}>Backups</h2>
                                    <p style={{ fontSize: "13px", color: "#64748b" }}>
                                        Ein Backup enthält alle Universen, deinen Fortschritt und die Watchlist.
                                        Beim Laden werden alle aktuellen Daten ersetzt.
                                    </p>
                                    <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                                        <button
                                            onClick={handleExport}
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: "8px",
                                                border: "none",
                                                background: "#ea580c",
                                                color: "#fff",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                fontSize: "13px"
                                            }}
                                        >
                                            Backup erstellen
                                        </button>
                                        <label
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: "8px",
                                                border: "1px solid #d1d5db",
                                                background: "#fff",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                fontSize: "13px"
                                            }}
                                        >
                                            Backup laden
                                            <input
                                                type="file"
                                                accept="application/json"
                                                onChange={handleImport}
                                                style={{ display: "none" }}
                                            />
                                        </label>
                                    </div>
                                </>
                            )}

                            <div style={{ marginTop: "32px", textAlign: "right" }}>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        background: "#fff",
                                        cursor: "pointer",
                                        fontSize: "13px"
                                    }}
                                >
                                    Schliessen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Universe-Namens-Fenster */}
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
                                    style={{ marginTop: "8px", color: "#ea580c", cursor: "pointer", fontSize: "13px" }}
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
                                    style={{ ...inputStyle, width: "100%", marginBottom: "12px" }}
                                />

                                <div style={{ marginBottom: "16px" }}>
                                    {suggestions.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => setUniverseName(s.title)}
                                            style={{
                                                padding: "8px 12px",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontSize: "13px",
                                                background: universeName === s.title ? "#fff7ed" : "transparent",
                                                color: universeName === s.title ? "#ea580c" : "#374151",
                                                marginBottom: "4px"
                                            }}
                                        >
                                            {s.title}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

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
                            {!existsWarning && (
                                <button
                                    onClick={handleCreate}
                                    disabled={importing}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: "#ea580c",
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
