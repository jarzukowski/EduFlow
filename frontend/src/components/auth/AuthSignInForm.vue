<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ busy: boolean }>();

const emit = defineEmits<{
  (e: 'submit', payload: { email: string; password: string }): void;
}>();

const email = ref('');
const password = ref('');

const onSubmit = (): void => {
  emit('submit', {
    email: email.value,
    password: password.value,
  });
};
</script>

<template>
  <form :class="$style.form" @submit.prevent="onSubmit">
    <label :class="$style.field">
      <span :class="$style.label">E-mail</span>
      <input
        v-model.trim="email"
        :class="$style.input"
        type="email"
        autocomplete="email"
        required
      />
    </label>

    <label :class="$style.field">
      <span :class="$style.label">Password</span>
      <input
        v-model="password"
        :class="$style.input"
        type="password"
        autocomplete="current-password"
        required
      />
    </label>

    <button :class="$style.btn" type="submit" :disabled="busy">
      {{ busy ? 'Signing in...' : 'Sign in' }}
    </button>
  </form>
</template>

<style module>
.form {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.label {
  font-size: 13px;
  opacity: 0.85;
}

.input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  padding: 12px 14px;
}

.input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(109, 94, 252, 0.18);
  border-color: rgba(255, 255, 255, 0.18);
}

.btn {
  margin-top: 6px;
  border-radius: 999px;
  border: 0;
  padding: 12px 14px;
  font-weight: 650;
  cursor: pointer;
  background: linear-gradient(135deg, #2f8bff, #6d5efc);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>



