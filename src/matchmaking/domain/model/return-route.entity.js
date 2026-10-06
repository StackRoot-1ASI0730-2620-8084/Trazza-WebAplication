import {Address} from "../../../shared/domain/model/address.value-object.js";
import {TimeWindow} from "./time-window.value-object.js";
import {CargoType} from "./cargo-type.value-object.js";
import {RouteStatus} from "./route-status.value-object.js";
import {RouteMatchingService} from "../services/route-matching.service.js";

/**
 * Return route aggregate root. It represents the free capacity a carrier has on the way back from a delivery.
 *
 * @class ReturnRoute
 */
export class ReturnRoute {
    /** @type {ReadonlyArray<number>} Maximum detour options in kilometers. */
    static DETOUR_OPTIONS = Object.freeze([5, 10, 15, 20]);

    /** @type {RegExp} Pattern of an ISO local date. */
    static DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Route identifier.
     * @param {number} params.carrierId - User identifier of the carrier.
     * @param {number} params.vehicleId - Vehicle identifier inside the carrier fleet.
     * @param {string} params.vehicleLabel - Snapshot of the vehicle label.
     * @param {Address} params.origin - Where the previous delivery ends.
     * @param {Address} params.destination - Where the carrier is heading.
     * @param {string} params.departureDate - ISO local date (YYYY-MM-DD).
     * @param {TimeWindow} params.timeWindow - Departure window.
     * @param {number} params.availableWeightKg - Free payload in kilograms.
     * @param {number} [params.availableVolumeM3=0] - Free volume in cubic meters.
     * @param {number} params.maxDetourKm - Maximum detour accepted.
     * @param {CargoType[]} params.acceptedCargoTypes - Cargo types accepted.
     * @param {RouteStatus} params.status - Lifecycle status.
     * @param {number} [params.distanceKm=0] - Estimated route distance.
     * @param {number} [params.durationMinutes=0] - Estimated route duration.
     * @param {?string} [params.createdAt=null] - ISO creation date-time.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, carrierId, vehicleId, vehicleLabel, origin, destination, departureDate, timeWindow,
                    availableWeightKg, availableVolumeM3 = 0, maxDetourKm, acceptedCargoTypes, status,
                    distanceKm = 0, durationMinutes = 0, createdAt = null }) {
        if (carrierId === null || carrierId === undefined) throw new Error('validation.carrier-required');
        if (vehicleId === null || vehicleId === undefined) throw new Error('validation.vehicle-required');
        if (!(origin instanceof Address)) throw new Error('validation.origin-required');
        if (!(destination instanceof Address)) throw new Error('validation.destination-required');
        if (origin.equals(destination)) throw new Error('validation.same-origin-destination');
        if (!ReturnRoute.DATE_PATTERN.test(departureDate ?? '')) throw new Error('validation.date-required');
        if (!(timeWindow instanceof TimeWindow)) throw new Error('validation.time-window-invalid');
        const weight = Number(availableWeightKg);
        const volume = Number(availableVolumeM3 ?? 0);
        if (!Number.isFinite(weight) || weight < 0) throw new Error('validation.capacity-weight-invalid');
        if (!Number.isFinite(volume) || volume < 0) throw new Error('validation.capacity-volume-invalid');
        if (!Number.isFinite(Number(maxDetourKm)) || maxDetourKm <= 0 || maxDetourKm > 30) throw new Error('validation.detour-invalid');
        if (!Array.isArray(acceptedCargoTypes) || acceptedCargoTypes.length === 0 || !acceptedCargoTypes.every(type => type instanceof CargoType)) throw new Error('validation.cargo-types-required');
        if (!(status instanceof RouteStatus)) throw new Error('validation.status-invalid');
        this._id = id;
        this._carrierId = carrierId;
        this._vehicleId = vehicleId;
        this._vehicleLabel = vehicleLabel ?? '';
        this._origin = origin;
        this._destination = destination;
        this._departureDate = departureDate;
        this._timeWindow = timeWindow;
        this._availableWeightKg = weight;
        this._availableVolumeM3 = volume;
        this._maxDetourKm = Number(maxDetourKm);
        this._acceptedCargoTypes = [...acceptedCargoTypes];
        this._status = status;
        this._distanceKm = distanceKm;
        this._durationMinutes = durationMinutes;
        this._createdAt = createdAt;
    }

    /**
     * Factory that publishes a new return route enforcing the creation rules.
     *
     * @param {Object} params - Route data plus creation context.
     * @param {number} params.vehicleCapacityKg - Payload of the selected vehicle.
     * @param {number} params.vehicleCapacityM3 - Volume of the selected vehicle.
     * @param {string} params.today - ISO local date of today.
     * @returns {ReturnRoute} New active route.
     * @throws {Error} When the departure date is in the past or the capacity exceeds the vehicle.
     */
    static create({ vehicleCapacityKg, vehicleCapacityM3, today, ...params }) {
        if (!params.departureDate || params.departureDate < today) throw new Error('validation.date-in-past');
        if (Number(params.availableWeightKg) <= 0) throw new Error('validation.capacity-weight-invalid');
        if (Number(params.availableWeightKg) > vehicleCapacityKg) throw new Error('validation.capacity-exceeds-vehicle');
        if (Number(params.availableVolumeM3 ?? 0) > vehicleCapacityM3) throw new Error('validation.volume-exceeds-vehicle');
        const estimation = params.origin instanceof Address && params.destination instanceof Address
            ? RouteMatchingService.estimateTrip(params.origin, params.destination)
            : { distanceKm: 0, durationMinutes: 0 };
        return new ReturnRoute({
            ...params,
            status: new RouteStatus(RouteStatus.ACTIVE),
            distanceKm: estimation.distanceKm,
            durationMinutes: estimation.durationMinutes,
            createdAt: new Date().toISOString()
        });
    }

    /** @returns {?number} Route identifier. */
    get id() { return this._id; }

    /** @returns {number} Carrier user identifier. */
    get carrierId() { return this._carrierId; }

    /** @returns {number} Vehicle identifier. */
    get vehicleId() { return this._vehicleId; }

    /** @returns {string} Vehicle label snapshot. */
    get vehicleLabel() { return this._vehicleLabel; }

    /** @returns {Address} Origin. */
    get origin() { return this._origin; }

    /** @returns {Address} Destination. */
    get destination() { return this._destination; }

    /** @returns {string} Departure date. */
    get departureDate() { return this._departureDate; }

    /** @returns {TimeWindow} Departure window. */
    get timeWindow() { return this._timeWindow; }

    /** @returns {number} Free payload in kilograms. */
    get availableWeightKg() { return this._availableWeightKg; }

    /** @returns {number} Free volume in cubic meters. */
    get availableVolumeM3() { return this._availableVolumeM3; }

    /** @returns {number} Maximum detour in kilometers. */
    get maxDetourKm() { return this._maxDetourKm; }

    /** @returns {CargoType[]} Accepted cargo types. */
    get acceptedCargoTypes() { return [...this._acceptedCargoTypes]; }

    /** @returns {RouteStatus} Status. */
    get status() { return this._status; }

    /** @returns {number} Estimated distance. */
    get distanceKm() { return this._distanceKm; }

    /** @returns {number} Estimated duration. */
    get durationMinutes() { return this._durationMinutes; }

    /** @returns {?string} Creation date-time. */
    get createdAt() { return this._createdAt; }

    /** @returns {string} Label, for example "Lurín → Los Olivos". */
    get label() {
        return `${this._origin.district} → ${this._destination.district}`;
    }

    /**
     * @param {CargoType} cargoType - Cargo type to check.
     * @returns {boolean} True when the route accepts the cargo type.
     */
    accepts(cargoType) {
        return this._acceptedCargoTypes.some(type => type.equals(cargoType));
    }

    /**
     * @param {number} weightKg - Weight to carry.
     * @param {number} [volumeM3=0] - Volume to carry.
     * @returns {boolean} True when the free capacity is enough.
     */
    canCarry(weightKg, volumeM3 = 0) {
        const volumeFits = this._availableVolumeM3 === 0 || volumeM3 <= this._availableVolumeM3;
        return weightKg <= this._availableWeightKg && volumeFits;
    }

    /**
     * Reserves free capacity for a confirmed load. The route becomes matched when no payload is left.
     *
     * @param {number} weightKg - Weight to reserve.
     * @param {number} [volumeM3=0] - Volume to reserve.
     * @returns {void}
     * @throws {Error} When the route is not active or has not enough capacity.
     */
    reserveCapacity(weightKg, volumeM3 = 0) {
        if (!this._status.isActive) throw new Error('validation.route-not-active');
        if (!this.canCarry(weightKg, volumeM3)) throw new Error('validation.route-capacity-insufficient');
        this._availableWeightKg = Math.max(0, this._availableWeightKg - weightKg);
        this._availableVolumeM3 = Math.max(0, this._availableVolumeM3 - volumeM3);
        if (this._availableWeightKg === 0) this._status = new RouteStatus(RouteStatus.MATCHED);
    }

    /**
     * Closes the route so it no longer receives suggestions.
     *
     * @returns {void}
     * @throws {Error} When the route is already closed.
     */
    close() {
        if (this._status.value === RouteStatus.CLOSED) throw new Error('validation.route-already-closed');
        this._status = new RouteStatus(RouteStatus.CLOSED);
    }
}
