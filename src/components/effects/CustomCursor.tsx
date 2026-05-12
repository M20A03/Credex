"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Only on desktop
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
      const el = e.target as HTMLElement;
      const isClickable =
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.tagName === "INPUT" ||
        el.tagName === "SELECT" ||
        el.tagName === "LABEL" ||
        el.closest("button") ||
        el.closest("a") ||
        el.style.cursor === "pointer" ||
        window.getComputedStyle(el).cursor === "pointer";
      ring.classList.toggle("hovering", !!isClickable);
    };

    const animate = () => {
      const dx = mousePos.current.x - ringPos.current.x;
      const dy = mousePos.current.y - ringPos.current.y;
      ringPos.current.x += dx * 0.12;
      ringPos.current.y += dy * 0.12;
      ring.style.left = `${ringPos.current.x}px`;
      ring.style.top = `${ringPos.current.y}px`;
      rafRef.current = requestAnimationFrame(animate);
    };

    // Click sparkle effect
    const onMouseDown = (e: MouseEvent) => {
      const sparkle = document.createElement("div");
      sparkle.style.cssText = `
        position:fixed;left:${e.clientX}px;top:${e.clientY}px;
        width:20px;height:20px;border-radius:50%;
        background:rgba(109,40,217,0.6);
        transform:translate(-50%,-50%) scale(0);
        animation:sparkle-burst 0.5s ease-out forwards;
        pointer-events:none;z-index:99997;
      `;
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 500);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mousedown", onMouseDown);
    rafRef.current = requestAnimationFrame(animate);

    // Inject sparkle keyframe
    const style = document.createElement("style");
    style.textContent = `
      @keyframes sparkle-burst {
        0%   { transform: translate(-50%,-50%) scale(0); opacity:1; }
        100% { transform: translate(-50%,-50%) scale(3); opacity:0; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mousedown", onMouseDown);
      cancelAnimationFrame(rafRef.current);
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
