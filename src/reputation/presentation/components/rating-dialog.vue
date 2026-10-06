<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useReputationStore from "../../application/reputation.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import {RatingTarget} from "../../domain/model/rating-target.value-object.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";

const props = defineProps({
  shipment: { type: Object, default: null }
});
const visible = defineModel('visible', { type: Boolean, default: false });
const emit = defineEmits(['rated']);
const { t } = useI18n();
const store = useReputationStore();
const iamStore = useIamStore();
const { describeError, showSuccess } = useErrorHandler();
const errorMessage = ref('');
const sending = ref(false);
const form = reactive({ score: 5, tags: [], comment: '' });

const targetRole = computed(() => iamStore.isCarrier.value ? 'merchant' : 'carrier');
const targetName = computed(() => targetRole.value === 'merchant' ? props.shipment?.merchantName : props.shipment?.carrierName);
const tagOptions = computed(() => RatingTarget.TAGS[targetRole.value].map(value => ({ value, label: t(`rating-tags.${value}`) })));

watch(visible, open => {
  if (open) {
    form.score = 5;
    form.tags = [];
    form.comment = '';
    errorMessage.value = '';
  }
});

/**
 * Submits the rating.
 */
const submit = async () => {
  errorMessage.value = '';
  sending.value = true;
  try {
    await store.submitRating({ shipment: props.shipment, ...form });
    showSuccess('rating.sent');
    visible.value = false;
    emit('rated');
  } catch (error) {
    errorMessage.value = describeError(error);
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t('rating.delivered')" :style="{ width: '28rem' }" :breakpoints="{ '575px': '95vw' }">
    <p class="mt-0 font-semibold">{{ t('rating.how-was', { name: targetName }) }}</p>
    <div class="flex flex-column gap-3">
      <div class="flex align-items-center gap-3">
        <pv-rating v-model="form.score" :cancel="false"/>
        <span class="text-sm trazza-muted">{{ t('rating.of-five', { score: form.score }) }}</span>
      </div>
      <pv-select-button v-model="form.tags" :options="tagOptions" option-label="label" option-value="value" multiple class="flex-wrap trazza-pills"/>
      <div>
        <label for="ratingComment" class="trazza-label">{{ t('rating.comment') }}</label>
        <pv-textarea id="ratingComment" v-model="form.comment" rows="3" class="w-full" maxlength="300"/>
      </div>
      <pv-message v-if="errorMessage" severity="error" size="small">{{ errorMessage }}</pv-message>
    </div>
    <template #footer>
      <pv-button :label="t('rating.skip')" severity="secondary" text @click="visible = false"/>
      <pv-button :label="t('rating.submit')" icon="pi pi-star" :loading="sending" @click="submit"/>
    </template>
  </pv-dialog>
</template>
