import { createApp } from 'vue'
import './style.css'
import App from './app.vue'
import i18n from "./i18n.js";
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import Tooltip from 'primevue/tooltip';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Checkbox,
    Chip,
    Column,
    ConfirmationService,
    ConfirmDialog,
    DataTable,
    DatePicker,
    Dialog,
    DialogService,
    Divider,
    Drawer,
    FloatLabel,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Message,
    OverlayBadge,
    MultiSelect,
    Password,
    Popover,
    ProgressBar,
    RadioButton,
    Rating,
    Select,
    SelectButton,
    Tag,
    Textarea,
    Timeline,
    Toast,
    ToastService,
    ToggleSwitch
} from "primevue";
import router from "./router.js";

const primeUiLicenseKey = import.meta.env.VITE_PRIME_UI_LICENSE_KEY;

const TrazzaPreset = definePreset(Aura, {
    semantic: {
        formField: {
            borderRadius: '8px'
        },
        primary: {
            50: '#f0f3ff',
            100: '#e6ebff',
            200: '#c9d5ff',
            300: '#9fb3f2',
            400: '#5b7ad6',
            500: '#0037b0',
            600: '#002f99',
            700: '#002780',
            800: '#001f66',
            900: '#00174d',
            950: '#000f33'
        }
    }
});

createApp(App)
    .use(i18n)
    .use(PrimeVue, { theme: { preset: TrazzaPreset, options: { darkModeSelector: '.trazza-dark' } }, ripple: true, license: primeUiLicenseKey })
    .use(ConfirmationService)
    .use(DialogService)
    .use(ToastService)
    .component('pv-avatar',         Avatar)
    .component('pv-badge',          Badge)
    .component('pv-button',         Button)
    .component('pv-card',           Card)
    .component('pv-checkbox',       Checkbox)
    .component('pv-chip',           Chip)
    .component('pv-column',         Column)
    .component('pv-confirm-dialog', ConfirmDialog)
    .component('pv-data-table',     DataTable)
    .component('pv-date-picker',    DatePicker)
    .component('pv-dialog',         Dialog)
    .component('pv-divider',        Divider)
    .component('pv-drawer',         Drawer)
    .component('pv-float-label',    FloatLabel)
    .component('pv-icon-field',     IconField)
    .component('pv-input-icon',     InputIcon)
    .component('pv-input-number',   InputNumber)
    .component('pv-input-text',     InputText)
    .component('pv-message',        Message)
    .component('pv-multi-select',   MultiSelect)
    .component('pv-overlay-badge',  OverlayBadge)
    .component('pv-password',       Password)
    .component('pv-popover',        Popover)
    .component('pv-progress-bar',   ProgressBar)
    .component('pv-radio-button',   RadioButton)
    .component('pv-rating',         Rating)
    .component('pv-select',         Select)
    .component('pv-select-button',  SelectButton)
    .component('pv-tag',            Tag)
    .component('pv-textarea',       Textarea)
    .component('pv-timeline',       Timeline)
    .component('pv-toast',          Toast)
    .component('pv-toggle-switch',  ToggleSwitch)
    .directive('tooltip',           Tooltip)
    .use(router)
    .mount('#app')
