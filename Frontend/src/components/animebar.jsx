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
                    cursor: "pointer"
                }}
                onClick={() => setOpen(!open)}
            >
                <div>
                    <h3>{node.title}</h3>
                    <p>
                        {node.progress} / {node.episodes}
                    </p>
                    <span style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: "99px",
                        fontSize: "11px",
                        fontWeight: "600",
                        background: node.status === "completed" ? "#d1fae5" : node.status === "watching" ? "#fef9c3" : "#f1f5f9",
                        color: node.status === "completed" ? "#065f46" : node.status === "watching" ? "#854d0e" : "#475569"
                    }}>
                        {node.status}
                    </span>
                </div>
                <div>
                    {open ? "▲" : "▼"}
                </div>
            </div>

            {/* Buttons */}
            <div
                style={{
                    marginTop: "10px",
                    display: "flex",
                    gap: "10px"
                }}
            >
                <button
                    onClick={() =>
                        onProgressChange(
                            node,
                            node.progress + 1
                        )
                    }
                    style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "500"
                    }}
                >
                    + Episode
                </button>
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
