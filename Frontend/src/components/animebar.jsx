import { useState } from "react";
import EpisodeList from "./episodelist";

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
                marginBottom: "10px"
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
            <div style={{ marginTop: "12px" }}>
                <h4>Relations</h4>
                {relations.map((relation, index) => {
                    const relatedId =
                        relation.source === node.id
                            ? relation.target
                            : relation.source;
                const relatedNode = nodes.find(
                    n => n.id === relatedId
                );
                if (!relatedNode) return null;
                return (
                    <div
                        key={index}
                        style={{
                            marginBottom: "4px",
                            cursor: "pointer",
                            color: "#2563eb",
                            fontSize: "13px",
                            textDecoration: "underline",
                            textDecorationColor: "transparent"
                        }}
                        onMouseEnter={e => e.currentTarget.style.textDecorationColor = "#2563eb"}
                        onMouseLeave={e => e.currentTarget.style.textDecorationColor = "transparent"}
                        onClick={() => {
                            document
                                .getElementById(relatedNode.id)
                                ?.scrollIntoView({
                                    behavior: "smooth"
                                });
                        }}
                    >
                        {relation.type}
                        {" → "}
                        {relatedNode.title}
                    </div>
                );
                })}
            </div>

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
