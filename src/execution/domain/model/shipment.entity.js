import {Address} from "../../../shared/domain/model/address.value-object.js";
import {Money} from "../../../shared/domain/model/money.value-object.js";
import {GeoLocation} from "../../../shared/domain/model/geo-location.value-object.js";
import {ShipmentStatus} from "./shipment-status.value-object.js";
import {Incident} from "./incident.entity.js";

/**
 * Shipment aggregate root (logistic trip). It controls the execution of a confirmed match:
 * pickup, live location, deviation alerts, delivery, reception and incidents.
 *
 * @class Shipment
 */
export class Shipment {
    /** @type {number} Distance from the planned route that raises a deviation alert, in kilometers. */
    static DEVIATION_THRESHOLD_KM = 2;

    /** @type {number} Maximum distance to the delivery point to confirm a delivery without acknowledgment, in kilometers. */
    static DELIVERY_RADIUS_KM = 1;

    /** @type {number} Hours after delivery during which incidents can be reported. */
    static INCIDENT_WINDOW_HOURS = 48;

    /** @type {number} Average urban speed used for ETA estimations, in kilometers per hour. */
    static AVERAGE_SPEED_KMH = 30;

    /** @type {ReadonlyArray<string>} Supported tracking event types. */
    static EVENT_TYPES = Object.freeze(['matched', 'picked_up', 'detour_alert', 'back_on_route', 'delivered', 'received', 'incident_reported', 'cancelled']);

    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Shipment identifier.
     * @param {string} params.code - Public code, for example "SH-3310".
     * @param {number} params.proposalId - Match proposal identifier.
     * @param {number} params.freightRequestId - Freight request identifier.
     * @param {number} params.returnRouteId - Return route identifier.
     * @param {number} params.carrierId - Carrier user identifier.
     * @param {string} params.carrierName - Carrier name snapshot.
     * @param {string} params.carrierPhone - Carrier phone snapshot.
     * @param {string} params.vehicleLabel - Vehicle label snapshot.
     * @param {number} params.merchantId - Merchant user identifier.
     * @param {string} params.merchantName - Merchant name snapshot.
     * @param {string} params.merchantPhone - Merchant phone snapshot.
     * @param {Address} params.pickup - Pickup address.
     * @param {Address} params.delivery - Delivery address.
     * @param {string} params.pickupDate - ISO local date.
     * @param {string} params.pickupWindow - Pickup window label.
     * @param {string} params.cargoDescription - Goods description.
     * @param {string} params.cargoType - Cargo type value.
     * @param {number} params.weightKg - Weight in kilograms.
     * @param {Money} params.rate - Agreed rate.
     * @param {ShipmentStatus} params.status - Execution status.
     * @param {?GeoLocation} [params.currentLocation=null] - Last known location of the vehicle.
     * @param {Array<{type: string, occurredAt: string, details: Object}>} [params.events=[]] - Tracking events.
     * @param {Incident[]} [params.incidents=[]] - Reported incidents.
     * @param {?string} [params.createdAt=null] - Creation date-time.
     * @param {?string} [params.pickedUpAt=null] - Pickup date-time.
     * @param {?string} [params.deliveredAt=null] - Delivery date-time.
     * @param {?string} [params.closedAt=null] - Reception date-time.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, code, proposalId, freightRequestId, returnRouteId, carrierId, carrierName, carrierPhone,
                    vehicleLabel, merchantId, merchantName, merchantPhone, pickup, delivery, pickupDate, pickupWindow,
                    cargoDescription, cargoType, weightKg, rate, status, currentLocation = null, events = [],
                    incidents = [], createdAt = null, pickedUpAt = null, deliveredAt = null, closedAt = null }) {
        if (!code) throw new Error('validation.code-required');
        if (carrierId === null || carrierId === undefined) throw new Error('validation.carrier-required');
        if (merchantId === null || merchantId === undefined) throw new Error('validation.merchant-required');
        if (!(pickup instanceof Address)) throw new Error('validation.pickup-required');
        if (!(delivery instanceof Address)) throw new Error('validation.delivery-required');
        if (!(rate instanceof Money)) throw new Error('validation.money-invalid');
        if (!(Number(weightKg) > 0)) throw new Error('validation.cargo-weight-invalid');
        if (!(status instanceof ShipmentStatus)) throw new Error('validation.status-invalid');
        if (currentLocation !== null && !(currentLocation instanceof GeoLocation)) throw new Error('validation.latitude-invalid');
        if (!incidents.every(incident => incident instanceof Incident)) throw new Error('validation.incident-type-invalid');
        this._id = id;
        this._code = code;
        this._proposalId = proposalId;
        this._freightRequestId = freightRequestId;
        this._returnRouteId = returnRouteId;
        this._carrierId = carrierId;
        this._carrierName = carrierName ?? '';
        this._carrierPhone = carrierPhone ?? '';
        this._vehicleLabel = vehicleLabel ?? '';
        this._merchantId = merchantId;
        this._merchantName = merchantName ?? '';
        this._merchantPhone = merchantPhone ?? '';
        this._pickup = pickup;
        this._delivery = delivery;
        this._pickupDate = pickupDate;
        this._pickupWindow = pickupWindow ?? '';
        this._cargoDescription = cargoDescription ?? '';
        this._cargoType = cargoType;
        this._weightKg = Number(weightKg);
        this._rate = rate;
        this._status = status;
        this._currentLocation = currentLocation;
        this._events = events.map(event => Object.freeze({ type: event.type, occurredAt: event.occurredAt, details: Object.freeze({ ...(event.details ?? {}) }) }));
        this._incidents = [...incidents];
        this._createdAt = createdAt;
        this._pickedUpAt = pickedUpAt;
        this._deliveredAt = deliveredAt;
        this._closedAt = closedAt;
    }

    /**
     * Factory that opens a shipment for a confirmed match.
     *
     * @param {Object} params - Shipment data (see constructor) without status, events or code.
     * @returns {Shipment} New shipment in matched status.
     */
    static open(params) {
        const now = new Date().toISOString();
        return new Shipment({
            ...params,
            code: `SH-${String(Date.now()).slice(-4)}`,
            status: new ShipmentStatus(ShipmentStatus.MATCHED),
            events: [{ type: 'matched', occurredAt: now, details: {} }],
            createdAt: now
        });
    }

    /** @returns {?number} Shipment identifier. */
    get id() { return this._id; }

    /** @returns {string} Public code. */
    get code() { return this._code; }

    /** @returns {number} Proposal identifier. */
    get proposalId() { return this._proposalId; }

    /** @returns {number} Freight request identifier. */
    get freightRequestId() { return this._freightRequestId; }

    /** @returns {number} Return route identifier. */
    get returnRouteId() { return this._returnRouteId; }

    /** @returns {number} Carrier user identifier. */
    get carrierId() { return this._carrierId; }

    /** @returns {string} Carrier name. */
    get carrierName() { return this._carrierName; }

    /** @returns {string} Carrier phone. */
    get carrierPhone() { return this._carrierPhone; }

    /** @returns {string} Vehicle label. */
    get vehicleLabel() { return this._vehicleLabel; }

    /** @returns {number} Merchant user identifier. */
    get merchantId() { return this._merchantId; }

    /** @returns {string} Merchant name. */
    get merchantName() { return this._merchantName; }

    /** @returns {string} Merchant phone. */
    get merchantPhone() { return this._merchantPhone; }

    /** @returns {Address} Pickup address. */
    get pickup() { return this._pickup; }

    /** @returns {Address} Delivery address. */
    get delivery() { return this._delivery; }

    /** @returns {string} Pickup date. */
    get pickupDate() { return this._pickupDate; }

    /** @returns {string} Pickup window. */
    get pickupWindow() { return this._pickupWindow; }

    /** @returns {string} Goods description. */
    get cargoDescription() { return this._cargoDescription; }

    /** @returns {string} Cargo type. */
    get cargoType() { return this._cargoType; }

    /** @returns {number} Weight in kilograms. */
    get weightKg() { return this._weightKg; }

    /** @returns {Money} Agreed rate. */
    get rate() { return this._rate; }

    /** @returns {ShipmentStatus} Status. */
    get status() { return this._status; }

    /** @returns {?GeoLocation} Current location. */
    get currentLocation() { return this._currentLocation; }

    /** @returns {Array<{type: string, occurredAt: string, details: Object}>} Tracking events, oldest first. */
    get events() { return [...this._events]; }

    /** @returns {Incident[]} Incidents. */
    get incidents() { return [...this._incidents]; }

    /** @returns {?string} Creation date-time. */
    get createdAt() { return this._createdAt; }

    /** @returns {?string} Pickup date-time. */
    get pickedUpAt() { return this._pickedUpAt; }

    /** @returns {?string} Delivery date-time. */
    get deliveredAt() { return this._deliveredAt; }

    /** @returns {?string} Reception date-time. */
    get closedAt() { return this._closedAt; }

    /** @returns {string} Label, for example "Ate → Miraflores". */
    get label() {
        return `${this._pickup.district} → ${this._delivery.district}`;
    }

    /** @returns {?number} Distance between the vehicle and the planned route in kilometers. */
    get deviationKm() {
        if (!this._currentLocation || !this._status.isMoving) return null;
        return Math.round(this._currentLocation.distanceToSegment(this._pickup.location, this._delivery.location) * 10) / 10;
    }

    /** @returns {boolean} True when the vehicle is away from the planned route. */
    get isOffRoute() {
        return this.deviationKm !== null && this.deviationKm > Shipment.DEVIATION_THRESHOLD_KM;
    }

    /** @returns {?number} Straight distance to the delivery point in kilometers. */
    get distanceToDeliveryKm() {
        if (!this._currentLocation) return null;
        return Math.round(this._currentLocation.distanceTo(this._delivery.location) * 10) / 10;
    }

    /** @returns {?number} Estimated minutes to reach the delivery point. */
    get etaMinutes() {
        const distance = this.distanceToDeliveryKm;
        if (distance === null || !this._status.isMoving) return null;
        return Math.round(distance * 1.3 / Shipment.AVERAGE_SPEED_KMH * 60);
    }

    /**
     * @param {number} userId - User identifier.
     * @returns {boolean} True when the user is the carrier or the merchant of the shipment.
     */
    involves(userId) {
        return this._carrierId === userId || this._merchantId === userId;
    }

    /**
     * Registers the pickup of the goods by the carrier.
     *
     * @returns {void}
     * @throws {Error} When the shipment is not waiting for pickup.
     */
    confirmPickup() {
        if (this._status.value !== ShipmentStatus.MATCHED) throw new Error('validation.shipment-not-matched');
        const now = new Date().toISOString();
        this._status = new ShipmentStatus(ShipmentStatus.PICKED_UP);
        this._pickedUpAt = now;
        this._currentLocation = this._pickup.location;
        this._addEvent('picked_up', { district: this._pickup.district });
    }

    /**
     * Updates the live location of the vehicle and raises or clears the deviation alert.
     *
     * @param {GeoLocation} location - New location.
     * @returns {?string} Event type raised by the update ("detour_alert", "back_on_route") or null.
     * @throws {Error} When the goods are not on the way.
     */
    updateLocation(location) {
        if (!this._status.isMoving) throw new Error('validation.shipment-not-in-transit');
        if (!(location instanceof GeoLocation)) throw new Error('validation.latitude-invalid');
        const wasOffRoute = this.isOffRoute;
        this._currentLocation = location;
        if (this._status.value === ShipmentStatus.PICKED_UP) this._status = new ShipmentStatus(ShipmentStatus.IN_TRANSIT);
        if (!wasOffRoute && this.isOffRoute) {
            this._addEvent('detour_alert', { distanceKm: this.deviationKm });
            return 'detour_alert';
        }
        if (wasOffRoute && !this.isOffRoute) {
            this._addEvent('back_on_route', {});
            return 'back_on_route';
        }
        return null;
    }

    /**
     * Registers the delivery. When the vehicle is far from the delivery point the carrier must acknowledge it.
     *
     * @param {Object} [options={}] - Delivery options.
     * @param {boolean} [options.acknowledgeDistance=false] - Carrier confirms despite being far from the delivery point.
     * @returns {void}
     * @throws {Error} When the goods are not on the way or the vehicle is far and the distance was not acknowledged.
     */
    confirmDelivery({ acknowledgeDistance = false } = {}) {
        if (!this._status.isMoving) throw new Error('validation.shipment-not-in-transit');
        const distance = this.distanceToDeliveryKm ?? 0;
        if (distance > Shipment.DELIVERY_RADIUS_KM && !acknowledgeDistance) throw new Error('validation.far-from-delivery');
        this._status = new ShipmentStatus(ShipmentStatus.DELIVERED);
        this._deliveredAt = new Date().toISOString();
        this._addEvent('delivered', { distanceKm: distance });
    }

    /**
     * Registers that the merchant received the goods and closes the shipment.
     *
     * @returns {void}
     * @throws {Error} When the shipment was not delivered.
     */
    confirmReception() {
        if (this._status.value !== ShipmentStatus.DELIVERED) throw new Error('validation.shipment-not-delivered');
        this._status = new ShipmentStatus(ShipmentStatus.CLOSED);
        this._closedAt = new Date().toISOString();
        this._addEvent('received', {});
    }

    /**
     * Cancels a shipment before pickup.
     *
     * @returns {void}
     * @throws {Error} When the goods were already picked up.
     */
    cancel() {
        if (this._status.value !== ShipmentStatus.MATCHED) throw new Error('validation.shipment-cannot-cancel');
        this._status = new ShipmentStatus(ShipmentStatus.CANCELLED);
        this._addEvent('cancelled', {});
    }

    /**
     * Adds an incident while the shipment is active or up to 48 hours after delivery.
     *
     * @param {Incident} incident - Incident to add.
     * @returns {Incident} Added incident.
     * @throws {Error} When the shipment was cancelled or the reporting window expired.
     */
    reportIncident(incident) {
        if (!(incident instanceof Incident)) throw new Error('validation.incident-type-invalid');
        if (this._status.value === ShipmentStatus.CANCELLED) throw new Error('validation.shipment-cancelled');
        if (!this.involves(incident.reporterId)) throw new Error('validation.not-a-party');
        if (this._status.isDelivered && this._deliveredAt) {
            const hours = (Date.parse(incident.reportedAt) - Date.parse(this._deliveredAt)) / 36e5;
            if (hours > Shipment.INCIDENT_WINDOW_HOURS) throw new Error('validation.incident-window-expired');
        }
        incident.assignId(this._incidents.reduce((max, existing) => Math.max(max, existing.id ?? 0), 0) + 1);
        this._incidents.push(incident);
        this._addEvent('incident_reported', { type: incident.type.value });
        return incident;
    }

    /**
     * @param {string} type - Event type.
     * @param {Object} details - Event details.
     * @returns {void}
     * @private
     */
    _addEvent(type, details) {
        this._events.push(Object.freeze({ type, occurredAt: new Date().toISOString(), details: Object.freeze({ ...details }) }));
    }
}
