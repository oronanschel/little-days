import { defineConfig } from 'vite';

// Keep the exported game portable to a domain root or a static-hosting subfolder.
export default defineConfig({ base: './' });
