import {LimaDistricts} from "./lima-districts.js";
import {GeoLocation} from "./geo-location.value-object.js";

/**
 * Immutable value object that represents a street address inside a supported Lima district.
 *
 * @class Address
 */
export class Address {
    /**
     * Minimum length accepted for the street line.
     * @type {number}
     */
    static MIN_STREET_LENGTH = 5;

    /**
     * @param {Object} params - Value object attributes.
     * @param {string} params.street - Street, number and reference.
     * @param {string} params.district - District name from the Lima districts catalog.
     * @throws {Error} When the street is too short or the district is not supported.
     */
    constructor({ street, district }) {
        const normalizedStreet = (street ?? '').trim();
        if (normalizedStreet.length < Address.MIN_STREET_LENGTH) throw new Error('validation.address-street-required');
        if (!Object.hasOwn(LimaDistricts, district)) throw new Error('validation.address-district-invalid');
        this._street = normalizedStreet;
        this._district = district;
        Object.freeze(this);
    }

    /** @returns {string} Street line. */
    get street() {
        return this._street;
    }

    /** @returns {string} District name. */
    get district() {
        return this._district;
    }

    /** @returns {GeoLocation} Approximate location of the address based on its district. */
    get location() {
        return new GeoLocation(LimaDistricts[this._district]);
    }

    /** @returns {string} Human readable address. */
    get fullAddress() {
        return `${this._street}, ${this._district}`;
    }

    /**
     * @param {Address} other - Address to compare.
     * @returns {boolean} True when both addresses are equal.
     */
    equals(other) {
        return other instanceof Address
            && other.street.toLowerCase() === this._street.toLowerCase()
            && other.district === this._district;
    }
}
