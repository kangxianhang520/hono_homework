import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    entries: ["src/**/*.{ts,tsx}"],
  },
  plugins: [varlockVitePlugin({ ssrInjectMode: "auto-load" }), tailwindcss(), reactRouter()],
});
