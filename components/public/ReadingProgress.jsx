"use client";

import { useEffect, useState } from "react";

/** Thin gold reading-progress line pinned under the sticky navigation. */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const height = doc.scrollHeight - doc.clientHeight;
      const value = height > 0 ? Math.min(100, Math.max(0, (doc.scrollTop / height) * 100)) : 0;
      setProgress(value);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="sticky top-12 z-30 h-0.5 w-full bg-line-dark/60" aria-hidden="true">
      <div className="h-full bg-gold transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
}
