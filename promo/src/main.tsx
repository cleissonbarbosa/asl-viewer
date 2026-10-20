import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Promo, DURATION } from "./Promo";
import "./styles.css";

declare global {
  interface Window {
    __VIRTUAL_TIME__?: boolean;
    __onFrame?: (now: number) => void;
    __ready?: boolean;
    __duration?: number;
  }
}

/*
 * The camera moves of the video are CSS transforms on the app windows. They
 * are a video effect, not part of the page: the viewer measures its canvas,
 * nodes and handles as if they were not scaled, exactly like in a real app.
 */
const measure = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function (this: Element) {
  const rect = measure.call(this);
  if (!(this instanceof HTMLElement)) return rect;
  if (this.classList.contains("asl-canvas")) {
    return new DOMRect(rect.x, rect.y, this.offsetWidth, this.offsetHeight);
  }
  if (this.matches(".react-flow__node, .react-flow__handle")) {
    const frame = this.closest<HTMLElement>(".window");
    const scale = frame ? measure.call(frame).width / frame.offsetWidth : 1;
    if (scale > 0 && scale !== 1) {
      return new DOMRect(
        rect.x / scale,
        rect.y / scale,
        rect.width / scale,
        rect.height / scale,
      );
    }
  }
  return rect;
};

const App: React.FC = () => {
  const [t, setT] = useState(0);

  useEffect(() => {
    window.__duration = DURATION;
    window.__onFrame = (now) => flushSync(() => setT(now));
    // Every face is loaded up front so no frame renders a fallback font
    const faces = [
      '400 20px "Inter"',
      '500 20px "Inter"',
      '600 20px "Inter"',
      '700 20px "Inter"',
      '800 20px "Inter"',
      '500 20px "JetBrains Mono"',
      '600 20px "JetBrains Mono"',
    ];
    Promise.all(faces.map((face) => document.fonts.load(face)))
      .then(() => document.fonts.ready)
      .then(() => {
        window.__ready = true;
      });

    // Outside the recorder the composition simply plays in real time
    if (window.__VIRTUAL_TIME__) return;
    let frame = 0;
    const start = performance.now();
    const loop = () => {
      window.__onFrame?.((performance.now() - start) % DURATION);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <Promo t={t} />;
};

createRoot(document.getElementById("root")!).render(<App />);
