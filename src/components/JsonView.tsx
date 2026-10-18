import React, { useMemo } from "react";

const TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],])/g;

/**
 * Splits pretty-printed JSON into highlighted React elements (no
 * `dangerouslySetInnerHTML`).
 */
export function highlightJson(json: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  json.replace(
    TOKEN,
    (
      match,
      str: string,
      colon: string,
      num: string,
      lit: string,
      punct: string,
      offset: number,
    ) => {
      if (offset > last) nodes.push(json.slice(last, offset));
      if (str) {
        nodes.push(
          <span
            key={key++}
            className={colon ? "asl-json__key" : "asl-json__string"}
          >
            {str}
          </span>,
        );
        if (colon) nodes.push(colon);
      } else if (num) {
        nodes.push(
          <span key={key++} className="asl-json__number">
            {num}
          </span>,
        );
      } else if (lit) {
        nodes.push(
          <span key={key++} className="asl-json__literal">
            {lit}
          </span>,
        );
      } else if (punct) {
        nodes.push(
          <span key={key++} className="asl-json__punct">
            {punct}
          </span>,
        );
      }
      last = offset + match.length;
      return match;
    },
  );
  if (last < json.length) nodes.push(json.slice(last));
  return nodes;
}

/**
 * Pretty, syntax-highlighted JSON block.
 */
export const JsonView: React.FC<{ value: unknown; className?: string }> = ({
  value,
  className,
}) => {
  const content = useMemo(() => {
    const json = JSON.stringify(value, null, 2);
    return highlightJson(json ?? "undefined");
  }, [value]);

  return (
    <pre className={className ? `asl-json ${className}` : "asl-json"}>
      <code>{content}</code>
    </pre>
  );
};
