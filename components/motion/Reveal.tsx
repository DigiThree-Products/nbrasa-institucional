"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = { children: ReactNode; delay?: number; className?: string };

export function Reveal({ children, delay = 0, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let vivo = true;
    let matar: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!vivo) return;
      gsap.registerPlugin(ScrollTrigger);

      const tween = gsap.fromTo(
        el,
        { y: 38, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.75, ease: "power2.out", delay,
          // sem isto o elemento fica parado em opacity:0 ate o scroll chegar
          immediateRender: false,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
      matar = () => { tween.scrollTrigger?.kill(); tween.kill(); };
    })();

    return () => { vivo = false; matar?.(); };
  }, [delay]);

  return <div ref={ref} className={className}>{children}</div>;
}
