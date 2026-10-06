<script setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const unavailableRoute = route.fullPath;
</script>

<template>
  <div class="trazza-page flex flex-column align-items-center text-center py-8">
    <i class="pi pi-compass text-6xl text-primary mb-3"></i>
    <h1 class="m-0">{{ t('page-not-found.title') }}</h1>
    <p class="trazza-muted">{{ t('page-not-found.content', { 'unavailable-route': unavailableRoute }) }}</p>
    <pv-button :label="t('page-not-found.go-home')" icon="pi pi-home" @click="router.push({ name: 'dashboard' })"/>
  </div>
</template>
