import {computed, reactive} from "vue";
import {MatchmakingApi} from "../infrastructure/matchmaking-api.js";
import {ReturnRouteAssembler} from "../infrastructure/return-route.assembler.js";
import {FreightRequestAssembler} from "../infrastructure/freight-request.assembler.js";
import {MatchProposalAssembler} from "../infrastructure/match-proposal.assembler.js";
import {ReturnRoute} from "../domain/model/return-route.entity.js";
import {FreightRequest} from "../domain/model/freight-request.entity.js";
import {MatchProposal} from "../domain/model/match-proposal.entity.js";
import {TimeWindow} from "../domain/model/time-window.value-object.js";
import {Cargo} from "../domain/model/cargo.value-object.js";
import {CargoType} from "../domain/model/cargo-type.value-object.js";
import {RouteMatchingService} from "../domain/services/route-matching.service.js";
import {Address} from "../../shared/domain/model/address.value-object.js";
import {Money} from "../../shared/domain/model/money.value-object.js";
import useIamStore from "../../iam/application/iam.store.js";
import useProfileStore from "../../iam/application/profile.store.js";
import useBillingStore from "../../billing/application/billing.store.js";
import useExecutionStore from "../../execution/application/execution.store.js";
import useNotificationStore from "../../shared/application/notification.store.js";

const matchmakingApi = new MatchmakingApi();

/**
 * Reactive state of the Matchmaking & Routing bounded context.
 *
 * @type {{returnRoutes: ReturnRoute[], freightRequests: FreightRequest[], matchProposals: MatchProposal[], loaded: boolean, errors: Error[]}}
 */
const state = reactive({
    returnRoutes: [],
    freightRequests: [],
    matchProposals: [],
    loaded: false,
    errors: []
});

/**
 * @returns {string} Today as an ISO local date (YYYY-MM-DD).
 */
const today = () => new Date().toLocaleDateString('en-CA');

/** @returns {?number} Identifier of the signed-in user. */
const currentUserId = () => useIamStore().currentUserId.value;

/** @returns {?string} Role of the signed-in user. */
const currentRole = () => useIamStore().currentRole.value;

/** @type {import('vue').ComputedRef<ReturnRoute[]>} Return routes of the signed-in carrier, newest first. */
const myReturnRoutes = computed(() => state.returnRoutes
    .filter(route => route.carrierId === currentUserId())
    .sort((a, b) => b.departureDate.localeCompare(a.departureDate)));

/** @type {import('vue').ComputedRef<ReturnRoute[]>} Active return routes of the signed-in carrier. */
const myActiveReturnRoutes = computed(() => myReturnRoutes.value.filter(route => route.status.isActive));

/** @type {import('vue').ComputedRef<FreightRequest[]>} Freight requests of the signed-in merchant, newest first. */
const myFreightRequests = computed(() => state.freightRequests
    .filter(request => request.merchantId === currentUserId())
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));

