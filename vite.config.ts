import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    // ~14 000 tracés dans public/traces et autant dans dist : les surveiller sature le serveur de dev sous Windows
    // (les pages chargées à la demande, comme /voyage, n'arrivent plus et le clic semble ne rien faire)
    watch: { ignored: ['**/public/traces/**', '**/dist/**'] },
  },
  build: {
    // Fichiers générés (noms avec empreinte) dans /build, à part des images de public/assets :
    // render.yaml peut ainsi les mettre en cache longtemps.
    assetsDir: 'build',
    rollupOptions: {
      output: {
        // Bibliothèques lourdes dans des fichiers à part : mises en cache indépendamment du code du site
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          map: ['leaflet', 'react-leaflet', '@maptiler/leaflet-maptilersdk', '@maptiler/sdk'],
        },
      },
    },
  },
})
