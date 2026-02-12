import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CleanBag",
    short_name: "CleanBag",
    description:
      "Professional bag cleaning services for food delivery drivers in Cyprus",
    start_url: "/login",
    display: "standalone",
    theme_color: "#eb2573",
    background_color: "#f9fafb",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
