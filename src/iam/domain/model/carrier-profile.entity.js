import {Dni} from "./dni.value-object.js";
import {Phone} from "./phone.value-object.js";
import {Vehicle} from "./vehicle.entity.js";

/**
 * Carrier profile aggregate root. It owns the fleet of vehicles of a carrier.
 *
 * @class CarrierProfile
 */
export class CarrierProfile {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null] - Profile identifier.
     * @param {number} params.userId - Identifier of the related user.
     * @param {string} params.fullName - Carrier full name.
     * @param {Dni} params.dni - National identity document.
     * @param {Phone} params.phone - Contact phone.
     * @param {boolean} [params.verified=false] - Whether the identity was verified.
     * @param {Vehicle[]} [params.vehicles=[]] - Fleet of the carrier.
     * @throws {Error} When an invariant is violated.
     */
    constructor({ id = null, userId, fullName, dni, phone, verified = false, vehicles = [] }) {
        if (userId === null || userId === undefined) throw new Error('validation.user-required');
        if ((fullName ?? '').trim().length < 3) throw new Error('validation.full-name-required');
        if (!(dni instanceof Dni)) throw new Error('validation.dni-invalid');
        if (!(phone instanceof Phone)) throw new Error('validation.phone-invalid');
        if (!vehicles.every(vehicle => vehicle instanceof Vehicle)) throw new Error('validation.vehicle-invalid');
        this._id = id;
        this._userId = userId;
        this._fullName = fullName.trim();
        this._dni = dni;
        this._phone = phone;
        this._verified = Boolean(verified);
        this._vehicles = [...vehicles];
    }

    /** @returns {?number} Profile identifier. */
    get id() {
        return this._id;
    }

    /** @returns {number} User identifier. */
    get userId() {
        return this._userId;
    }

    /** @returns {string} Carrier full name. */
    get fullName() {
        return this._fullName;
    }

    /** @returns {Dni} DNI. */
    get dni() {
        return this._dni;
    }

    /** @returns {Phone} Phone. */
    get phone() {
        return this._phone;
    }

    /** @returns {boolean} Verification flag. */
    get verified() {
        return this._verified;
    }

    /** @returns {Vehicle[]} Copy of the fleet. */
    get vehicles() {
        return [...this._vehicles];
    }

    /** @returns {Vehicle[]} Active vehicles only. */
    get activeVehicles() {
        return this._vehicles.filter(vehicle => vehicle.active);
    }

    /**
     * @param {number} vehicleId - Vehicle identifier.
     * @returns {Vehicle|undefined} Vehicle when found.
     */
    findVehicle(vehicleId) {
        return this._vehicles.find(vehicle => vehicle.id === Number(vehicleId));
    }

    /**
     * Adds a vehicle to the fleet enforcing plate uniqueness.
     *
     * @param {Vehicle} vehicle - Vehicle to add.
     * @returns {Vehicle} Added vehicle with its identifier.
     * @throws {Error} When the plate is already registered.
     */
    addVehicle(vehicle) {
        if (!(vehicle instanceof Vehicle)) throw new Error('validation.vehicle-invalid');
        if (this._vehicles.some(existing => existing.plate.equals(vehicle.plate))) throw new Error('validation.plate-already-registered');
        const nextId = this._vehicles.reduce((max, existing) => Math.max(max, existing.id ?? 0), 0) + 1;
        vehicle.assignId(nextId);
        this._vehicles.push(vehicle);
        return vehicle;
    }

    /**
     * Replaces the data of an existing vehicle enforcing plate uniqueness.
     *
     * @param {Vehicle} vehicle - Vehicle with the new data and an existing identifier.
     * @returns {void}
     * @throws {Error} When the vehicle does not exist or the plate is duplicated.
     */
    updateVehicle(vehicle) {
        const index = this._vehicles.findIndex(existing => existing.id === vehicle.id);
        if (index < 0) throw new Error('validation.vehicle-not-found');
        if (this._vehicles.some(existing => existing.id !== vehicle.id && existing.plate.equals(vehicle.plate))) throw new Error('validation.plate-already-registered');
        this._vehicles.splice(index, 1, vehicle);
    }

    /**
     * Removes a vehicle from the fleet.
     *
     * @param {number} vehicleId - Vehicle identifier.
     * @returns {void}
     * @throws {Error} When the vehicle does not exist.
     */
    removeVehicle(vehicleId) {
        const index = this._vehicles.findIndex(existing => existing.id === Number(vehicleId));
        if (index < 0) throw new Error('validation.vehicle-not-found');
        this._vehicles.splice(index, 1);
    }

    /**
     * Updates the contact data of the carrier.
     *
     * @param {Object} params - New data.
     * @param {string} params.fullName - Full name.
     * @param {Phone} params.phone - Phone.
     * @returns {void}
     */
    updateContact({ fullName, phone }) {
        if ((fullName ?? '').trim().length < 3) throw new Error('validation.full-name-required');
        if (!(phone instanceof Phone)) throw new Error('validation.phone-invalid');
        this._fullName = fullName.trim();
        this._phone = phone;
    }
}
