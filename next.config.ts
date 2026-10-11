import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Rutas que solo llevan a otra pantalla: se resuelven antes de renderizar,
  // así no hay una página que se corte con redirect() al prerenderizar.
  async redirects() {
    return [
      { source: "/", destination: "/planificador", permanent: false },
      { source: "/subgerente", destination: "/subgerente/planes", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
