import React, { useState } from "react";
import { tokens } from "../shared/theme";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { DevicePreview } from "../components/DevicePreview";
import { BlockEditor, Block } from "../components/BlockEditor";

type ProjectMeta = {
  id: string;
  title: string;
  cover?: string;
  summary?: string;
  status?: "draft" | "published";
};

type Props = {
  projects?: ProjectMeta[];
  onPublishProfile?: (blocks: Block[]) => void;
};

export const PortfolioEditor: React.FC<Props> = ({ projects = [], onPublishProfile }) => {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "hero1", type: "text", data: { text: "hello, i’m a creative technologist." } }
  ]);

  return (
    <div style={{ fontFamily: tokens.font.family, color: tokens.color.text }}>
      <div style={{ marginBottom: tokens.spacing(6), display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, fontSize: "1.5rem" }}>portfolio editor</div>
        <Button onClick={() => onPublishProfile?.(blocks)}>publish profile</Button>
      </div>

      <Card title="layout blocks">
        <BlockEditor initial={blocks} onChange={setBlocks} />
      </Card>

      <Card title="preview">
        <DevicePreview>
          <div style={{ padding: tokens.spacing(6) }}>
            {blocks.map(b => {
              if (b.type === "text") return <p key={b.id} style={{ fontSize: "1.25rem", marginBottom: tokens.spacing(3) }}>{b.data.text}</p>;
              if (b.type === "image") return <img key={b.id} src={b.data.url} alt={b.data.alt || ""} style={{ maxWidth: "100%", marginBottom: tokens.spacing(3) }} />;
              if (b.type === "video") return <div key={b.id} style={{ marginBottom: tokens.spacing(3) }}><iframe src={b.data.url} width="100%" height={360} /></div>;
              if (b.type === "button") return <a key={b.id} href={b.data.href} style={{ display: "inline-block", padding: "0.75rem 1rem", background: tokens.color.primary, color: "#fff", borderRadius: tokens.radius.lg, textDecoration: "none", marginBottom: tokens.spacing(3) }}>{b.data.label}</a>;
              return null;
            })}
            <div style={{ marginTop: tokens.spacing(8) }}>
              <div style={{ fontWeight: 600, marginBottom: tokens.spacing(3) }}>featured projects</div>
              {projects.length === 0 ? (
                <EmptyState title="no projects yet" description="add projects to feature them on your portfolio." />
              ) : (
                <div style={{ display: "grid", gap: tokens.spacing(4), gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                  {projects.map(p => (
                    <div key={p.id} style={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, padding: tokens.spacing(3) }}>
                      {p.cover && <img src={p.cover} alt="" style={{ width: "100%", borderRadius: tokens.radius.md, marginBottom: tokens.spacing(2) }} />}
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      {p.summary && <div style={{ color: tokens.color.textMuted, fontSize: "0.9rem" }}>{p.summary}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DevicePreview>
      </Card>
    </div>
  );
};
