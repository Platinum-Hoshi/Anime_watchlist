import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function Graph({ nodes, edges, onNodeClick }) {
    const containerRef = useRef(null);
    useEffect(() => {
        if (!containerRef.current) return;
        const cy = cytoscape({
            container: containerRef.current,
            elements: [
                ...nodes.map(n => ({
                    data: {
                        id: String(n.id),
                        label: n.title,
                        color: n.color
                    }
                })),

                ...edges.map(e => ({
                    data: {
                        source: String(e.source),
                        target: String(e.target),
                        label: e.type
                    }
                }))
            ],

            style: [
                {
                    selector: "node",
                    style: {
                        "label": "data(label)",
                        "background-color": "center",
                        "color": "#fff",
                        "font-size": "10px"
                    }
                },
                {
                    selector: "edge",
                    style: {
                        "line-color": "#aaa",
                        "width": 2,
                        "target-arrow-shape": "triangle",
                        "target-arrow-color": "#aaa"
                    }
                }
            ],
            layout: {
                name: "cose"
            }
        });
        cy.on("tap", "node", (event) => {
            const node = event.target.data();
        });
        return () => cy.destroy();
    }, [nodes, edges]);
    return (
        <div
            ref={containerRef}
            style={{ widht: "100%", height: "400px" }}
        />
    );
}

