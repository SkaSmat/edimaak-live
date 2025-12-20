import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" ? componentTagger() : null,
    // Bundle analyzer - run 'npm run build' to generate stats.html
    process.env.ANALYZE ? visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }) : null,
  ].filter(Boolean) as any,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimized build configuration for better code splitting and performance
  build: {
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunks for better caching and parallel loading
        manualChunks: (id) => {
          // Core React libraries - Changes rarely, cache forever
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }

          // Supabase - Separate chunk for API layer
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }

          // React Query - Separate for data fetching
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }

          // Radix UI components - Large UI library
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui-radix';
          }

          // Lucide icons - Separate chunk for icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }

          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }

          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
}));
