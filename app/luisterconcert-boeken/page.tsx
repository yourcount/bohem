import { generateLandingMetadata, renderLandingPage } from "@/lib/landing-page-runtime";

export const revalidate = 90;

export async function generateMetadata() {
  return generateLandingMetadata("listeningConcert");
}

export default async function ListeningConcertLandingPage() {
  return renderLandingPage("listeningConcert");
}
