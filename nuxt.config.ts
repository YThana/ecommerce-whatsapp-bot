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

  runtimeConfig: {
    // Overridden by NUXT_WHATSAPP_* environment variables
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
    whatsappVerifyToken: '',
    whatsappAppSecret: '',
  },
})
