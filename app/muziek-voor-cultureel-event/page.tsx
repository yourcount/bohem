import { generateLandingMetadata, renderLandingPage } from "@/lib/landing-page-runtime";

export const revalidate = 90;

export async function generateMetadata() {
  return generateLandingMetadata("culturalEvent");
}

export default async function CulturalEventLandingPage() {
  return renderLandingPage("culturalEvent");
}
