import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Ikon PWA dibuat dari public/favicon.svg:  npx pwa-assets-generator
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#f5eee2' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#f5eee2' } },
  },
  images: ['public/favicon.svg'],
});
