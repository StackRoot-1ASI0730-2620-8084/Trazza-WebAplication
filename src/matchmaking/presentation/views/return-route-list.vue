<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useMatchmakingStore from "../../application/matchmaking.store.js";
import {useErrorHandler} from "../../../shared/presentation/composables/use-error-handler.js";
import {formatDate, formatNumber, statusSeverity} from "../../../shared/presentation/formatters.js";

const { t, locale } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const store = useMatchmakingStore();
const { showError, showSuccess } = useErrorHandler();

const routes = computed(() => store.myReturnRoutes.value.map(route => ({
  route,
  suggestions: route.status.isActive ? store.getLoadSuggestions(route.id).length : null
})));

/**
 * Navigates to the publication form.
 */
const navigateToNew = () => router.push({ name: 'matchmaking-return-route-new' });

/**
 * Navigates to the load suggestions of a route.
 * @param {Object} route - Return route.
 */
const viewSuggestions = (route) => router.push({ name: 'matchmaking-load-suggestions', query: { routeId: route.id } });

/**
 * Asks for confirmation and closes a route.
 * @param {Object} route - Return route.
 */
const confirmClose = (route) => {
  confirm.require({
    message: t('return-route.confirm-close', { route: route.label }),
    header: t('return-route.close'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('actions.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('return-route.close'), severity: 'danger' },
    accept: async () => {
      try {
        await store.closeReturnRoute(route);
        showSuccess('return-route.closed');
      } catch (error) {
        showError(error);
      }
    }
  });
};
</script>

<template>
  <div class="trazza-page">
    <div class="trazza-page-header flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1>{{ t('return-route.list-title') }}</h1>
        <p>{{ t('return-route.list-subtitle') }}</p>
      </div>
      <pv-button :label="t('return-route.publish')" icon="pi pi-plus" @click="navigateToNew"/>
    </div>
    <div class="trazza-panel p-0 overflow-hidden">
      <pv-data-table :value="routes" :loading="!store.state.loaded" data-key="route.id" paginator :rows="8" striped-rows>
        <template #empty>
          <div class="text-center py-4 trazza-muted">{{ t('return-route.empty') }}</div>
        </template>
        <pv-column :header="t('columns.route')">
          <template #body="{ data }">
            <div class="trazza-route">{{ data.route.label }}</div>
            <div class="text-sm trazza-muted">{{ data.route.vehicleLabel }}</div>
          </template>
        </pv-column>
        <pv-column :header="t('columns.date')">
          <template #body="{ data }">
            <div>{{ formatDate(data.route.departureDate, locale) }}</div>
            <div class="text-sm trazza-muted">{{ data.route.timeWindow.label }}</div>
          </template>
        </pv-column>
        <pv-column :header="t('columns.free-capacity')">
          <template #body="{ data }">{{ formatNumber(data.route.availableWeightKg) }} kg</template>
        </pv-column>
        <pv-column :header="t('columns.suggestions')">
          <template #body="{ data }">{{ data.suggestions ?? '—' }}</template>
        </pv-column>
        <pv-column :header="t('columns.status')">
          <template #body="{ data }">
            <pv-tag :value="t(`statuses.${data.route.status.value}`)" :severity="statusSeverity(data.route.status.value)"/>
          </template>
        </pv-column>
        <pv-column :header="t('columns.actions')">
          <template #body="{ data }">
            <div class="flex gap-1">
              <pv-button v-if="data.route.status.isActive" icon="pi pi-box" text rounded v-tooltip.top="t('return-route.view-suggestions')" @click="viewSuggestions(data.route)"/>
              <pv-button v-if="data.route.status.value !== 'closed'" icon="pi pi-times-circle" text rounded severity="danger" v-tooltip.top="t('return-route.close')" @click="confirmClose(data.route)"/>
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
  </div>
</template>
