/**
 * Deterministic clock, injected before any page script runs.
 *
 * Timers, requestAnimationFrame, performance.now / Date.now and every Web
 * Animation (CSS transitions and keyframes included) follow a virtual clock
 * that only moves when the recorder calls `window.__tick(ms)`. Each frame is
 * therefore rendered at an exact point in time, however long the capture of
 * the previous frame took.
 */
(() => {
  const realSetTimeout = window.setTimeout.bind(window);
  const realRaf = window.requestAnimationFrame.bind(window);
  const epoch = Date.UTC(2026, 9, 20, 12, 0, 0);

  let now = 0;
  let nextId = 1;
  const timers = new Map();
  let frameCallbacks = new Map();

  performance.now = () => now;
  Date.now = () => epoch + now;

  const addTimer = (fn, delay, args, repeat) => {
    const id = nextId++;
    const ms = Math.max(0, Number(delay) || 0);
    timers.set(id, {
      id,
      fn,
      args,
      at: now + ms,
      interval: repeat ? ms : null,
    });
    return id;
  };

  window.setTimeout = (fn, delay, ...args) => addTimer(fn, delay, args, false);
  window.setInterval = (fn, delay, ...args) => addTimer(fn, delay, args, true);
  window.clearTimeout = (id) => void timers.delete(id);
  window.clearInterval = (id) => void timers.delete(id);
  window.requestAnimationFrame = (callback) => {
    const id = nextId++;
    frameCallbacks.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = (id) => void frameCallbacks.delete(id);

  /** Lets the real event loop run: React commits, effects and observers. */
  const yieldTask = () =>
    new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(0);
    });

  const settle = async (rounds = 3) => {
    for (let i = 0; i < rounds; i++) await yieldTask();
  };

  const startTimes = new WeakMap();

  /** Pins every running animation to the virtual clock. */
  const syncAnimations = () => {
    for (const animation of document.getAnimations()) {
      let start = startTimes.get(animation);
      if (start === undefined) {
        start = now;
        startTimes.set(animation, start);
      }
      const elapsed = now - start;
      const end = animation.effect?.getComputedTiming().endTime ?? 0;
      try {
        if (Number.isFinite(end) && elapsed >= end) {
          animation.finish();
        } else {
          animation.pause();
          animation.currentTime = elapsed;
        }
      } catch {
        // Animations removed mid-frame are ignored
      }
    }
  };

  const run = (fn, args) => {
    try {
      fn(...args);
    } catch (error) {
      console.error(error);
    }
  };

  window.__VIRTUAL_TIME__ = true;
  window.__now = () => now;

  window.__tick = async (ms) => {
    const target = now + ms;

    // Timers, in order
    for (;;) {
      let due = null;
      for (const timer of timers.values()) {
        if (timer.at > target) continue;
        if (
          !due ||
          timer.at < due.at ||
          (timer.at === due.at && timer.id < due.id)
        ) {
          due = timer;
        }
      }
      if (!due) break;
      now = Math.max(now, due.at);
      if (due.interval === null) timers.delete(due.id);
      else due.at += Math.max(1, due.interval);
      if (typeof due.fn === "function") run(due.fn, due.args);
      await settle(1);
      syncAnimations();
    }
    now = target;
    await settle();
    syncAnimations();

    // Animation frame callbacks
    const callbacks = frameCallbacks;
    frameCallbacks = new Map();
    for (const callback of callbacks.values()) run(callback, [now]);
    await settle();

    // The composition renders this frame
    window.__onFrame?.(now);
    await settle();
    syncAnimations();

    // One real rendering pass delivers ResizeObserver entries to React Flow
    await new Promise((resolve) => realRaf(() => realSetTimeout(resolve, 0)));
    await settle();
    syncAnimations();
  };
})();