/** @type {import('vue').ComputedRef<MatchProposal[]>} Proposals where the signed-in user takes part, newest first. */
const myProposals = computed(() => state.matchProposals
    .filter(proposal => proposal.carrierId === currentUserId() || proposal.merchantId === currentUserId())
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')));

/** @type {import('vue').ComputedRef<MatchProposal[]>} Proposals waiting for an answer of the signed-in user. */
const proposalsAwaitingMe = computed(() => myProposals.value.filter(proposal =>
    proposal.isAwaiting(currentRole()) || (currentRole() === 'merchant' && proposal.status.value === 'accepted')));

/** @type {import('vue').ComputedRef<number>} Publications (routes or requests) created by the user this month. */
const publicationsThisMonth = computed(() => {
    const month = today().slice(0, 7);
    const publications = currentRole() === 'carrier' ? myReturnRoutes.value : myFreightRequests.value;
    return publications.filter(item => (item.createdAt ?? '').slice(0, 7) === month).length;
});

/**
 * Loads return routes, freight requests and match proposals.
 *
 * @returns {Promise<void>}
 */
async function fetchAll() {
    try {
        const [routesResponse, requestsResponse, proposalsResponse] = await Promise.all([
            matchmakingApi.getReturnRoutes(),
            matchmakingApi.getFreightRequests(),
            matchmakingApi.getMatchProposals()
        ]);
        state.returnRoutes = ReturnRouteAssembler.toEntitiesFromResponse(routesResponse);
        state.freightRequests = FreightRequestAssembler.toEntitiesFromResponse(requestsResponse);
        state.matchProposals = MatchProposalAssembler.toEntitiesFromResponse(proposalsResponse);
        state.loaded = true;
        state.errors = [];
        if (proposalsAwaitingMe.value.length) {
            useNotificationStore().notify({
                severity: 'info',
                summaryKey: 'alerts.offers-waiting',
                params: { count: proposalsAwaitingMe.value.length }
            });
        }
    } catch (error) {
        state.errors.push(error);
    }
}

/**
 * @param {number|string} id - Route identifier.
 * @returns {ReturnRoute|undefined} Return route.
 */
function getReturnRouteById(id) {
    return state.returnRoutes.find(route => route.id === Number(id));
}

/**
 * @param {number|string} id - Request identifier.
 * @returns {FreightRequest|undefined} Freight request.
 */
function getFreightRequestById(id) {
    return state.freightRequests.find(request => request.id === Number(id));
}

/**
 * @param {number|string} id - Proposal identifier.
 * @returns {MatchProposal|undefined} Match proposal.
 */
function getProposalById(id) {
    return state.matchProposals.find(proposal => proposal.id === Number(id));
}

/**
 * @param {number|string} requestId - Freight request identifier.
 * @returns {MatchProposal[]} Proposals received by a freight request.
 */
function proposalsForRequest(requestId) {
    return state.matchProposals.filter(proposal => proposal.freightRequestId === Number(requestId));
}

/**
 * Ensures the signed-in user can still publish according to its subscription plan.
 *
 * @returns {void}
 * @throws {Error} When the monthly publication limit was reached.
 */
function assertCanPublish() {
    if (!useBillingStore().canPublish(publicationsThisMonth.value)) throw new Error('validation.publication-limit-reached');
}

/**
 * Replaces an aggregate in a collection after it was persisted.
 *
 * @param {Array} collection - State collection.
 * @param {Object} entity - Persisted aggregate.
 * @returns {void}
 */
function replaceIn(collection, entity) {
    const index = collection.findIndex(item => item.id === entity.id);
    if (index >= 0) collection.splice(index, 1, entity); else collection.push(entity);
}

/**
 * Publishes a return route for the signed-in carrier.
 *
 * @param {Object} form - Return route form data.
 * @returns {Promise<ReturnRoute>} Published route.
 */
async function publishReturnRoute(form) {
    const profile = useProfileStore().currentCarrierProfile.value;
    const vehicle = profile?.findVehicle(form.vehicleId);
    if (!vehicle) throw new Error('validation.vehicle-required');
    if (!vehicle.active) throw new Error('validation.vehicle-inactive');
    assertCanPublish();
    const route = ReturnRoute.create({
        today: today(),
        vehicleCapacityKg: vehicle.capacity.weightKg,
        vehicleCapacityM3: vehicle.capacity.volumeM3,
        carrierId: currentUserId(),
        vehicleId: vehicle.id,
        vehicleLabel: vehicle.label,
        origin: new Address(form.origin),
        destination: new Address(form.destination),
        departureDate: form.departureDate,
        timeWindow: new TimeWindow(form.timeWindow),
        availableWeightKg: form.availableWeightKg,
        availableVolumeM3: form.availableVolumeM3 ?? 0,
        maxDetourKm: form.maxDetourKm,
        acceptedCargoTypes: (form.acceptedCargoTypes ?? []).map(type => new CargoType(type))
    });
    const response = await matchmakingApi.createReturnRoute(ReturnRouteAssembler.toResourceFromEntity(route));
    const created = ReturnRouteAssembler.toEntityFromResource(response.data);
    state.returnRoutes.push(created);
    return created;
}

/**
 * Closes a return route of the signed-in carrier and closes its open proposals.
 *
 * @param {ReturnRoute} route - Route to close.
 * @returns {Promise<void>}
 */
async function closeReturnRoute(route) {
    route.close();
    await matchmakingApi.updateReturnRoute(ReturnRouteAssembler.toResourceFromEntity(route));
    const openProposals = state.matchProposals.filter(proposal => proposal.returnRouteId === route.id && proposal.status.isOpen);
    for (const proposal of openProposals) {
        proposal.close();
        await matchmakingApi.updateMatchProposal(MatchProposalAssembler.toResourceFromEntity(proposal));
    }
}

/**
 * Builds a freight request aggregate from form data.
 *
 * @param {Object} form - Freight request form data.
 * @param {boolean} publish - Whether the request is published or saved as draft.
 * @param {?FreightRequest} existing - Request being edited.
 * @returns {FreightRequest} Freight request aggregate.
 */
function buildFreightRequest(form, publish, existing) {
    const hasRate = form.offeredRate !== null && form.offeredRate !== undefined && form.offeredRate !== '';
    return FreightRequest.create({
        today: today(),
        publish,
        id: existing?.id ?? null,
        code: existing?.code,
        createdAt: existing?.createdAt,
        merchantId: currentUserId(),
        pickup: new Address(form.pickup),
        delivery: new Address(form.delivery),
        pickupDate: form.pickupDate,
        pickupWindow: new TimeWindow(form.pickupWindow),
        cargo: new Cargo({
            type: new CargoType(form.cargoType),
            weightKg: form.weightKg,
            volumeM3: form.volumeM3 ?? 0,
            description: form.description
        }),
        offeredRate: hasRate ? new Money({ amount: form.offeredRate }) : null
    });
}

/**
 * Creates or updates a freight request of the signed-in merchant.
 *
 * @param {Object} form - Freight request form data.
 * @param {boolean} publish - True to publish, false to save as draft.
 * @param {?number} [existingId=null] - Identifier of the draft being edited.
 * @returns {Promise<FreightRequest>} Saved freight request.
 */
async function saveFreightRequest(form, publish, existingId = null) {
    const existing = existingId ? getFreightRequestById(existingId) : null;
    if (existing && !existing.status.isDraft) throw new Error('validation.request-not-draft');
    if (publish) assertCanPublish();
    const request = buildFreightRequest(form, publish, existing);
    const resource = FreightRequestAssembler.toResourceFromEntity(request);
    const response = existing
        ? await matchmakingApi.updateFreightRequest(resource)
        : await matchmakingApi.createFreightRequest(resource);
    const saved = FreightRequestAssembler.toEntityFromResource(response.data);
    replaceIn(state.freightRequests, saved);
    return saved;
}

/**
 * Publishes a draft freight request.
 *
 * @param {FreightRequest} request - Draft request.
 * @returns {Promise<void>}
 */
async function publishFreightRequest(request) {
    assertCanPublish();
    request.publish();
    await matchmakingApi.updateFreightRequest(FreightRequestAssembler.toResourceFromEntity(request));
}

/**
 * Cancels a freight request and closes its open proposals.
 *
 * @param {FreightRequest} request - Request to cancel.
 * @returns {Promise<void>}
 */
async function cancelFreightRequest(request) {
    request.cancel();
    await matchmakingApi.updateFreightRequest(FreightRequestAssembler.toResourceFromEntity(request));
    for (const proposal of proposalsForRequest(request.id).filter(item => item.status.isOpen)) {
        proposal.close();
        await matchmakingApi.updateMatchProposal(MatchProposalAssembler.toResourceFromEntity(proposal));
    }
}

/**
 * Returns the open freight requests compatible with a return route.
 *
 * @param {number|string} routeId - Return route identifier.
 * @param {Object} [filters={}] - Optional filters.
 * @param {?string} [filters.cargoType=null] - Cargo type to keep.
 * @param {?number} [filters.maxDetourKm=null] - Maximum detour override.
 * @param {string} [filters.sortBy='detour'] - "detour", "rate" or "weight".
 * @returns {Array<{request: FreightRequest, detour: import('../domain/model/detour.value-object.js').Detour, proposal: ?MatchProposal}>} Suggestions.
 */
function getLoadSuggestions(routeId, filters = {}) {
    const route = getReturnRouteById(routeId);
    if (!route) return [];
    const suggestions = state.freightRequests
        .filter(request => request.merchantId !== route.carrierId)
        .filter(request => !filters.cargoType || request.cargo.type.value === filters.cargoType)
        .map(request => ({ request, evaluation: RouteMatchingService.evaluate(route, request, { maxDetourKm: filters.maxDetourKm ?? route.maxDetourKm }) }))
        .filter(item => item.evaluation.compatible)
        .map(item => ({
            request: item.request,
            detour: item.evaluation.detour,
            proposal: state.matchProposals.find(proposal => proposal.freightRequestId === item.request.id && proposal.returnRouteId === route.id) ?? null
        }));
    const sorters = {
        detour: (a, b) => a.detour.distanceKm - b.detour.distanceKm,
        rate: (a, b) => (b.request.offeredRate?.amount ?? 0) - (a.request.offeredRate?.amount ?? 0),
        weight: (a, b) => b.request.cargo.weightKg - a.request.cargo.weightKg
    };
    return suggestions.sort(sorters[filters.sortBy ?? 'detour'] ?? sorters.detour);
}

/**
 * Returns the active return routes of other carriers compatible with a freight request.
 *
 * @param {number|string} requestId - Freight request identifier.
 * @returns {Array<{route: ReturnRoute, detour: import('../domain/model/detour.value-object.js').Detour, proposal: ?MatchProposal}>} Carriers on the way.
 */
function findCarriersFor(requestId) {
    const request = getFreightRequestById(requestId);
    if (!request) return [];
    return state.returnRoutes
        .filter(route => route.carrierId !== request.merchantId)
        .map(route => ({ route, evaluation: RouteMatchingService.evaluate(route, request) }))
        .filter(item => item.evaluation.compatible)
        .map(item => ({
            route: item.route,
            detour: item.evaluation.detour,
            proposal: state.matchProposals.find(proposal => proposal.freightRequestId === request.id && proposal.returnRouteId === item.route.id) ?? null
        }))
        .sort((a, b) => a.detour.distanceKm - b.detour.distanceKm);
}

/**
 * Opens a negotiation between a return route and a freight request.
 *
 * @param {Object} params - Proposal data.
 * @param {number} params.routeId - Return route identifier.
 * @param {number} params.requestId - Freight request identifier.
 * @param {number} params.amount - Proposed rate in soles.
 * @returns {Promise<MatchProposal>} Created proposal.
 */
async function sendProposal({ routeId, requestId, amount }) {
    const route = getReturnRouteById(routeId);
    const request = getFreightRequestById(requestId);
    if (!route) throw new Error('validation.route-required');
    if (!request) throw new Error('validation.request-required');
    const duplicated = state.matchProposals.some(proposal =>
        proposal.freightRequestId === request.id && proposal.returnRouteId === route.id && proposal.status.isOpen);
    if (duplicated) throw new Error('validation.proposal-already-exists');
    const evaluation = RouteMatchingService.evaluate(route, request);
    if (!evaluation.compatible) throw new Error(evaluation.reasons[0]);
    const proposal = MatchProposal.create({
        freightRequest: request,
        returnRoute: route,
        rate: new Money({ amount }),
        by: currentRole(),
        detour: evaluation.detour
    });
    const response = await matchmakingApi.createMatchProposal(MatchProposalAssembler.toResourceFromEntity(proposal));
    const created = MatchProposalAssembler.toEntityFromResource(response.data);
    state.matchProposals.push(created);
    return created;
}

/**
 * Persists a proposal after a negotiation step.
 *
 * @param {MatchProposal} proposal - Proposal to persist.
 * @returns {Promise<void>}
 */
async function persistProposal(proposal) {
    try {
        await matchmakingApi.updateMatchProposal(MatchProposalAssembler.toResourceFromEntity(proposal));
    } catch (error) {
        state.errors.push(error);
        await fetchAll();
        throw error;
    }
}

/**
 * Accepts the rate proposed by the counterpart.
 *
 * @param {MatchProposal} proposal - Proposal to accept.
 * @returns {Promise<void>}
 */
async function acceptProposal(proposal) {
    proposal.accept(currentRole());
    await persistProposal(proposal);
}

/**
 * Answers the current offer with a different rate.
 *
 * @param {MatchProposal} proposal - Proposal to counter.
 * @param {number} amount - New rate in soles.
 * @returns {Promise<void>}
 */
async function counterProposal(proposal, amount) {
    proposal.counter(new Money({ amount }), currentRole());
    await persistProposal(proposal);
}

/**
 * Rejects a proposal.
 *
 * @param {MatchProposal} proposal - Proposal to reject.
 * @returns {Promise<void>}
 */
async function rejectProposal(proposal) {
    proposal.reject(currentRole());
    await persistProposal(proposal);
}

/**
 * Confirms a match: the request is matched, the route capacity is reserved, competing proposals are closed
 * and a shipment is opened in the Service Execution context.
 *
 * @param {MatchProposal} proposal - Accepted proposal.
 * @returns {Promise<import('../../execution/domain/model/shipment.entity.js').Shipment>} Created shipment.
 */
async function confirmMatch(proposal) {
    const request = getFreightRequestById(proposal.freightRequestId);
    const route = getReturnRouteById(proposal.returnRouteId);
    if (!request || !route) throw new Error('validation.request-required');
    if (!request.status.isOpen) throw new Error('validation.request-not-open');
    if (!route.status.isActive || !route.canCarry(request.cargo.weightKg, request.cargo.volumeM3)) throw new Error('validation.route-capacity-insufficient');
    proposal.confirm(currentRole());
    request.markMatched();
    route.reserveCapacity(request.cargo.weightKg, request.cargo.volumeM3);
    await matchmakingApi.updateMatchProposal(MatchProposalAssembler.toResourceFromEntity(proposal));
    await matchmakingApi.updateFreightRequest(FreightRequestAssembler.toResourceFromEntity(request));
    await matchmakingApi.updateReturnRoute(ReturnRouteAssembler.toResourceFromEntity(route));
    for (const competitor of proposalsForRequest(request.id).filter(item => item.id !== proposal.id && item.status.isOpen)) {
        competitor.close();
        await matchmakingApi.updateMatchProposal(MatchProposalAssembler.toResourceFromEntity(competitor));
    }
    const profileStore = useProfileStore();
    const carrierProfile = profileStore.getCarrierProfileByUserId(proposal.carrierId);
    const merchantProfile = profileStore.getMerchantProfileByUserId(proposal.merchantId);
    const shipment = await useExecutionStore().openShipment({
        proposalId: proposal.id,
        freightRequestId: request.id,
        returnRouteId: route.id,
        carrierId: proposal.carrierId,
        carrierName: carrierProfile?.fullName ?? '',
        carrierPhone: carrierProfile?.phone.value ?? '',
        vehicleLabel: route.vehicleLabel,
        merchantId: proposal.merchantId,
        merchantName: merchantProfile?.businessName ?? '',
        merchantPhone: merchantProfile?.phone.value ?? '',
        pickup: request.pickup,
        delivery: request.delivery,
        pickupDate: request.pickupDate,
        pickupWindow: request.pickupWindow.label,
        cargoDescription: request.cargo.description,
        cargoType: request.cargo.type.value,
        weightKg: request.cargo.weightKg,
        rate: proposal.currentRate
    });
    useNotificationStore().notify({ severity: 'success', summaryKey: 'alerts.match-confirmed', params: { code: request.code } });
    return shipment;
}

const matchmakingStore = {
    state,
    myReturnRoutes,
    myActiveReturnRoutes,
    myFreightRequests,
    myProposals,
    proposalsAwaitingMe,
    publicationsThisMonth,
    fetchAll,
    getReturnRouteById,
    getFreightRequestById,
    getProposalById,
    proposalsForRequest,
    publishReturnRoute,
    closeReturnRoute,
    saveFreightRequest,
    publishFreightRequest,
    cancelFreightRequest,
    getLoadSuggestions,
    findCarriersFor,
    sendProposal,
    acceptProposal,
    counterProposal,
    rejectProposal,
    confirmMatch
};

/**
 * Application service store for the Matchmaking & Routing bounded context (core domain).
 * It coordinates return routes, freight requests, load suggestions and rate negotiation.
 *
 * @returns {typeof matchmakingStore} Store state, getters and actions.
 */
const useMatchmakingStore = () => matchmakingStore;

export default useMatchmakingStore;
