import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        inquiry: resolve(__dirname, "inquiry.html"),
        inquiries: resolve(__dirname, "inquiries.html"),
      },
    },
  },
});
