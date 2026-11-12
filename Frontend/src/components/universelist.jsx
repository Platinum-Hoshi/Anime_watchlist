import { useState } from "react";
import { colTitle, inputStyle } from "./styles";

const STATUS = {
    completed: { label: "Fertig", bg: "#f0fdf4", border: "#6ee7b7", badgeBg: "#6ee7b7", color: "#065f46" },
    watching: { label: "Am Schauen", bg: "#fefce8", border: "#fde047", badgeBg: "#fef9c3", color: "#854d0e" },
    planned: { label: "Geplant", bg: "#f8fafc", border: "#d1d5db", badgeBg: "#f1f5f9", color: "#475569" }
};

export default function UniverseList({ universes, onOpenUniverse, activeId = null, compact = false }) {
    const [statusFilter, setStatusFilter] = useState("all");
    const [nameFilter, setNameFilter] = useState("");
    const [sortBy, setSortBy] = useState("default");

    const visible = universes
        .filter(u => statusFilter === "all" || u.status === statusFilter)
        .filter(u => u.name.toLowerCase().includes(nameFilter.trim().toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "percent_desc") return b.completion - a.completion;
            if (sortBy === "percent_asc") return a.completion - b.completion;
            return 0;
        });

    return (
        <>
            <h3 style={colTitle}>Meine Universen</h3>

            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    placeholder="Nach Name filtern..."
                    style={{ ...inputStyle, flex: compact ? "1 1 100%" : "1 1 160px" }}
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ ...inputStyle, flex: compact ? "1 1 0" : "none", minWidth: 0 }}
                >
                    <option value="all">Alle Status</option>
                    <option value="planned">Geplant</option>
                    <option value="watching">Am Schauen</option>
                    <option value="completed">Fertig</option>
                </select>
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{ ...inputStyle, flex: compact ? "1 1 0" : "none", minWidth: 0 }}
                >
                    <option value="default">Standard-Reihenfolge</option>
                    <option value="name">Name A–Z</option>
                    <option value="percent_desc">Fortschritt hoch → tief</option>
                    <option value="percent_asc">Fortschritt tief → hoch</option>
                </select>
            </div>

            {visible.length === 0 && (
                <p style={{ color: "#888", fontSize: "13px" }}>
                    {universes.length === 0
                        ? "Noch keine Universen. Suche einen Anime und klicke auf +."
                        : "Kein Universe passt zu den Filtern."}
                </p>
            )}

            {visible.map(u => {
                const st = STATUS[u.status] || STATUS.planned;
                const isActive = u.id === activeId;

                const badge = (
                    <span style={{
                        display: "inline-block",
                        padding: compact ? "3px 10px" : "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "500",
                        border: `1px solid ${st.border}`,
                        background: st.badgeBg,
                        color: st.color
                    }}>
                        {st.label}
                    </span>
                );

                const percent = (
                    <span style={{ fontSize: "13px", color: "#888", fontWeight: "500" }}>{u.completion}%</span>
                );

                return (
                    <div
                        key={u.id}
                        onClick={() => onOpenUniverse(u.id)}
                        style={{
                            padding: compact ? "10px" : "16px",
                            marginBottom: "10px",
                            background: st.bg,
                            border: `1px solid ${st.border}`,
                            borderRadius: "12px",
                            boxShadow: isActive ? "0 0 0 2px #ea580c" : "0 1px 3px rgba(0,0,0,0.06)",
                            display: "flex",
                            alignItems: "center",
                            gap: compact ? "10px" : "16px",
                            cursor: "pointer"
                        }}
                    >
                        {u.cover && (
                            <img
                                src={u.cover}
                                alt={u.name}
                                style={{
                                    width: compact ? "36px" : "48px",
                                    height: compact ? "52px" : "68px",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                    flexShrink: 0
                                }}
                            />
                        )}

                        {compact ? (
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>{u.name}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {badge}
                                    {percent}
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 style={{ margin: 0, flex: 2, minWidth: 0 }}>{u.name}</h3>
                                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                                    {badge}
                                    <span style={{ fontSize: "13px", color: "#888", fontWeight: "500", minWidth: "44px", textAlign: "right" }}>
                                        {u.completion}%
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </>
    );
}
