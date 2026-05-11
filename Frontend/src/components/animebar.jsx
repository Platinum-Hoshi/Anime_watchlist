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
                border: "1px solid #444",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "12px"
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
                    <p>
                        {node.status}
                    </p>
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
                            marginBottom: "6px",
                            cursor: "pointer",
                            color: "#4da6ff"
                        }}
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