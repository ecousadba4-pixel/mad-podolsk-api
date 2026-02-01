<script setup lang="ts">
/**
 * LoginView — Страница входа в систему
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/authStore'
import { storeToRefs } from 'pinia'
import { UiButton, UiInput, UiCard } from '@/components/ui'

const router = useRouter()
const authStore = useAuthStore()
const { isLoading, error, isAuthenticated } = storeToRefs(authStore)

const loginValue = ref('')
const password = ref('')
const showPassword = ref(false)
const localError = ref<string | null>(null)

async function handleSubmit() {
  localError.value = null
  
  if (!loginValue.value.trim()) {
    localError.value = 'Введите логин'
    return
  }
  
  if (!password.value) {
    localError.value = 'Введите пароль'
    return
  }
  
  const success = await authStore.login(loginValue.value.trim(), password.value)
  
  if (success) {
    router.push('/')
  }
}

onMounted(() => {
  // If already authenticated, redirect to home
  if (isAuthenticated.value) {
    router.push('/')
  }
})
</script>

<template>
  <div class="login-view">
    <div class="login-view__container">
      <UiCard class="login-card">
        <div class="login-card__header">
          <h1 class="login-card__title">СКПДИ · МАД · Подольск</h1>
          <p class="login-card__subtitle">Вход в систему</p>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="login-form__field">
            <label class="login-form__label" for="login">Логин</label>
            <UiInput
              id="login"
              v-model="loginValue"
              placeholder="Введите логин"
              autocomplete="username"
              :disabled="isLoading"
            />
          </div>

          <div class="login-form__field">
            <label class="login-form__label" for="password">Пароль</label>
            <div class="login-form__password-wrapper">
              <UiInput
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Введите пароль"
                autocomplete="current-password"
                :disabled="isLoading"
              />
              <button
                type="button"
                class="login-form__toggle-password"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="localError || error" class="login-form__error">
            {{ localError || error }}
          </div>

          <UiButton
            type="submit"
            variant="primary"
            :loading="isLoading"
            fullWidth
          >
            Войти
          </UiButton>
        </form>
      </UiCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--card-padding);
  background: var(--bg);
}

.login-view__container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  padding: var(--gap-xl);
}

.login-card__header {
  text-align: center;
  margin-bottom: var(--gap-xl);
}

.login-card__title {
  margin: 0;
  font-size: var(--font-size-h2);
  font-weight: 700;
  color: var(--text-main);
}

.login-card__subtitle {
  margin: var(--gap-sm) 0 0;
  font-size: var(--font-size-body-sm);
  color: var(--text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.login-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.login-form__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.login-form__password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.login-form__toggle-password {
  position: absolute;
  right: var(--gap-md);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--text-main);
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.login-form__error {
  padding: var(--gap-md);
  background: var(--overlay-dark-hover);
  border-radius: var(--radius-sm);
  color: var(--danger);
  font-size: var(--font-size-body-sm);
  text-align: center;
}
</style>
