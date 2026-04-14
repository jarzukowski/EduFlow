<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ busy: boolean }>();

const emit = defineEmits<{
  (e: 'submit', payload: { username: string; email: string; password: string }): void;
}>();

const username = ref('');
const email = ref('');
const password = ref('');
const isCompleted = ref(false);

const onSubmit = (): void => {
  isCompleted.value = false;

  emit('submit', {
    username: username.value,
    email: email.value,
    password: password.value,
  });

  isCompleted.value = true;
};
</script>

<template>
  <form :class="$style.form" @submit.prevent="onSubmit">
    <label :class="$style.field">
      <span :class="$style.label">Username</span>
      <input
        v-model.trim="username"
        :class="$style.input"
        type="text"
        autocomplete="username"
        minlength="3"
        maxlength="40"
        required
      />
    </label>

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
        autocomplete="new-password"
        minlength="8"
        required
      />
    </label>

    <button :class="$style.btn" type="submit" :disabled="busy">
      {{ busy ? 'Creating account...' : 'Create account' }}
    </button>

    <p v-if="isCompleted" :class="$style.success" role="status">
      Account created. You can sign in now.
    </p>
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

.success {
  margin: 8px 0 0;
  font-size: 13px;
  opacity: 0.9;
}
</style>



