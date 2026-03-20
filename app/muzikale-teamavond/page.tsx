import { generateLandingMetadata, renderLandingPage } from "@/lib/landing-page-runtime";

export const revalidate = 90;

export async function generateMetadata() {
  return generateLandingMetadata("teamEvening");
}

export default async function TeamEveningLandingPage() {
  return renderLandingPage("teamEvening");
}
