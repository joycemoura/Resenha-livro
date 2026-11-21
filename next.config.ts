import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { listReadings } from "./lib/catalogo";

export default async function config(phase: string): Promise<NextConfig> {
  if (phase === PHASE_PRODUCTION_BUILD) await listReadings();
  return {
    devIndicators: false,
    outputFileTracingIncludes: {
      "/": ["./resenhas/*.md", "./resenhas/frases/*.txt", "./public/capas/enviadas/*.webp"],
      "/indice": ["./resenhas/**/*.md"],
    },
  };
}
