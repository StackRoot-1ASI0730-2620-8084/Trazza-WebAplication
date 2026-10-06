<script setup>
import {useI18n} from "vue-i18n";

const { locale, availableLocales } = useI18n();
</script>

<template>
  <pv-select-button v-model="locale" :options="availableLocales" :allow-empty="false" size="small">
    <template #option="slotProps">
      <span class="text-sm font-semibold">{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>
