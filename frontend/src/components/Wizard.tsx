import React from "react";
import { tokens } from "../shared/theme";
import { Button } from "./Button";

type Step = {
  id: string;
  title: string;
  content: React.ReactNode;
  isValid?: boolean;
};

type Props = {
  steps: Step[];
  current: number;
  onNext: () => void;
  onBack: () => void;
  onFinish?: () => void;
};

export const Wizard: React.FC<Props> = ({ steps, current, onNext, onBack, onFinish }) => {
  const step = steps[current];
  const bar: React.CSSProperties = { display: "flex", gap: tokens.spacing(2), marginBottom: tokens.spacing(6) };
  return (
    <div style={{ fontFamily: tokens.font.family }}>
      <div style={bar}>
        {steps.map((s, i) => (
          <div key={s.id} style={{
            flex: 1,
            height: "6px",
            borderRadius: tokens.radius.md,
            background: i <= current ? tokens.color.primary : tokens.color.border
          }}/>
        ))}
      </div>
      <div style={{ marginBottom: tokens.spacing(4), fontWeight: 600 }}>{step.title}</div>
      <div style={{ marginBottom: tokens.spacing(6) }}>{step.content}</div>
      <div style={{ display: "flex", gap: tokens.spacing(3) }}>
        <Button variant="ghost" onClick={onBack} disabled={current===0}>back</Button>
        {current < steps.length - 1 ?
          <Button onClick={onNext}>next</Button> :
          <Button onClick={onFinish}>finish</Button>
        }
      </div>
    </div>
  );
};
