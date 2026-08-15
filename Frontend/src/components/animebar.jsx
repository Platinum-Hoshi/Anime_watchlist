import { useState } from "react";
import EpisodeList from "./episodelist";
import { toggleSkip } from "../api/api";

function RelationSection({ relations, nodes, node }) {
    const [openCat, setOpenCat] = useState({});

    const categories = {
        "Prequel / Sequel": ["PREQUEL", "SEQUEL"],
        "Specials": ["SIDE_STORY", "SPIN_OFF", "OVA", "SPECISL", "MUSIC"],
        "Andere": []
    };

    const grouped = {
        "Prequel / Sequel": [],
        "Specials": [],
        "Andere": []
    };

    relations.forEach(relation => {
        const relatedId = relation.source === node.id ? relation.target : relation.source;
        const relatedNode = nodes.find(n => n.id === relatedId);
        if (!relatedNode) return;

        const type = relation.type?.toUpperCase();
        if (categories["Prequel / Sequel"].includes(type)) {
            grouped["Prequel / Sequel"].push({ relation, relatedNode });
        } else if (categories["Specials"].includes(type)) {
            grouped["Specials"].push({ relation, relatedNode});
        } else {
            grouped["Andere"].push({ relation, relatedNode});
        }
    });

    return (
        <div style={{ marginTop: "16px" }}>
            {Object.entries(grouped).map(([cat, items]) => {
                if (items.length === 0) return null;
                const isOpen = openCat[cat];
                return (
                    <div key={cat} style={{ marginBottom: "8px" }}>
                        <div
                            onClick={() => setOpenCat(prev => ({ ...prev, [cat]: !prev[cat] }))}
                            style={{
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "13px",
                                color: "#374151",
                                padding: "4px 0",
                                display: "flex",
                                justifyContent: "space-between"
                            }}
                        >
                            <span>{cat} ({items.length})</span>
                            <span>{isOpen ? "▲" : "▼"}</span>
                        </div>
                        {isOpen && items.map(({ relation, relatedNode }, i) => (
                            <div
                                key={i}
                                onClick={() => document.getElementById(relatedNode.id)?.scrollIntoView({ behavior: "smooth" })}
                                style={{
                                    marginBottom: "4px",
                                    cursor: "pointer",
                                    color: "#2563eb",
                                    fontSize: "13px",
                                    paddingLeft: "8px"
                                }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                            >
                                {relation.type} → {relatedNode.title}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

export default function AnimeBar({
    node,
    edges,
    nodes,
    onProgressChange
}) {
    const [open, setOpen] = useState(false);
    const relations = edges.filter(
        edge =>
            edge.source === node.id
            || edge.target === node.id
    );
    return (
        <div
            id={node.id}
            style={{
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "10px",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
            }}
        >
            {/* Header*/}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer"
                }}
                onClick={() => setOpen(!open)}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    {node.cover && (
                        <img
                            src={node.cover}
                            alt={node.title}
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
                        <h3 style={{ margin: 0 }}>{node.title}</h3>
                        <span style={{ fontSize: "12px", color: "#888" }}>{node.format}</span>
                    </div>
                </div>

                <span style={{ flex: 1, textAlign: "center", color: "#555", fontSize: "14px" }}>
                    {node.progress} / {node.episodes}
                </span>

                {node.episodes && node.progress >= node.episodes ? (
                    <span style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        background: "#d1fae5",
                        color: "#065f46",
                        fontSize: "13px",
                        fontWeight: "600",
                        marginRight: "12px"
                    }}>
                        ✓ Fertig
                    </span>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onProgressChange(node, node.progress + 1);
                        }}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "500",
                            marginRight: "12px"
                        }}
                    >
                        + Episode
                    </button>
                )}

                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        await toggleSkip(node.id);
                        onProgressChange(node, node.progress);
                    }}
                    style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: node.status === "skip" ? "1px solid #bfdbfe" : "1px solid #d1d5db",
                        background: node.status === "skip" ? "#eff6ff" : "#fff",
                        color: node.status === "skip" ? "#2563eb" : "#374151",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "500",
                        marginRight: "12px"
                    }}
                >
                    {node.status === "skip" ? "↩ Unskip" : "Skip"}
                </button>
                
                <span>
                    {open ? "▲" : "▼"}
                </span>
            </div>

            {/* Relations */}
            {open && <RelationSection relations={relations} nodes={nodes} node={node} />}

            {/*  Episodes */}
            {open && (
                <EpisodeList
                    episodes={node.episodes}
                    progress={node.progress}
                    onEpisodeClick={(episode) =>
                        onProgressChange(node, episode)
                    }
                />
            )}
        </div>
    );
}
