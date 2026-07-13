<script setup lang="ts">
const links = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/products', label: 'Products', icon: '📦' },
  { to: '/admin/orders', label: 'Orders', icon: '🧾' },
  { to: '/admin/conversations', label: 'Conversations', icon: '💬' },
]

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="sidebar-logo">🛍️</span>
        <span>Shop Admin</span>
      </div>
      <nav class="sidebar-nav">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="sidebar-link"
          exact-active-class="sidebar-link-active"
        >
          <span aria-hidden="true">{{ link.icon }}</span>
          {{ link.label }}
        </NuxtLink>
      </nav>
      <button class="sidebar-logout" type="button" @click="logout">
        Sign out
      </button>
    </aside>
    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  flex-shrink: 0;
  background: #101826;
  color: #cbd5e1;
  padding: 1.1rem 0.8rem;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 700;
  color: #fff;
  padding: 0.3rem 0.6rem 1.1rem;
  font-size: 1.02rem;
}

.sidebar-logo {
  font-size: 1.3rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.6rem;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  font-size: 0.92rem;
  transition: background 0.15s, color 0.15s;
}

.sidebar-link:hover {
  background: rgb(255 255 255 / 0.06);
  color: #fff;
}

.sidebar-link-active {
  background: rgb(14 159 110 / 0.18);
  color: #4ade80;
  font-weight: 600;
}

.sidebar-logout {
  border: 1px solid rgb(255 255 255 / 0.15);
  background: none;
  color: inherit;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
}

.sidebar-logout:hover {
  background: rgb(255 255 255 / 0.06);
  color: #fff;
}

.admin-main {
  flex: 1;
  padding: 1.6rem 2rem;
  min-width: 0;
}

@media (max-width: 720px) {
  .admin-shell {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: static;
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    overflow-x: auto;
  }

  .sidebar-brand {
    padding: 0.3rem 0.6rem;
  }

  .sidebar-nav {
    flex-direction: row;
  }

  .admin-main {
    padding: 1.1rem;
  }
}
</style>
