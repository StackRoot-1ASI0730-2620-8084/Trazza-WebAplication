<script setup>
import {reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useIamStore from "../../application/iam.store.js";
import {SignInCommand} from "../../domain/commands/sign-in.command.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const { t } = useI18n();
const router = useRouter();
const iamStore = useIamStore();
const { describeError } = useErrorHandler();
const form = reactive({ email: '', password: '' });
const errorMessage = ref('');

/**
 * Builds a sign-in command from the form and executes the sign-in use case.
 */
const performSignIn = async () => {
  errorMessage.value = '';
  try {
    await iamStore.signIn(new SignInCommand(form));
    router.push({ name: 'dashboard' });
  } catch (error) {
    errorMessage.value = describeError(error);
  }
};
</script>

<template>
  <div class="trazza-panel w-full shadow-2" style="max-width: 26rem">
    <h1 class="text-2xl font-bold m-0">{{ t('sign-in.title') }}</h1>
    <p class="trazza-muted mt-1 mb-4">{{ t('sign-in.subtitle') }}</p>
    <form class="flex flex-column gap-3" @submit.prevent="performSignIn">
      <div>
        <label for="email" class="trazza-label">{{ t('fields.email') }} *</label>
        <pv-input-text id="email" v-model="form.email" type="email" placeholder="name@email.com" autocomplete="username" class="w-full"/>
      </div>
      <div>
        <label for="password" class="trazza-label">{{ t('fields.password') }} *</label>
        <pv-password input-id="password" v-model="form.password" :feedback="false" toggle-mask fluid autocomplete="current-password"/>
      </div>
      <pv-message v-if="errorMessage" severity="error" size="small">{{ errorMessage }}</pv-message>
      <pv-button type="submit" :label="t('sign-in.submit')" :loading="iamStore.state.processing" class="w-full"/>
    </form>
    <p class="text-sm text-center mt-4 mb-0">
      {{ t('sign-in.no-account') }}
      <router-link :to="{ name: 'iam-sign-up', query: { role: 'carrier' } }" class="text-primary font-semibold">{{ t('sign-in.as-carrier') }}</router-link>
      ·
      <router-link :to="{ name: 'iam-sign-up', query: { role: 'merchant' } }" class="text-primary font-semibold">{{ t('sign-in.as-merchant') }}</router-link>
    </p>
    <pv-divider/>
    <p class="text-xs trazza-muted m-0">{{ t('sign-in.demo-hint') }}</p>
  </div>
</template>
