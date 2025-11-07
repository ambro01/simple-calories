// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    // Fix for React 19 + Cloudflare Pages: Use edge-compatible React DOM server
    // See: https://github.com/withastro/astro/issues/12824
    // eslint-disable-next-line no-undef
    resolve: process.env.CF_PAGES
      ? {
          alias: {
            "react-dom/server": "react-dom/server.edge",
          },
        }
      : {},
  },
  // eslint-disable-next-line no-undef
  adapter: process.env.CF_PAGES
    ? cloudflare({
        platformProxy: {
          enabled: true,
        },
      })
    : node({
        mode: "standalone",
      }),
});
