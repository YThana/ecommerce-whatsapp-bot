// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  vite: {
    server: {
      // Let webhook tunnels reach the dev server (dev only; unused in production)
      allowedHosts: ['.trycloudflare.com'],
    },
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { redirect: '/admin' },
    // The admin is a client-rendered app behind cookie auth — no SSR needed
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
  },

  runtimeConfig: {
    // Overridden by NUXT_WHATSAPP_* environment variables
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
    whatsappVerifyToken: '',
    whatsappAppSecret: '',
    // Admin dashboard auth
    adminPassword: '',
    sessionPassword: '',
  },
})
