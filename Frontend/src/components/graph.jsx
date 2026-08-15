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
                        "background-color": "data(color)",
                        "color": "#1a1a1a",
                        "font-size": "11px",
                        "text-valign": "bottom",
                        "text-margin-y": "4px",
                        "border-width": 2,
                        "border-color": "#fff",
                        "width": 40,
                        "height": 40
                    }
                },
                {
                    selector: "node[color = '#16a34a']",
                    style: {
                        "border-color": "#bbf7d0",
                        "border-width": 3
                    }
                },
                {
                    selector: "node[color = '#ca8a04']",
                    style: {
                        "border-color": '#fef08a",
                        "border-width": 3
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
            onNodeClick(node.id);
        });
        return () => cy.destroy();
    }, [nodes, edges]);
    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "400px",
                borderRadius: "12px",
                border: "1px solid #e0e0e0",
                marginBottom: "24px",
                background: "#fafafa"
            }}
        />
    );
}

