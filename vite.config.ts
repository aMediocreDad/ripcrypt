import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";


export default defineConfig({
  base: "/systems/ripcrypt/",
  server: {
    port: 30001,
    open: true,
    proxy: {
      "^(?!/systems/ripcrypt)": "http://localhost:30000/",
      "/socket.io": {
        target: "ws://localhost:30000",
        ws: true,
      },
    },
  },
  build: {
    outDir: ".",
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      name: "ripcrypt",
      entry: "src/ripcrypt.ts",
      formats: ["es"],
      fileName: "ripcrypt",
    },
  },
  plugins: [svelte()],
});
