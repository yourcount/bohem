import { generateLandingMetadata, renderLandingPage } from "@/lib/landing-page-runtime";

export const revalidate = 90;

export async function generateMetadata() {
  return generateLandingMetadata("kampvuur");
}

export default async function KampvuurklankenLandingPage() {
  return renderLandingPage("kampvuur");
}
