<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useIamStore from "../../../iam/application/iam.store.js";

const emit = defineEmits(['navigate']);
const { t } = useI18n();
const router = useRouter();
const iamStore = useIamStore();

const carrierItems = [
  { label: 'option.dashboard',        icon: 'pi pi-home',          to: { name: 'dashboard' } },
  { label: 'option.return-routes',    icon: 'pi pi-directions',    to: { name: 'matchmaking-return-routes' } },
  { label: 'option.load-suggestions', icon: 'pi pi-box',           to: { name: 'matchmaking-load-suggestions' } },
  { label: 'option.offers',           icon: 'pi pi-comments',      to: { name: 'matchmaking-offers' } },
  { label: 'option.active-trip',      icon: 'pi pi-truck',         to: { name: 'execution-active-trip' } },
  { label: 'option.trip-history',     icon: 'pi pi-history',       to: { name: 'execution-trip-history' } },
  { label: 'option.vehicles',         icon: 'pi pi-car',           to: { name: 'iam-vehicles' } },
  { label: 'option.ratings',          icon: 'pi pi-star',          to: { name: 'reputation-ratings' } },
  { label: 'option.plan-billing',     icon: 'pi pi-credit-card',   to: { name: 'billing-plan' } },
  { label: 'option.profile',          icon: 'pi pi-user',          to: { name: 'iam-profile' } }
];

const merchantItems = [
  { label: 'option.dashboard',          icon: 'pi pi-home',        to: { name: 'dashboard' } },
  { label: 'option.freight-requests',   icon: 'pi pi-box',         to: { name: 'matchmaking-freight-requests' } },
  { label: 'option.find-carriers',      icon: 'pi pi-search',      to: { name: 'matchmaking-find-carriers' } },
  { label: 'option.offers',             icon: 'pi pi-comments',    to: { name: 'matchmaking-offers' } },
  { label: 'option.shipment-tracking',  icon: 'pi pi-map-marker',  to: { name: 'execution-shipment-tracking' } },
  { label: 'option.shipment-history',   icon: 'pi pi-history',     to: { name: 'execution-shipment-history' } },
  { label: 'option.ratings',            icon: 'pi pi-star',        to: { name: 'reputation-ratings' } },
  { label: 'option.plan-billing',       icon: 'pi pi-credit-card', to: { name: 'billing-plan' } },
  { label: 'option.profile',            icon: 'pi pi-user',        to: { name: 'iam-profile' } }
];

const items = computed(() => iamStore.isCarrier.value ? carrierItems : merchantItems);
const accountLabel = computed(() => iamStore.isCarrier.value ? t('menu.carrier-account') : t('menu.merchant-account'));

/**
 * Signs the user out and returns to the sign-in page.
 */
const signOut = () => {
  iamStore.signOut();
  emit('navigate');
  router.push({ name: 'iam-sign-in' });
};
</script>

<template>
  <nav class="side-menu flex flex-column h-full">
    <router-link :to="{ name: 'dashboard' }" class="flex align-items-center gap-2 px-3 py-3" @click="emit('navigate')">
      <img src="/trazza-logo.svg" alt="Trazza" width="32" height="32"/>
      <span class="text-xl font-bold brand">Trazza</span>
    </router-link>
    <div class="trazza-overline px-3 pt-2 pb-2 account-label">{{ accountLabel }}</div>
    <ul class="list-none p-0 m-0 flex-1">
      <li v-for="item in items" :key="item.label">
        <router-link :to="item.to" class="menu-link" active-class="menu-link-active" @click="emit('navigate')">
          <i :class="item.icon"></i>
          <span>{{ t(item.label) }}</span>
        </router-link>
      </li>
    </ul>
    <div class="px-3 pb-3 flex flex-column gap-1">
      <a href="#" class="menu-link" @click.prevent="signOut">
        <i class="pi pi-sign-out"></i>
        <span>{{ t('menu.sign-out') }}</span>
      </a>
    </div>
  </nav>
</template>

<style scoped>
.side-menu {
  background: #ffffff;
  color: #434655;
  width: var(--trazza-sidebar-width);
  border-right: 1px solid var(--trazza-line);
}

.brand {
  color: var(--trazza-accent);
}

.account-label {
  color: #434655;
}

.menu-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  margin: 0.1rem 0.5rem;
  border-radius: 8px;
  color: #434655;
  font-size: 0.92rem;
  transition: background-color 0.15s ease;
}

.menu-link:hover {
  background: #f0f3ff;
  color: var(--trazza-ink);
}

.menu-link-active {
  background: var(--trazza-soft);
  color: var(--trazza-accent);
  font-weight: 600;
}

.menu-link-active::before {
  content: "";
  position: absolute;
  left: -0.5rem;
  top: 0.35rem;
  bottom: 0.35rem;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--trazza-accent);
}
</style>
