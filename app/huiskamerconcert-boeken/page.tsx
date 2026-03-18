import { generateLandingMetadata, renderLandingPage } from "@/lib/landing-page-runtime";

export const revalidate = 90;

export async function generateMetadata() {
  return generateLandingMetadata("huiskamerconcert");
}

export default async function HuiskamerconcertLandingPage() {
  return renderLandingPage("huiskamerconcert");
}
