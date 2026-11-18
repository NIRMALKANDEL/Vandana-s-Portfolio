"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Sections fade up 24px as they enter (600 ms ease-out). Turned off for reduced motion by MotionConfig. */
export default function Reveal({ children, className, delay = 0, as = "div", id }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section"; id?: string }) {
  const M = as === "section" ? motion.section : motion.div;
  return (
    <M
      id={id}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </M>
  );
}
