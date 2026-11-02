import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const alias = {
  "@": path.resolve(__dirname, "client"),
  "@shared": path.resolve(__dirname, "shared"),
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    env: {
      VITEST: "true",
    },
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "node",
          include: ["api/**/*.test.ts", "shared/**/*.spec.ts"],
          environment: "node",
          env: { VITEST: "true" },
          // TiDB Cloud under parallel integration load needs headroom.
          testTimeout: 45_000,
          hookTimeout: 90_000,
          fileParallelism: 2,
          maxWorkers: 2,
          sequence: { groupOrder: 0 },
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "jsdom",
          include: ["client/**/*.spec.ts", "client/**/*.spec.tsx"],
          environment: "jsdom",
          env: { VITEST: "true" },
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
});
