import { useEffect, useState } from "react";

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

// Weisse Seitenspalte (links/rechts) mit Trennlinie, volle Hoehe
export const sideStyle = (narrow, side) => ({
    width: narrow ? "auto" : "380px",
    flexShrink: 0,
    boxSizing: "border-box",
    background: "#fff",
    padding: "24px 20px 80px 20px",
    [side === "left" ? "borderRight" : "borderLeft"]: "1px solid #fed7aa",
    ...(narrow ? {} : { position: "sticky", top: 0, height: "100vh", overflowY: "auto", alignSelf: "flex-start" })
});

// true, wenn das Fenster schmal ist (Spalten werden dann gestapelt)
export function useNarrow(breakpoint = 1000) {
    const [narrow, setNarrow] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
        const onResize = () => setNarrow(window.innerWidth < breakpoint);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [breakpoint]);

    return narrow;
}
