import React from "react";

type Token = [text: string, kind?: string];

const LINES: Token[][] = [
  [
    ["import", "kw"],
    [" { "],
    ["WorkflowViewer", "fn"],
    [" } "],
    ["from", "kw"],
    [" "],
    ['"asl-viewer"', "str"],
    [";"],
  ],
  [["import", "kw"], [" "], ['"asl-viewer/style.css"', "str"], [";"]],
  [],
  [["export const", "kw"], [" "], ["App", "fn"], [" = () => ("]],
  [["  <"], ["WorkflowViewer", "tag"]],
  [["    "], ["definition", "attr"], ["={"], ["orderWorkflow", "var"], ["}"]],
  [["    "], ["theme", "attr"], ["="], ['"dark"', "str"]],
  [["    "], ["showToolbar", "attr"]],
  [["  />"]],
  [[");"]],
];

/** Time (ms from the start of typing) at which each character appears. */
const SCHEDULE: number[][] = (() => {
  let clock = 0;
  return LINES.map((line, index) => {
    const text = line.map(([part]) => part).join("");
    const fast = index < 2;
    const times = Array.from(text, (char) => {
      clock += fast ? 8 : char === " " ? 8 : 18;
      return clock;
    });
    clock += fast ? 40 : 80;
    return times;
  });
})();

export const TYPING_DURATION = SCHEDULE.flat().at(-1) ?? 0;

/** Editor card that types the quick-start snippet. */
export const CodeCard: React.FC<{ t: number }> = ({ t }) => {
  let caretLine = 0;
  let caretDone = false;
  const lines = LINES.map((line, index) => {
    const visible = SCHEDULE[index].filter((time) => time <= t).length;
    if (visible > 0 || index === 0) caretLine = index;
    if (index === LINES.length - 1 && visible === SCHEDULE[index].length) {
      caretDone = true;
    }
    let remaining = visible;
    const parts = line.map(([text, kind], partIndex) => {
      const shown = text.slice(0, Math.max(0, remaining));
      remaining -= text.length;
      return (
        <span key={partIndex} className={kind ? `tok-${kind}` : undefined}>
          {shown}
        </span>
      );
    });
    return { parts, visible };
  });
  const caretOn = !caretDone || Math.floor(t / 530) % 2 === 0;

  return (
    <div className="code">
      <div className="code__bar">
        <span className="dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="code__file">App.tsx</span>
      </div>
      <pre className="code__body">
        {lines.map(({ parts }, index) => (
          <div className="code__line" key={index}>
            <span className="code__gutter">{index + 1}</span>
            <span>
              {parts}
              {index === caretLine && caretOn && <span className="caret" />}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
};
