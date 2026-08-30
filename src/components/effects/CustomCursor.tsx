"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Only run on desktop devices with pointer support
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 1024px)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;

    dot.style.display = "block";
    ring.style.display = "block";

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
    };

    const onMouseOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const isClickable =
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.tagName === "INPUT" ||
        el.tagName === "SELECT" ||
        el.tagName === "LABEL" ||
        Boolean(el.closest("button")) ||
        Boolean(el.closest("a")) ||
        el.style.cursor === "pointer" ||
        window.getComputedStyle(el).cursor === "pointer";
      ring.classList.toggle("hovering", Boolean(isClickable));
    };

    const animate = () => {
      const dx = mousePos.current.x - ringPos.current.x;
      const dy = mousePos.current.y - ringPos.current.y;
      ringPos.current.x += dx * 0.15;
      ringPos.current.y += dy * 0.15;
      ring.style.left = `${ringPos.current.x}px`;
      ring.style.top = `${ringPos.current.y}px`;
      rafRef.current = requestAnimationFrame(animate);
    };

    // Click sparkle burst effect
    const sparkles: HTMLDivElement[] = [];
    const onMouseDown = (e: MouseEvent) => {
      const sparkle = document.createElement("div");
      sparkle.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--accent-primary, #6D28D9);
        transform: translate(-50%, -50%) scale(0);
        animation: sparkle-burst 0.45s ease-out forwards;
        pointer-events: none;
        z-index: 99997;
        opacity: 0.6;
      `;
      document.body.appendChild(sparkle);
      sparkles.push(sparkle);
      setTimeout(() => {
        sparkle.remove();
        const idx = sparkles.indexOf(sparkle);
        if (idx !== -1) sparkles.splice(idx, 1);
      }, 450);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    // Sparkle keyframe injection
    const styleId = "cursor-sparkle-style";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes sparkle-burst {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(3.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mousedown", onMouseDown);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      sparkles.forEach((s) => s.remove());
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null;
}
