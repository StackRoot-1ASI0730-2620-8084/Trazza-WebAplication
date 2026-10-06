<script setup>
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";

const props = defineProps({
  title: { type: String, default: '' },
  hint: { type: String, default: '' },
  initialAmount: { type: Number, default: null },
  loading: { type: Boolean, default: false }
});
const emit = defineEmits(['submit']);
const { t } = useI18n();
const amount = ref(props.initialAmount);

watch(() => props.initialAmount, value => amount.value = value);
</script>

<template>
  <div class="counter-offer border-round p-3">
    <div v-if="props.title" class="font-semibold mb-1">{{ props.title }}</div>
    <div v-if="props.hint" class="text-sm trazza-muted mb-2">{{ props.hint }}</div>
    <label for="counter-amount" class="trazza-label">{{ t('offer.your-rate') }}</label>
    <div class="flex gap-2">
      <pv-input-number input-id="counter-amount" v-model="amount" :min="1" mode="currency" currency="PEN" locale="es-PE" class="flex-1" fluid/>
      <pv-button :label="t('actions.send')" icon="pi pi-send" :loading="props.loading" :disabled="!amount" @click="emit('submit', amount)"/>
    </div>
  </div>
</template>

<style scoped>
.counter-offer {
  background: #f0f3ff;
  border: 1px solid var(--trazza-accent);
}
</style>
