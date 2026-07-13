<script setup lang="ts">
import { shallowRef } from 'vue'

const password = shallowRef('')
const error = shallowRef('')
const loading = shallowRef(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { password: password.value },
    })
    await navigateTo('/admin')
  }
  catch {
    error.value = 'Wrong password'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-screen">
    <form class="card login-card" @submit.prevent="submit">
      <h1 class="login-title">
        🛍️ Shop Admin
      </h1>
      <label class="label" for="password">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        class="field"
        autocomplete="current-password"
        autofocus
      >
      <p v-if="error" class="error-text">
        {{ error }}
      </p>
      <button class="btn btn-primary login-submit" type="submit" :disabled="loading || !password">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 340px;
  padding: 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.login-title {
  font-size: 1.15rem;
  margin-bottom: 0.8rem;
  text-align: center;
}

.login-submit {
  justify-content: center;
  margin-top: 0.4rem;
}
</style>
