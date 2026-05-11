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
        <div>
            <h1>Universe</h1>

            <div
                style={{
                    padding: "12px",
                    border: "1px solid #444",
                    borderRadius: "10px",
                    marginBottom: "20px"
                }}
            >
                <h2>
                    Completion: {data.stats.completion}%
                </h2>
                <p>
                    Watched Episodes:
                    {" "}
                    {data.stats.watched_episodes}
                    {" / "}
                    {data.stats.total_episodes}
                </p>
                <p>
                    Completed Anime:
                    {" "}
                    {data.stats.completed_count}
                </p>
                <p>
                    Watching:
                    {" "}
                    {data.stats.watching_count}
                </p>
                <p>
                    Planned:
                    {" "}
                    {data.stats.planned_count}
                </p>
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
