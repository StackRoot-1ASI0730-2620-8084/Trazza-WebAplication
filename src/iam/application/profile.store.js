import {computed, reactive} from "vue";
import {ProfileApi} from "../infrastructure/profile-api.js";
import {CarrierProfileAssembler} from "../infrastructure/carrier-profile.assembler.js";
import {MerchantProfileAssembler} from "../infrastructure/merchant-profile.assembler.js";
import {CarrierProfile} from "../domain/model/carrier-profile.entity.js";
import {MerchantProfile} from "../domain/model/merchant-profile.entity.js";
import {Vehicle} from "../domain/model/vehicle.entity.js";
import {Dni} from "../domain/model/dni.value-object.js";
import {Ruc} from "../domain/model/ruc.value-object.js";
import {Phone} from "../domain/model/phone.value-object.js";
import {LicensePlate} from "../domain/model/license-plate.value-object.js";
import {LoadCapacity} from "../domain/model/load-capacity.value-object.js";
import useIamStore from "./iam.store.js";

const profileApi = new ProfileApi();

/**
 * Reactive state of carrier and merchant profiles.
 *
 * @type {{carrierProfiles: CarrierProfile[], merchantProfiles: MerchantProfile[], loaded: boolean, errors: Error[]}}
 */
const state = reactive({
    carrierProfiles: [],
    merchantProfiles: [],
    loaded: false,
    errors: []
});

/** @type {import('vue').ComputedRef<?CarrierProfile>} Profile of the signed-in carrier. */
const currentCarrierProfile = computed(() => getCarrierProfileByUserId(useIamStore().currentUserId.value) ?? null);

/** @type {import('vue').ComputedRef<?MerchantProfile>} Profile of the signed-in merchant. */
const currentMerchantProfile = computed(() => getMerchantProfileByUserId(useIamStore().currentUserId.value) ?? null);

/**
 * Loads every carrier and merchant profile.
 *
 * @returns {Promise<void>}
 */
async function fetchProfiles() {
    try {
        const [carrierResponse, merchantResponse] = await Promise.all([
            profileApi.getCarrierProfiles(),
            profileApi.getMerchantProfiles()
        ]);
        state.carrierProfiles = CarrierProfileAssembler.toEntitiesFromResponse(carrierResponse);
        state.merchantProfiles = MerchantProfileAssembler.toEntitiesFromResponse(merchantResponse);
        state.loaded = true;
        state.errors = [];
    } catch (error) {
        state.errors.push(error);
    }
}

/**
 * @param {?number} userId - User identifier.
 * @returns {CarrierProfile|undefined} Carrier profile of the user.
 */
function getCarrierProfileByUserId(userId) {
    return state.carrierProfiles.find(profile => profile.userId === userId);
}

/**
 * @param {?number} userId - User identifier.
 * @returns {MerchantProfile|undefined} Merchant profile of the user.
 */
function getMerchantProfileByUserId(userId) {
    return state.merchantProfiles.find(profile => profile.userId === userId);
}

/**
 * Returns the public display name of a user regardless of its role.
 *
 * @param {number} userId - User identifier.
 * @returns {string} Carrier full name, merchant business name or an empty string.
 */
function displayNameOf(userId) {
    return getCarrierProfileByUserId(userId)?.fullName ?? getMerchantProfileByUserId(userId)?.businessName ?? '';
}

/**
 * Creates the carrier or merchant profile of a newly registered user.
 *
 * @param {import('../domain/model/user.entity.js').User} user - Registered user.
 * @param {import('../domain/commands/sign-up.command.js').SignUpCommand} signUpCommand - Sign-up command.
 * @returns {Promise<CarrierProfile|MerchantProfile>} Created profile.
 */
async function createProfileForUser(user, signUpCommand) {
    if (user.isCarrier) {
        const profile = new CarrierProfile({
            userId: user.id,
            fullName: signUpCommand.fullName,
            dni: new Dni(signUpCommand.documentNumber),
            phone: new Phone(signUpCommand.phone)
        });
        const response = await profileApi.createCarrierProfile(CarrierProfileAssembler.toResourceFromEntity(profile));
        const created = CarrierProfileAssembler.toEntityFromResource(response.data);
        state.carrierProfiles.push(created);
        return created;
    }
    const profile = new MerchantProfile({
        userId: user.id,
        businessName: signUpCommand.businessName,
        contactName: signUpCommand.fullName,
        ruc: new Ruc(signUpCommand.documentNumber),
        phone: new Phone(signUpCommand.phone)
    });
    const response = await profileApi.createMerchantProfile(MerchantProfileAssembler.toResourceFromEntity(profile));
    const created = MerchantProfileAssembler.toEntityFromResource(response.data);
    state.merchantProfiles.push(created);
    return created;
}

