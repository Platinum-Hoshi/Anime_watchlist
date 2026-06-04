import { useEffect, useState } from "react";
import { getUniverse, updateProgress } from "../api/api";
import Graph from "../components/graph";
import AnimeBar from "../components/animebar";

export default function Universe({ id }) {
    const [data, setData] = useState(null);
    useEffect(() => {
        loadUniverse();
    }, [id]);

    async function loadUniverse() {
        const universe = await getUniverse(id);
        setData(universe);
    }

    async function handleProgress(node) {
        const newProgress = node.progress +1;
        await updateProgress(node.id, newProgress);
        loadUniverse();
    }

    if (!data) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", fontFamily: "sans-serif" }}>            <h1 style={{ margin: "0 0 16px 0" }}>Universe</h1>

            <div style={{
                display: "flex",
                gap: "20px",
                alignItems: "stretch",
                marginBottom: "24px"
            }}>
                {data.cover && (
                    <img
                        src={data.cover}
                        alt="Universe Cover"
                        style={{
                            width: "120px",
                            objectFit: "cover",
                            borderRadius: "10px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            flexShrink: 0
                        }}
                    />
                )}

                <div style={{
                    flex: 1,
                    padding: "20px 24px",
                    background: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "16px",
                    alignContent: "center"
                }}>
                    {[
                        { label: "Completion", value: `${data.stats.completion}%` },
                        { label: "Episodes", value: `${data.stats.watched_episodes} / ${data.stats.total_episodes}` },
                        { label: "Completed", value: data.stats.completed_count },
                        { label: "Watching", value: data.stats.watching_count },
                        { label: "Planned", value: data.stats.planned_count },
                    ].map(stat => (
                        <div key={stat.label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a" }}>{stat.value}</div>
                            <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Graph */}
            <Graph
                nodes={data.nodes}
                edges={data.edges}
                onNodeClick={(id) => {
                    document.getElementById(id)?.scrollIntoView({
                        behavior: "smooth"
                    });
                }}
            />

            {/* Bars */}
            <div>
                {data.nodes.map(node => (
                    <AnimeBar
                        key={node.id}
                        node={node}
                        nodes={data.nodes}
                        edges={data.edges}
                        onProgressChange={async (node, progress) => {
                            await updateProgress(node.id, progress);
                            loadUniverse();
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
