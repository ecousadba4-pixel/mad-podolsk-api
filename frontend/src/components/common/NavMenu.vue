<script setup lang="ts">
/**
 * NavMenu — Navigation hamburger menu for switching between dashboard sections
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/authStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isAuthenticated, isAdmin, user } = storeToRefs(authStore)

const isOpen = ref(false)
const toggleRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<{ top: string; left: string } | null>(null)

interface NavItem {
  id: string
  label: string
  path: string
  icon: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { id: 'revenue', label: 'Выручка', path: '/', icon: 'chart' },
  { id: 'prices', label: 'Расценки', path: '/prices', icon: 'list' },
  { id: 'roads', label: 'Участки дороги', path: '/road-sections', icon: 'road' },
  { id: 'resources', label: 'Учет техники и людей', path: '/resources', icon: 'truck' },
  { id: 'mileage', label: 'Пробег машин', path: '/mileage', icon: 'mileage' },
  { id: 'users', label: 'Пользователи', path: '/users', icon: 'users', adminOnly: true },
]

const visibleNavItems = computed(() => {
  return navItems.filter(item => {
    if (item.adminOnly) {
      return isAdmin.value
    }
    return true
  })
})

const currentSection = computed(() => {
  const path = route.path
  if (path === '/' || path === '/daily' || path.startsWith('/smeta')) return 'revenue'
  if (path === '/prices') return 'prices'
  if (path === '/road-sections') return 'roads'
  if (path === '/resources') return 'resources'
  if (path === '/mileage') return 'mileage'
  if (path === '/users') return 'users'
  if (path === '/login') return ''
  return 'revenue'
})

function updateDropdownPosition() {
  if (!toggleRef.value) return
  const rect = toggleRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`
  }
}

function toggleMenu() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => updateDropdownPosition())
  }
}

function closeMenu() {
  isOpen.value = false
}

function navigateTo(path: string) {
  router.push(path)
  closeMenu()
}

async function handleLogout() {
  await authStore.logout()
  closeMenu()
  router.push('/login')
}

// Close menu on click outside
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  // Check if click is inside the nav-menu toggle or inside the dropdown (now teleported to body)
  if (!target.closest('.nav-menu') && !target.closest('.nav-menu__dropdown')) {
    closeMenu()
  }
}

// Close menu on Escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeMenu()
  }
}

// Update dropdown position on window resize/scroll
function handlePositionUpdate() {
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handlePositionUpdate)
  window.addEventListener('scroll', handlePositionUpdate, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handlePositionUpdate)
  window.removeEventListener('scroll', handlePositionUpdate, true)
})
</script>

<template>
  <div class="nav-menu">
    <button 
      ref="toggleRef"
      class="nav-menu__toggle" 
      @click.stop="toggleMenu"
      :aria-expanded="isOpen"
      aria-label="Открыть меню навигации"
    >
      <span class="nav-menu__hamburger" :class="{ 'nav-menu__hamburger--open': isOpen }">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>

    <Teleport to="body">
      <Transition name="nav-dropdown">
        <div 
          v-if="isOpen" 
          class="nav-menu__dropdown" 
          :style="dropdownStyle"
          @click.stop
        >
        <div class="nav-menu__header">
          <span class="nav-menu__section-label">Разделы</span>
        </div>
        
        <nav class="nav-menu__list">
          <button
            v-for="item in visibleNavItems"
            :key="item.id"
            class="nav-menu__item"
            :class="{ 'nav-menu__item--active': currentSection === item.id }"
            @click="navigateTo(item.path)"
          >
            <span class="nav-menu__item-icon">
              <!-- Chart icon -->
              <svg v-if="item.icon === 'chart'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 16l4-4 4 4 5-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <!-- List icon -->
              <svg v-else-if="item.icon === 'list'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <!-- Road icon -->
              <svg v-else-if="item.icon === 'road'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19L8 5M16 19l4-14M12 19v-2M12 14v-2M12 9V7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <!-- Truck icon (resources) -->
              <svg v-else-if="item.icon === 'truck'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <!-- Mileage icon (speedometer) -->
              <svg v-else-if="item.icon === 'mileage'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10" stroke-linecap="round"/>
                <path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 16l3 3M22 16l-3 3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <!-- Users icon -->
              <svg v-else-if="item.icon === 'users'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="nav-menu__item-label">{{ item.label }}</span>
            <span v-if="currentSection === item.id" class="nav-menu__item-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>
        </nav>

        <div v-if="isAuthenticated" class="nav-menu__footer">
          <div class="nav-menu__user">
            <span class="nav-menu__user-name">{{ user?.full_name || user?.login }}</span>
          </div>
          <button class="nav-menu__logout" @click="handleLogout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Выйти
          </button>
        </div>
      </div>
    </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.nav-menu {
  position: relative;
  z-index: 100;
}

.nav-menu__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid var(--border-soft);

  &:hover {
    background: var(--overlay-dark-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.nav-menu__hamburger {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 20px;
  height: 14px;

  span {
    display: block;
    width: 100%;
    height: 2px;
    background: var(--text-main);
    border-radius: 1px;
    transition: transform 0.25s ease, opacity 0.25s ease;
  }

  &--open {
    span:nth-child(1) {
      transform: translateY(6px) rotate(45deg);
    }
    span:nth-child(2) {
      opacity: 0;
    }
    span:nth-child(3) {
      transform: translateY(-6px) rotate(-45deg);
    }
  }
}
</style>

<!-- Global styles for teleported dropdown (must be outside scoped) -->
<style lang="scss">
.nav-menu__dropdown {
  position: fixed;
  min-width: 240px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-strong);
  overflow: hidden;
  z-index: 1000;
}

.nav-menu__header {
  padding: var(--gap-md) var(--gap-lg);
  border-bottom: 1px solid var(--border-soft);
}

.nav-menu__section-label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.nav-menu__list {
  padding: var(--gap-sm) 0;
}

.nav-menu__item {
  display: flex;
  align-items: center;
  gap: var(--gap-md);
  width: 100%;
  padding: var(--gap-md) var(--gap-lg);
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  color: var(--text-main);
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--overlay-dark-hover);
  }

  &--active {
    background: var(--overlay-accent-soft);
    color: var(--accent);
    font-weight: 600;
  }
}

.nav-menu__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;

  svg {
    width: 100%;
    height: 100%;
  }
}

.nav-menu__item-label {
  flex: 1;
}

.nav-menu__item-check {
  width: 18px;
  height: 18px;
  color: var(--accent);

  svg {
    width: 100%;
    height: 100%;
  }
}

.nav-menu__footer {
  padding: var(--gap-md) var(--gap-lg);
  border-top: 1px solid var(--border-soft);
  background: var(--bg-muted);
}

.nav-menu__user {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--gap-md);
}

.nav-menu__user-name {
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--text-main);
}

.nav-menu__logout {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  width: 100%;
  padding: var(--gap-sm) var(--gap-md);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--font-size-caption);
  color: var(--danger);
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--overlay-dark-hover);
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

/* Dropdown animation */
.nav-dropdown-enter-active,
.nav-dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-dropdown-enter-from,
.nav-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
