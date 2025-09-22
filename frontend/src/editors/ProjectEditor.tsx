import React, { useState } from "react";
import { tokens } from "../shared/theme";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { DevicePreview } from "../components/DevicePreview";
import { BlockEditor, Block } from "../components/BlockEditor";

type Project = {
  title: string;
  role?: string;
  dateStart?: string;
  dateEnd?: string;
  tools?: string[];
  problem?: string;
  solution?: string;
  outcomes?: string;
  keyTakeaways?: string[];
  coverUrl?: string;
};

type Props = {
  initial?: Project;
  onSave?: (project: Project, blocks: Block[]) => void;
  onPublish?: (project: Project, blocks: Block[]) => void;
};

export const ProjectEditor: React.FC<Props> = ({ initial, onSave, onPublish }) => {
  const [project, setProject] = useState<Project>(initial || { title: "" });
  const [blocks, setBlocks] = useState<Block[]>([]);

  function set<K extends keyof Project>(k: K, v: Project[K]) {
    setProject(p => ({ ...p, [k]: v }));
  }

  const field = (label: string, input: React.ReactNode) => (
    <div style={{ display: "grid", gap: tokens.spacing(1) }}>
      <label style={{ color: tokens.color.textMuted, textTransform: "lowercase" }}>{label}</label>
      {input}
    </div>
  );

  const inputStyle: React.CSSProperties = { border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.spacing(3) };

  return (
    <div style={{ fontFamily: tokens.font.family, color: tokens.color.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: tokens.spacing(6) }}>
        <div style={{ fontWeight: 700, fontSize: "1.5rem" }}>project editor</div>
        <div style={{ display: "flex", gap: tokens.spacing(2) }}>
          <Button variant="ghost" onClick={() => onSave?.(project, blocks)}>save</Button>
          <Button onClick={() => onPublish?.(project, blocks)}>publish</Button>
        </div>
      </div>

      <div style={{ display: "grid", gap: tokens.spacing(6), gridTemplateColumns: "1fr 1fr" }}>
        <Card title="details">
          <div style={{ display: "grid", gap: tokens.spacing(3) }}>
            {field("title", <input value={project.title} onChange={(e)=>set("title", e.target.value)} style={inputStyle} />)}
            {field("role", <input value={project.role||""} onChange={(e)=>set("role", e.target.value)} style={inputStyle} />)}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: tokens.spacing(3) }}>
              {field("start", <input type="date" value={project.dateStart||""} onChange={(e)=>set("dateStart", e.target.value)} style={inputStyle} />)}
              {field("end", <input type="date" value={project.dateEnd||""} onChange={(e)=>set("dateEnd", e.target.value)} style={inputStyle} />)}
            </div>
            {field("tools (comma separated)", <input value={(project.tools||[]).join(", ")} onChange={(e)=>set("tools", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} style={inputStyle} />)}
          </div>
        </Card>

        <Card title="pcsi narrative">
          <div style={{ display: "grid", gap: tokens.spacing(3) }}>
            {field("problem", <textarea value={project.problem||""} onChange={(e)=>set("problem", e.target.value)} style={{ ...inputStyle, minHeight: 100 }} />)}
            {field("solution", <textarea value={project.solution||""} onChange={(e)=>set("solution", e.target.value)} style={{ ...inputStyle, minHeight: 100 }} />)}
            {field("outcomes", <textarea value={project.outcomes||""} onChange={(e)=>set("outcomes", e.target.value)} style={{ ...inputStyle, minHeight: 100 }} />)}
            {field("key takeaways (one per line)", <textarea value={(project.keyTakeaways||[]).join("\n")} onChange={(e)=>set("keyTakeaways", e.target.value.split("\n").map(s=>s.trim()).filter(Boolean))} style={{ ...inputStyle, minHeight: 100 }} />)}
          </div>
        </Card>

        <Card title="content blocks">
          <BlockEditor initial={blocks} onChange={setBlocks} />
        </Card>

        <Card title="preview">
          <DevicePreview>
            <article style={{ padding: tokens.spacing(6) }}>
              <h1 style={{ fontSize: "2rem", marginBottom: tokens.spacing(3) }}>{project.title || "untitled project"}</h1>
              <div style={{ color: tokens.color.textMuted, marginBottom: tokens.spacing(5) }}>
                {[project.role, project.tools?.join(" • "), project.dateStart && project.dateEnd ? `${project.dateStart} – ${project.dateEnd}` : ""].filter(Boolean).join(" · ")}
              </div>
              <section style={{ display: "grid", gap: tokens.spacing(3), marginBottom: tokens.spacing(6) }}>
                {project.problem && <p><strong>problem:</strong> {project.problem}</p>}
                {project.solution && <p><strong>solution:</strong> {project.solution}</p>}
                {project.outcomes && <p><strong>outcomes:</strong> {project.outcomes}</p>}
                {project.keyTakeaways && project.keyTakeaways.length > 0 && (
                  <ul style={{ marginLeft: "1rem", listStyle: "disc" }}>
                    {project.keyTakeaways.map((k, idx) => <li key={idx}>{k}</li>)}
                  </ul>
                )}
              </section>
              {blocks.map(b => {
                if (b.type === "text") return <p key={b.id} style={{ marginBottom: tokens.spacing(3) }}>{b.data.text}</p>;
                if (b.type === "image") return <img key={b.id} src={b.data.url} alt={b.data.alt || ""} style={{ maxWidth: "100%", marginBottom: tokens.spacing(3) }} />;
                if (b.type === "video") return <div key={b.id} style={{ marginBottom: tokens.spacing(3) }}><iframe src={b.data.url} width="100%" height={360} /></div>;
                if (b.type === "button") return <a key={b.id} href={b.data.href} style={{ display: "inline-block", padding: "0.75rem 1rem", background: tokens.color.primary, color: "#fff", borderRadius: tokens.radius.lg, textDecoration: "none", marginBottom: tokens.spacing(3) }}>{b.data.label}</a>;
                return null;
              })}
            </article>
          </DevicePreview>
        </Card>
      </div>
    </div>
  );
};
