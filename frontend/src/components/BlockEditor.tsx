import React, { useState } from "react";
import { tokens } from "../shared/theme";
import { Button } from "./Button";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type BlockType = "text" | "image" | "video" | "button";

export type Block = {
  id: string;
  type: BlockType;
  data: Record<string, any>;
};

type Props = {
  initial?: Block[];
  onChange?: (blocks: Block[]) => void;
};

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform) || undefined,
    transition: transition || undefined
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export const BlockEditor: React.FC<Props> = ({ initial = [], onChange }) => {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  const sensors = useSensors(useSensor(PointerSensor));

  function emit(next: Block[]) {
    setBlocks(next);
    onChange?.(next);
  }

  function add(type: BlockType) {
    const id = Math.random().toString(36).slice(2);
    const base: Record<string, any> =
      type === "text" ? { text: "write something…" } :
      type === "image" ? { url: "", alt: "" } :
      type === "video" ? { url: "" } :
      { label: "click me", href: "#" };
    emit([...blocks, { id, type, data: base }]);
  }

  function remove(id: string) {
    emit(blocks.filter(b => b.id !== id));
  }

  function update(index: number, data: Record<string, any>) {
    const next = [...blocks];
    next[index] = { ...next[index], data };
    emit(next);
  }

  return (
    <div style={{ fontFamily: tokens.font.family }}>
      <div style={{ display: "flex", gap: tokens.spacing(2), marginBottom: tokens.spacing(3) }}>
        {(["text","image","video","button"] as BlockType[]).map(t =>
          <Button key={t} onClick={() => add(t)}>{t}</Button>
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;
          const oldIndex = blocks.findIndex(b => b.id === active.id);
          const newIndex = blocks.findIndex(b => b.id === over.id);
          emit(arrayMove(blocks, oldIndex, newIndex));
        }}
      >
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: "grid", gap: tokens.spacing(3) }}>
            {blocks.map((b, i) => (
              <SortableItem key={b.id} id={b.id}>
                <div style={{ padding: tokens.spacing(4), border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: tokens.spacing(2) }}>
                    <div style={{ textTransform: "lowercase", color: tokens.color.textMuted }}>{b.type} block</div>
                    <div style={{ display: "flex", gap: tokens.spacing(2) }}>
                      <Button variant="ghost" onClick={() => remove(b.id)}>remove</Button>
                    </div>
                  </div>
                  {b.type === "text" && (
                    <textarea
                      value={b.data.text}
                      onChange={(e) => update(i, { text: e.target.value })}
                      style={{ width: "100%", minHeight: 100, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.spacing(3), fontFamily: tokens.font.family }}
                    />
                  )}
                  {b.type === "image" && (
                    <div style={{ display: "grid", gap: tokens.spacing(2) }}>
                      <input placeholder="image url" value={b.data.url} onChange={(e) => update(i, { ...b.data, url: e.target.value })} style={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.spacing(2) }} />
                      <input placeholder="alt text" value={b.data.alt} onChange={(e) => update(i, { ...b.data, alt: e.target.value })} style={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.spacing(2) }} />
                    </div>
                  )}
                  {b.type === "video" && (
                    <input placeholder="video url (embed)" value={b.data.url} onChange={(e) => update(i, { url: e.target.value })} style={{ width: "100%", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.spacing(2) }} />
                  )}
                  {b.type === "button" && (
                    <div style={{ display: "grid", gap: tokens.spacing(2), gridTemplateColumns: "1fr 1fr" }}>
                      <input placeholder="label" value={b.data.label} onChange={(e) => update(i, { ...b.data, label: e.target.value })} style={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.spacing(2) }} />
                      <input placeholder="href" value={b.data.href} onChange={(e) => update(i, { ...b.data, href: e.target.value })} style={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.spacing(2) }} />
                    </div>
                  )}
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
