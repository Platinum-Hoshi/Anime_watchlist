äimport { useState } from "react";
import EpisodeList from "./episodelist";

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
                    alignItem: "center",
                    cursor: "pointer"
                }}
                onClick={() => setOpen(!open)}
            >
                <h3 style={{ margin: 0, flex: 1 }}>{node.title}</h3>

                <span style={{ flex: 1, textAlign: "center", color: "#555", fontSize: "14px" }}>
                    {node.progress} / {node.episodes}
                </span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onProgressChange(node, node,progress +1);
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

                <span>
                    {open ? "▲" : "▼"}
                </span>
            </div>

            {/* Relations */}
            {open && <RelationSection relations={relations} nodes={node} />}

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
