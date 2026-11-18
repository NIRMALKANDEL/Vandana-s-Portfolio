import type { MetadataRoute } from "next";

// Installable as an app: opening it from the home screen goes straight to the writing desk.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/desk",
    name: "The Commonplace Book — Writing desk",
    short_name: "Commonplace",
    description: "Vandana's writing desk: write, save and publish from anywhere.",
    start_url: "/desk",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF6EF",
    theme_color: "#FBF6EF",
    categories: ["books", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [{ name: "New page", url: "/desk?new=1", icons: [{ src: "/icon-192.png", sizes: "192x192" }] }],
  };
}
