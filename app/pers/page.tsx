import { generateLandingMetadata, renderLandingPage } from "@/lib/landing-page-runtime";

export const revalidate = 90;

export async function generateMetadata() {
  return generateLandingMetadata("press");
}

export default async function PersLandingPage() {
  return renderLandingPage("press");
}
