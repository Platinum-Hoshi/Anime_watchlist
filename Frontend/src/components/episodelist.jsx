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
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px"
                }}
            >
                <input
                    type="checkbox"
                    checked={watched}
                    onChange={() => onEpisodeClick(i)}
                />
                <span>
                    Episode {i}
                </span>
            </div>
        );
    }
    return (
        <div style={{ marginTop: "10px" }}>
            {items}
        </div>
    );
}