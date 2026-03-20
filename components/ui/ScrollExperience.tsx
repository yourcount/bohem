"use client";

import { useEffect } from "react";

export function ScrollExperience() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const root = document.documentElement;
    let rafId = 0;
    let maxScroll = 1;

    const updateMaxScroll = () => {
      maxScroll = Math.max(root.scrollHeight - window.innerHeight, 1);
    };

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      root.style.setProperty("--page-scroll-progress", progress.toFixed(4));
      rafId = 0;
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateProgress);
    };

    const onResize = () => {
      updateMaxScroll();
      onScroll();
    };

    updateMaxScroll();
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <div aria-hidden="true" className="scroll-tint-overlay" />;
}
