import React from "react";
import { Card } from "./Card";
import { tokens } from "../shared/theme";

type Props = {
  label: string;
  value: string | number;
  delta?: number; // percentage
  footnote?: string;
};

export const DashboardCard: React.FC<Props> = ({ label, value, delta, footnote }) => {
  const deltaColor = delta === undefined ? tokens.color.textMuted : (delta >= 0 ? tokens.color.primary : "#ef4444");
  const deltaSign = delta === undefined ? "" : (delta >= 0 ? "+" : "");
  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing(2) }}>
        <div style={{ color: tokens.color.textMuted, textTransform: "lowercase" }}>{label}</div>
        <div style={{ fontSize: "2rem", fontWeight: 700 }}>{value}</div>
        {delta !== undefined && (
          <div style={{ color: deltaColor }}>{deltaSign}{delta}%</div>
        )}
        {footnote && <div style={{ color: tokens.color.textMuted, fontSize: "0.85rem" }}>{footnote}</div>}
      </div>
    </Card>
  );
};
