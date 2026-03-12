import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bohèm",
    short_name: "Bohèm",
    description: "Bohèm - melodische NL/EN songs met theatrale warmte.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1412",
    theme_color: "#1a1412",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
