import React, { useState } from "react";
import { tokens } from "../shared/theme";

type Mode = "desktop" | "tablet" | "mobile";

export const DevicePreview: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [mode, setMode] = useState<Mode>("desktop");
  const width = mode === "desktop" ? 1224 : mode === "tablet" ? 834 : 390;

  const tabBtn = (m: Mode) => (
    <button
      key={m}
      onClick={() => setMode(m)}
      style={{
        padding: "0.4rem 0.75rem",
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.color.border}`,
        background: mode === m ? tokens.color.highlight : "#fff",
        cursor: "pointer",
        textTransform: "lowercase" as const
      }}
    >{m}</button>
  );

  return (
    <div style={{ fontFamily: tokens.font.family }}>
      <div style={{ display: "flex", gap: tokens.spacing(2), marginBottom: tokens.spacing(3) }}>
        {["desktop","tablet","mobile"].map(m => tabBtn(m as Mode))}
      </div>
      <div style={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.xl, padding: tokens.spacing(2), overflow: "hidden" }}>
        <div style={{ margin: "0 auto", width }}>
          {children}
        </div>
      </div>
    </div>
  );
};
