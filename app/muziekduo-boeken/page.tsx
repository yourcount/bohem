import { generateLandingMetadata, renderLandingPage } from "@/lib/landing-page-runtime";

export const revalidate = 90;

export async function generateMetadata() {
  return generateLandingMetadata("musicDuo");
}

export default async function MusicDuoLandingPage() {
  return renderLandingPage("musicDuo");
}
