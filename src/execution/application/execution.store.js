import {computed, reactive} from "vue";
import {ExecutionApi} from "../infrastructure/execution-api.js";
import {ShipmentAssembler} from "../infrastructure/shipment.assembler.js";
import {Shipment} from "../domain/model/shipment.entity.js";
import {Incident} from "../domain/model/incident.entity.js";
import {IncidentType} from "../domain/model/incident-type.value-object.js";
import {GeoLocation} from "../../shared/domain/model/geo-location.value-object.js";
import useIamStore from "../../iam/application/iam.store.js";
import useNotificationStore from "../../shared/application/notification.store.js";

const executionApi = new ExecutionApi();

/**
 * Reactive state of the Service Execution & Monitoring bounded context.
 *
 * @type {{shipments: Shipment[], loaded: boolean, errors: Error[]}}
 */
const state = reactive({
    shipments: [],
    loaded: false,
    errors: []
});

/** @returns {?number} Identifier of the signed-in user. */
const currentUserId = () => useIamStore().currentUserId.value;

/** @type {import('vue').ComputedRef<Shipment[]>} Shipments of the signed-in user, newest first. */
const myShipments = computed(() => state.shipments
    .filter(shipment => shipment.involves(currentUserId()))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));

/** @type {import('vue').ComputedRef<Shipment[]>} Active shipments of the signed-in user. */
const myActiveShipments = computed(() => myShipments.value.filter(shipment => shipment.status.isActive));

/** @type {import('vue').ComputedRef<Shipment[]>} Delivered, closed or cancelled shipments of the signed-in user. */
const myFinishedShipments = computed(() => myShipments.value.filter(shipment => !shipment.status.isActive));

/**
 * Loads every shipment.
 *
 * @returns {Promise<void>}
 */
async function fetchShipments() {
    try {
        state.shipments = ShipmentAssembler.toEntitiesFromResponse(await executionApi.getShipments());
        state.loaded = true;
        state.errors = [];
    } catch (error) {
        state.errors.push(error);
    }
}

/**
 * @param {number|string} id - Shipment identifier.
 * @returns {Shipment|undefined} Shipment.
 */
function getShipmentById(id) {
    return state.shipments.find(shipment => shipment.id === Number(id));
}

/**
 * Persists a shipment and reloads the collection when the request fails.
 *
 * @param {Shipment} shipment - Shipment to persist.
 * @returns {Promise<void>}
 */
async function persist(shipment) {
    try {
        await executionApi.updateShipment(ShipmentAssembler.toResourceFromEntity(shipment));
    } catch (error) {
        state.errors.push(error);
        await fetchShipments();
        throw error;
    }
}

/**
 * Opens a shipment for a confirmed match. Called by the Matchmaking context.
 *
 * @param {Object} data - Snapshot of the match (see {@link Shipment} constructor).
 * @returns {Promise<Shipment>} Created shipment.
 */
async function openShipment(data) {
    const shipment = Shipment.open(data);
    const response = await executionApi.createShipment(ShipmentAssembler.toResourceFromEntity(shipment));
    const created = ShipmentAssembler.toEntityFromResource(response.data);
    state.shipments.push(created);
    return created;
}

/**
 * Registers the pickup of the goods.
 *
 * @param {Shipment} shipment - Shipment.
 * @returns {Promise<void>}
 */
async function confirmPickup(shipment) {
    shipment.confirmPickup();
    await persist(shipment);
}

/**
 * Shares a new location of the vehicle. Without GPS hardware the location advances towards the
 * delivery point and may deviate from the planned route to exercise the deviation alerts.
 *
 * @param {Shipment} shipment - Shipment in transit.
 * @param {?GeoLocation} [location=null] - Real location; when null a simulated one is used.
 * @returns {Promise<?string>} Event raised by the update.
 */
async function shareLocation(shipment, location = null) {
    const nextLocation = location ?? simulateNextLocation(shipment);
    const event = shipment.updateLocation(nextLocation);
    await persist(shipment);
    if (event === 'detour_alert') {
        useNotificationStore().notify({
            severity: 'warn',
            summaryKey: 'alerts.detour',
            params: { code: shipment.code, distance: shipment.deviationKm }
        });
    }
    return event;
}

/**
 * Calculates a simulated next location for a shipment.
 *
 * @param {Shipment} shipment - Shipment in transit.
 * @returns {GeoLocation} Next location.
 */
function simulateNextLocation(shipment) {
    const from = shipment.currentLocation ?? shipment.pickup.location;
    const target = shipment.delivery.location;
    if (from.distanceTo(target) < 0.5) return target;
    const advanced = from.moveTowards(target, 0.45);
    const deviate = Math.random() < 0.3;
    const offset = deviate ? 0.025 : (Math.random() - 0.5) * 0.004;
    return new GeoLocation({ latitude: advanced.latitude + offset, longitude: advanced.longitude - offset });
}

/**
 * Registers the delivery of the goods.
 *
 * @param {Shipment} shipment - Shipment in transit.
 * @param {boolean} [acknowledgeDistance=false] - Carrier confirms despite being far from the delivery point.
 * @returns {Promise<void>}
 */
async function confirmDelivery(shipment, acknowledgeDistance = false) {
    shipment.confirmDelivery({ acknowledgeDistance });
    await persist(shipment);
}

/**
 * Registers that the merchant received the goods.
 *
 * @param {Shipment} shipment - Delivered shipment.
 * @returns {Promise<void>}
 */
async function confirmReception(shipment) {
    shipment.confirmReception();
    await persist(shipment);
}

/**
 * Cancels a shipment before pickup.
 *
 * @param {Shipment} shipment - Shipment.
 * @returns {Promise<void>}
 */
async function cancelShipment(shipment) {
    shipment.cancel();
    await persist(shipment);
}

/**
 * Reports an incident on a shipment.
 *
 * @param {Shipment} shipment - Shipment.
 * @param {Object} form - Incident form data.
 * @param {string} form.type - Incident type.
 * @param {string} form.description - What happened.
 * @returns {Promise<Incident>} Reported incident.
 */
async function reportIncident(shipment, { type, description }) {
    const iamStore = useIamStore();
    const incident = shipment.reportIncident(new Incident({
        type: new IncidentType(type),
        description,
        reporterId: iamStore.currentUserId.value,
        reporterRole: iamStore.currentRole.value,
        reportedAt: new Date().toISOString()
    }));
    await persist(shipment);
    useNotificationStore().notify({ severity: 'warn', summaryKey: 'alerts.incident-reported', params: { code: shipment.code } });
    return incident;
}

const executionStore = {
    state,
    myShipments,
    myActiveShipments,
    myFinishedShipments,
    fetchShipments,
    getShipmentById,
    openShipment,
    confirmPickup,
    shareLocation,
    confirmDelivery,
    confirmReception,
    cancelShipment,
    reportIncident
};

/**
 * Application service store for the Service Execution & Monitoring bounded context.
 * It coordinates pickup, live tracking, deviation alerts, delivery, reception and incidents.
 *
 * @returns {typeof executionStore} Store state, getters and actions.
 */
const useExecutionStore = () => executionStore;

export default useExecutionStore;
