// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    // Overridden by NUXT_WHATSAPP_* environment variables
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
    whatsappVerifyToken: '',
    whatsappAppSecret: '',
  },
})