/**
 * Persists the current state of the signed-in carrier profile and reloads it when the request fails.
 *
 * @param {CarrierProfile} profile - Carrier profile to persist.
 * @returns {Promise<void>}
 */
async function persistCarrierProfile(profile) {
    try {
        await profileApi.updateCarrierProfile(CarrierProfileAssembler.toResourceFromEntity(profile));
    } catch (error) {
        state.errors.push(error);
        await fetchProfiles();
        throw error;
    }
}

/**
 * Builds a vehicle entity from form data.
 *
 * @param {Object} data - Vehicle form data.
 * @returns {Vehicle} Vehicle entity.
 */
function buildVehicle(data) {
    return new Vehicle({
        id: data.id ?? null,
        plate: new LicensePlate(data.plate),
        brandModel: data.brandModel,
        bodyType: data.bodyType,
        capacity: new LoadCapacity({ weightKg: data.capacityKg, volumeM3: data.volumeM3 }),
        active: data.active ?? true
    });
}

/**
 * Adds a vehicle to the fleet of the signed-in carrier.
 *
 * @param {Object} data - Vehicle form data.
 * @returns {Promise<Vehicle>} Added vehicle.
 */
async function addVehicle(data) {
    const profile = currentCarrierProfile.value;
    const vehicle = profile.addVehicle(buildVehicle(data));
    await persistCarrierProfile(profile);
    return vehicle;
}

/**
 * Updates a vehicle of the signed-in carrier.
 *
 * @param {Object} data - Vehicle form data including the identifier.
 * @returns {Promise<void>}
 */
async function updateVehicle(data) {
    const profile = currentCarrierProfile.value;
    profile.updateVehicle(buildVehicle({ ...data, id: Number(data.id) }));
    await persistCarrierProfile(profile);
}

/**
 * Activates or deactivates a vehicle of the signed-in carrier.
 *
 * @param {number} vehicleId - Vehicle identifier.
 * @returns {Promise<void>}
 */
async function toggleVehicle(vehicleId) {
    const profile = currentCarrierProfile.value;
    const vehicle = profile.findVehicle(vehicleId);
    if (!vehicle) throw new Error('validation.vehicle-not-found');
    if (vehicle.active) vehicle.deactivate(); else vehicle.activate();
    await persistCarrierProfile(profile);
}

/**
 * Removes a vehicle from the fleet of the signed-in carrier.
 *
 * @param {number} vehicleId - Vehicle identifier.
 * @returns {Promise<void>}
 */
async function removeVehicle(vehicleId) {
    const profile = currentCarrierProfile.value;
    profile.removeVehicle(vehicleId);
    await persistCarrierProfile(profile);
}

/**
 * Updates the profile of the signed-in user (carrier contact data or merchant business data).
 *
 * @param {Object} data - Profile form data.
 * @returns {Promise<void>}
 */
async function updateCurrentProfile(data) {
    const iamStore = useIamStore();
    const phone = new Phone(data.phone);
    if (iamStore.isCarrier.value) {
        const profile = currentCarrierProfile.value;
        profile.updateContact({ fullName: data.fullName, phone });
        await persistCarrierProfile(profile);
    } else {
        const profile = currentMerchantProfile.value;
        profile.updateBusiness({ businessName: data.businessName, contactName: data.fullName, phone });
        await profileApi.updateMerchantProfile(MerchantProfileAssembler.toResourceFromEntity(profile));
    }
    await iamStore.updateCurrentUser({ fullName: data.fullName, phone: data.phone });
}

const profileStore = {
    state,
    currentCarrierProfile,
    currentMerchantProfile,
    fetchProfiles,
    getCarrierProfileByUserId,
    getMerchantProfileByUserId,
    displayNameOf,
    createProfileForUser,
    addVehicle,
    updateVehicle,
    toggleVehicle,
    removeVehicle,
    updateCurrentProfile
};

/**
 * Application service store for carrier and merchant profiles, including the carrier fleet.
 *
 * @returns {typeof profileStore} Store state, getters and actions.
 */
const useProfileStore = () => profileStore;

export default useProfileStore;
