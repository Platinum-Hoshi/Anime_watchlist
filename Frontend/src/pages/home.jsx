import { useEffect, useState, useRef } from "react";
import {
    getUniverses,
    searchAnimeList,
    createUniverse,
    checkAnimeExists,
    exportBackup,
    importBackup,
    exportWatchlistBackup,
    importWatchlistBackup,
    getWatchlist,
    addToWatchlist,
    removeWatchlistItem,
    deleteWatchlistTile
} from "../api/api";
import UniverseList from "../components/universelist";
import { colTitle, inputStyle, sideStyle } from "../components/styles";

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

export default function Home({ onOpenUniverse }) {
    // Universen
    const [universes, setUniverses] = useState([]);

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

    // Layout (schmale Bildschirme stapeln die Spalten)
    const [watchCollapsed, setWatchCollapsed] = useState(() => {
        try { return localStorage.getItem("watchCollapsed") === "1"; } catch { return false; }
    });

    // Info-Fenster bei den Suchergebnissen
    const [hoverInfo, setHoverInfo] = useState(null);
    const [pinnedInfo, setPinnedInfo] = useState(null);

    // Einstellungen
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState("backups");

    useEffect(() => {
        const onKey = e => { if (e.key === "Escape") setPinnedInfo(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

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
        setPinnedInfo(null);
        setHoverInfo(null);
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
        loadWatchlist();
    }

    function handleUniverseButton(suggestion, inWatchlist) {
      if (inWatchlist && !confirm(`"${suggestion.title}" ist in der Watchlist. Aud der Watchlist entfernen und als Universe hinzufügen?`)) {
        return;
      }
      handleSuggestionClick(suggestion);
    }

    function infoFor(e, item) {
        const r = e.currentTarget.getBoundingClientRect();
        return { item, top: r.top, left: r.right + 28 };
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

    function toggleWatchCollapsed() {
        const next = !watchCollapsed;
        setWatchCollapsed(next);
        try { localStorage.setItem("watchCollapsed", next ? "1" : "0"); } catch { /* ignorieren */ }
    }

    // ---------- Backup ----------
    function downloadJson(data, namePrefix) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${namePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleExport() {
        downloadJson(await exportBackup(), "anime-watchlist-backup");
    }

    async function handleExportWatchlist() {
        downloadJson(await exportWatchlistBackup(), "anime-watchlist-nur-watchlist");
    }

    // Gemeinsame Import-Logik: Datei lesen, bestaetigen, importieren, neu laden
    async function readAndImport(e, importFn, confirmText) {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm(confirmText)) {
            e.target.value = "";
            return;
        }

        try {
            const data = JSON.parse(await file.text());
            await importFn(data);
            loadUniverses();
            loadWatchlist();
        } catch {
            alert("Das Backup konnte nicht gelesen werden.");
        }
        e.target.value = "";
    }

    function handleImport(e) {
        readAndImport(e, importBackup, "Alle aktuellen Daten werden durch das Backup ersetzt. Fortfahren?");
    }

    function handleImportWatchlist(e) {
        readAndImport(e, importWatchlistBackup, "Die aktuelle Watchlist wird durch das Backup ersetzt (Universen bleiben unverändert). Fortfahren?");
    }

    function renderBackupSection(title, text, onExport, onImport) {
        return (
            <div style={{ marginBottom: "24px" }}>
                <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "4px" }}>{title}</div>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 10px 0" }}>{text}</p>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={onExport}
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
                            border: "1px solid #fdba74",
                            background: "#fff",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "13px"
                        }}
                    >
                        Backup laden
                        <input type="file" accept="application/json" onChange={onImport} style={{ display: "none" }} />
                    </label>
                </div>
            </div>
        );
    }

    // ---------- abgeleitete Daten ----------
    const watchlistAnimeIds = new Set(watchlist.flatMap(t => t.items.map(i => i.anime_id)));

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
        <div style={{ position: "relative", display: "flex", flexDirection: "row", alignItems: "stretch", minHeight: "100vh", minWidth: "900px", background: "#fffaf5", fontFamily: "sans-serif" }}>


                {/* ===== Linke Spalte: Suche ===== */}
                <div style={sideStyle("left")}>
                    <h1 style={{ margin: "0 0 20px 0", color: "#ea580c", fontSize: "22px", whiteSpace: "nowrap" }}>Anime Watchlist</h1>
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

                    <div>
                    {suggestions.map(s => {
                        const inWatchlist = watchlistAnimeIds.has(s.id);
                        return (
                            <div
                                key={s.id}
                                onMouseEnter={e => setHoverInfo(infoFor(e, s))}
                                onMouseLeave={() => setHoverInfo(null)}
                                onClick={e => setPinnedInfo(pinnedInfo && pinnedInfo.item.id === s.id ? null : infoFor(e, s))}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "10px",
                                    marginBottom: "8px",
                                    background: "#fff",
                                    border: pinnedInfo && pinnedInfo.item.id === s.id ? "1px solid #ea580c" : "1px solid #e0e0e0",
                                    borderRadius: "10px",
                                    cursor: "pointer"
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
                                        onClick={e => { e.stopPropagation(); handleUniverseButton(s, inWatchlist); }}
                                        title={inWatchlist ? "Aus der Watchlist entfernen und als Universe hinzufügen" : "Als Universe hinzufügen"}
                                        style={roundBtn(inWatchlist ? "#2563eb" : "#16a34a", "#fff")}
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); handleStar(s); }}
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
                <div style={{ flex: 1, minWidth: 0, padding: "24px" }}>
            {/* Umschalter: immer genau in der Fenstermitte, egal ob die Watchlist offen ist */}
            <div style={{ position: "absolute", top: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
                <div style={{ display: "flex", background: "#ffedd5", borderRadius: "10px", padding: "4px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
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

            </div>
            <div style={{ height: "64px" }} />


                    {view === "universes" && (
                        <UniverseList universes={universes} onOpenUniverse={onOpenUniverse} />
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
                    <div style={sideStyle("right", watchCollapsed)}>
                        {watchCollapsed ? (
                            <div
                                onClick={toggleWatchCollapsed}
                                title="Watchlist ausklappen"
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", cursor: "pointer" }}
                            >
                                <span style={{ fontSize: "18px", color: "#ea580c", fontWeight: "700" }}>«</span>
                                <span style={{ writingMode: "vertical-rl", color: "#c2410c", fontWeight: "600", fontSize: "14px" }}>
                                    Watchlist ({watchlist.length})
                                </span>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <h3 style={{ ...colTitle, margin: 0 }}>Watchlist</h3>
                                    <button
                                        onClick={toggleWatchCollapsed}
                                        title="Watchlist einklappen"
                                        style={{ border: "1px solid #fdba74", background: "#fff", color: "#ea580c", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "700", padding: "2px 10px" }}
                                    >
                                        »
                                    </button>
                                </div>
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
                )}

            {/* Info-Fenster zum Suchergebnis (Hover oder angeklickt) */}
            {(pinnedInfo || hoverInfo) && (() => {
                const info = pinnedInfo || hoverInfo;
                const s = info.item;
                const top = Math.max(8, Math.min(info.top, window.innerHeight - 340));
                const statusText = {
                    FINISHED: "Abgeschlossen",
                    RELEASING: "Läuft",
                    NOT_YET_RELEASED: "Noch nicht erschienen",
                    CANCELLED: "Abgebrochen",
                    HIATUS: "Pausiert"
                }[s.status] || null;
                const facts = [
                    s.format,
                    s.start_date || s.year,
                    s.episodes ? `${s.episodes} Folgen` : null,
                    statusText
                ].filter(Boolean).join(" · ");
                return (
                    <div style={{
                        position: "fixed",
                        left: info.left,
                        top,
                        width: "340px",
                        maxHeight: "320px",
                        overflowY: "auto",
                        boxSizing: "border-box",
                        background: "#fff",
                        border: "1px solid #fdba74",
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                        padding: "14px 16px",
                        zIndex: 60,
                        pointerEvents: pinnedInfo ? "auto" : "none"
                    }}>
                        {pinnedInfo && (
                            <button
                                onClick={() => setPinnedInfo(null)}
                                style={{ float: "right", border: "none", background: "transparent", cursor: "pointer", fontSize: "16px", color: "#9ca3af" }}
                            >
                                ✕
                            </button>
                        )}
                        <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>{s.title}</div>
                        <div style={{ fontSize: "12px", color: "#c2410c", fontWeight: "600", marginBottom: "10px" }}>{facts}</div>
                        <div style={{ fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>
                            {s.description || "Keine Beschreibung vorhanden."}
                        </div>
                    </div>
                );
            })()}

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
                                    {renderBackupSection(
                                        "Alles",
                                        "Universen, Fortschritt und Watchlist. Beim Laden werden alle aktuellen Daten ersetzt.",
                                        handleExport,
                                        handleImport
                                    )}
                                    {renderBackupSection(
                                        "Nur Watchlist",
                                        "Nur die Watchlist. Beim Laden wird nur sie ersetzt, deine Universen bleiben unverändert.",
                                        handleExportWatchlist,
                                        handleImportWatchlist
                                    )}
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
