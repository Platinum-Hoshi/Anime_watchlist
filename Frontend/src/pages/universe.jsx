import { useEffect, useState } from "react";
import { getUniverse, getUniverses, updateProgress, deleteUniverse } from "../api/api";
import Graph from "../components/graph";
import AnimeBar from "../components/animebar";
import UniverseList from "../components/universelist";
import { sideStyle } from "../components/styles";

function SpecialGroup({ format, nodes, allNodes, edges, onProgressChange, onSkip, onRemove }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            marginBottom: "10px",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            overflow: "hidden"
        }}>
            <div
                onClick={() => setOpen(!open)}
                style={{
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer"
                }}
            >
                <span style={{ fontWeight: "600", fontSize: "15px" }}>
                    {format} ({nodes.length})
                </span>
                <span>{open ? "▲" : "▼"}</span>
            </div>

            {open && (
                <div style={{ padding: "0 12px 12px 12px" }}>
                    {nodes.map(node => (
                        <AnimeBar
                            key={node.id}
                            node={node}
                            nodes={allNodes}
                            edges={edges}
                            onProgressChange={onProgressChange}
                            onSkip={onSkip}
                            onRemove={onRemove}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Universe({ id, onBack, onOpenUniverse }) {
    const [data, setData] = useState(null);
    const [universes, setUniverses] = useState([]);

    useEffect(() => {
        loadUniverse();
    }, [id]);

    // laedt das Universe und die Liste links (Status/Prozent aendern sich beim Schauen)
    async function loadUniverse() {
        const [universe, list] = await Promise.all([getUniverse(id), getUniverses()]);
        setData(universe);
        setUniverses(list.universes);
    }

    async function handleDelete() {
        if (confirm("Dieses Universe wirklich löschen?")) {
            await deleteUniverse(id);
            onBack();
        }
    }

    const EXCLUDE_FORMATS = ["MANGA", "NOVEL", "ONE_SHOT", "MUSIC", "MANHWA", "MANHUA"];

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            minWidth: "900px",
            alignItems: "stretch",
            minHeight: "100vh",
            background: "#fffaf5",
            fontFamily: "sans-serif"
        }}>

            {/* Linke Spalte: Meine Universen */}
            <div style={sideStyle("left")}>
                <UniverseList
                    universes={universes}
                    onOpenUniverse={onOpenUniverse}
                    activeId={id}
                    compact
                />
            </div>

            {/* Mitte: das Universe */}
            <div style={{ flex: 1, minWidth: 0, padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <button
                        onClick={onBack}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: "1px solid #fdba74",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: "13px"
                        }}
                    >
                        ← Back
                    </button>

                    <button
                        onClick={handleDelete}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: "1px solid #fca5a5",
                            background: "#fff",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "500"
                        }}
                    >
                        Löschen
                    </button>
                </div>

                {!data && <div>Loading...</div>}

                {data && (
                    <>
                        <h1 style={{ margin: "0 0 16px 0", color: "#ea580c" }}>{data.name}</h1>

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
                            onNodeClick={(nodeId) => {
                                document.getElementById(nodeId)?.scrollIntoView({
                                    behavior: "smooth"
                                });
                            }}
                        />

                        {/* Bars */}
                        <div>
                            {/* Hauptstory */}
                            {data.main_nodes.filter(n => !EXCLUDE_FORMATS.includes(n.format)).map(node => (
                                <AnimeBar
                                    key={node.id}
                                    node={node}
                                    nodes={data.nodes}
                                    edges={data.edges}
                                    onProgressChange={async (node, progress) => {
                                        await updateProgress(node.id, progress);
                                        loadUniverse();
                                    }}
                                    onSkip={loadUniverse}
                                    onRemove={loadUniverse}
                                />
                            ))}

                            {/* Specials gruppiert */}
                            {Object.entries(data.specials_grouped)
                                .filter(([format]) => !EXCLUDE_FORMATS.includes(format))
                                .map(([format, nodes]) => (
                                <SpecialGroup
                                    key={format}
                                    format={format}
                                    nodes={nodes}
                                    allNodes={data.nodes}
                                    edges={data.edges}
                                    onProgressChange={async (node, progress) => {
                                        await updateProgress(node.id, progress);
                                        loadUniverse();
                                    }}
                                    onSkip={loadUniverse}
                                    onRemove={loadUniverse}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
