<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import useReputationStore from "../../application/reputation.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import {formatDate, initialsOf} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const store = useReputationStore();
const iamStore = useIamStore();
const view = ref('received');

const summary = computed(() => store.summaryFor(iamStore.currentUserId.value));
const viewOptions = computed(() => [
  { value: 'received', label: t('reputation.received') },
  { value: 'given', label: t('reputation.given') }
]);
const ratings = computed(() => view.value === 'received' ? store.myReceivedRatings.value : store.myGivenRatings.value);

/**
 * @param {number} stars - Star value.
 * @returns {number} Percentage of ratings with that value.
 */
const percentage = (stars) => summary.value.count ? Math.round(summary.value.distribution[stars - 1] / summary.value.count * 100) : 0;
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header mb-4">
      <h1>{{ t('reputation.title') }}</h1>
      <p>{{ t('reputation.subtitle') }}</p>
    </div>
    <div class="grid">
      <div class="col-12 lg:col-4">
        <div class="trazza-panel">
          <div class="flex align-items-end gap-2">
            <span class="trazza-kpi">{{ summary.count ? summary.average.toFixed(1) : '—' }}</span>
            <i class="pi pi-star-fill text-yellow-500 text-2xl mb-1"></i>
          </div>
          <div class="trazza-muted text-sm mb-3">{{ t('reputation.based-on', { count: summary.count }) }}</div>
          <div v-for="stars in [5, 4, 3, 2, 1]" :key="stars" class="flex align-items-center gap-2 mb-2">
            <span class="text-sm" style="width: 2.5rem">{{ stars }} ★</span>
            <pv-progress-bar :value="percentage(stars)" :show-value="false" class="flex-1" style="height: 0.5rem"/>
            <span class="text-sm trazza-muted" style="width: 2.5rem; text-align: right">{{ summary.distribution[stars - 1] }}</span>
          </div>
        </div>
      </div>
      <div class="col-12 lg:col-8">
        <pv-select-button v-model="view" :options="viewOptions" option-label="label" option-value="value" :allow-empty="false" class="mb-3"/>
        <div v-if="!ratings.length" class="trazza-panel text-center py-6 trazza-muted">{{ t('reputation.empty') }}</div>
        <div v-for="rating in ratings" :key="rating.id" class="trazza-panel mb-2">
          <div class="flex justify-content-between align-items-start gap-3">
            <div class="flex align-items-center gap-2">
              <pv-avatar :label="initialsOf(view === 'received' ? rating.raterName : rating.target.name)" shape="circle"/>
              <div>
                <div class="font-semibold">{{ view === 'received' ? rating.raterName : rating.target.name }}</div>
                <div class="text-xs trazza-muted">{{ formatDate(rating.createdAt, locale) }}</div>
              </div>
            </div>
            <pv-rating :model-value="rating.score.value" readonly :cancel="false"/>
          </div>
          <div v-if="rating.tags.length" class="flex flex-wrap gap-1 mt-2">
            <pv-tag v-for="tag in rating.tags" :key="tag" :value="t(`rating-tags.${tag}`)" severity="secondary"/>
          </div>
          <p v-if="rating.comment" class="mb-0 mt-2">“{{ rating.comment }}”</p>
        </div>
      </div>
    </div>
  </div>
</template>
