import React from "react";
import { tokens } from "../shared/theme";
import { Button } from "./Button";

type Props = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState: React.FC<Props> = ({ icon, title, description, actionLabel, onAction }) => {
  const box: React.CSSProperties = {
    border: `1px dashed ${tokens.color.border}`,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing(10),
    textAlign: "center" as const,
    fontFamily: tokens.font.family,
    background: tokens.color.bg,
    color: tokens.color.text
  };
  const t: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 600, marginBottom: tokens.spacing(2) };
  const d: React.CSSProperties = { color: tokens.color.textMuted, marginBottom: tokens.spacing(4) };
  return (
    <div style={box}>
      {icon && <div style={{ marginBottom: tokens.spacing(3) }}>{icon}</div>}
      <div style={t}>{title}</div>
      {description && <div style={d}>{description}</div>}
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
};
