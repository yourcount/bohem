import { generateLandingMetadata, renderLandingPage } from "@/lib/landing-page-runtime";

export const revalidate = 90;

export async function generateMetadata() {
  return generateLandingMetadata("liveMusic");
}

export default async function LiveMusicLandingPage() {
  return renderLandingPage("liveMusic");
}
