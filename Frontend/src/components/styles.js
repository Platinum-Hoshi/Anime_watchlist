export const colTitle = {
    margin: "0 0 12px 0",
    fontSize: "15px",
    color: "#c2410c",
    fontWeight: "600"
};

export const inputStyle = {
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #fdba74",
    fontSize: "14px",
    boxSizing: "border-box"
};

// Weisse Seitenspalte (links/rechts) mit Trennlinie, volle Hoehe.
// Die Breite schrumpft mit dem Fenster (min 240px, max 380px); eingeklappt: schmaler Streifen.
export const sideStyle = (side, collapsed = false) => ({
    width: collapsed ? "48px" : "clamp(240px, 25vw, 380px)",
    flexShrink: 0,
    boxSizing: "border-box",
    background: "#fff",
    padding: collapsed ? "24px 0 80px 0" : "24px 20px 80px 20px",
    [side === "left" ? "borderRight" : "borderLeft"]: "1px solid #fed7aa",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    alignSelf: "flex-start"
});
