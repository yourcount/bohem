"use client";

import dynamic from "next/dynamic";

const ConditionalLiquidBackground = dynamic(
  () => import("@/components/ui/ConditionalLiquidBackground").then((mod) => mod.ConditionalLiquidBackground),
  { ssr: false }
);

export function DeferredBackground() {
  return <ConditionalLiquidBackground />;
}
