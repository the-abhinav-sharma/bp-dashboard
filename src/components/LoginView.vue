<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authService from '@/services/authService'

const router = useRouter()

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authService.login({
      appCode: 'CARDIO_CARE',
      username: username.value,
      password: password.value
    })
    router.push('/dashboard')
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">
      <!-- Header / Branding -->
      <div class="brand-header">
        <div class="brand-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </div>
        <h1 class="brand-title">Cardio Care</h1>
        <p class="brand-subtitle">Blood Pressure Monitoring Portal</p>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="error-alert">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="alert-icon">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label" for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="form-input"
            placeholder="e.g. jdoe"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="form-input"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" :disabled="isLoading" class="submit-btn">
          <span v-if="isLoading" class="spinner-container">
            <svg class="spinner" viewBox="0 0 24 24">
              <circle class="path" cx="12" cy="12" r="10" fill="none" stroke-width="4"></circle>
            </svg>
            Signing in...
          </span>
          <span v-else>Sign In</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Container Setup */
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  padding: 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Card Styling */
.login-card {
  width: 100%;
  max-width: 400px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
  padding: 2.5rem 2rem;
  box-sizing: border-box;
}

/* Header & Icon */
.brand-header {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.brand-icon svg {
  width: 28px;
  height: 28px;
}

.brand-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.025em;
}

.brand-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.375rem;
}

/* Error Banner */
.error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Form Controls */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #0f172a;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s ease-in-out;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  margin-top: 0.5rem;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
  transition: all 0.2s ease-in-out;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
}

/* Spinner */
.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  animation: rotate 1.5s linear infinite;
  width: 18px;
  height: 18px;
}

.spinner .path {
  stroke: #ffffff;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}
</style>