export default function EpisodeList({
    episodes,
    progress,
    onEpisodeClick
}) {
    const items = [];
    for (let i = 1; i <= episodes; i++) {
        const watched = i <= progress;
        items.push(
            <div
                key={i}
                onClick={() => onEpisodeClick(i)}
                title={`Episode ${i}`}
                style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: watched ? "#16a34a" : "#e5e7eb",
                    border: watched ? "2px solid #15803d" : "2px solid #d1d5db",
                }}
            />
        );
    }
    return (
        <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: "12px",
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "8px"
        }}>
            {items}
        </div>
    );
}
