"use client";

import { useEffect, type ReactNode } from "react";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let vivo = true;
    let limpar: (() => void) | undefined;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"), import("gsap"), import("gsap/ScrollTrigger"),
      ]);
      if (!vivo) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: true });
      const onScroll = () => ScrollTrigger.update();
      const tick = (t: number) => lenis.raf(t * 1000);

      lenis.on("scroll", onScroll);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      limpar = () => {
        gsap.ticker.remove(tick);
        lenis.off("scroll", onScroll);
        lenis.destroy();
      };
    })();

    return () => { vivo = false; limpar?.(); };
  }, []);

  return <>{children}</>;
}
