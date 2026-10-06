# Architecture Decision Records (ADRs)

## Overview
This document records the key architectural decisions made for the Trazza web application. Each record follows standard Architecture Decision Record (ADR) practices (incorporating Michael Nygard and MADR conventions) to provide context, rationale and consequences for architectural choices.

---

## Table of Contents
- [ADR-001: Adoption of Domain-Driven Design (DDD) Layered Architecture with the Trazza Bounded Contexts](#adr-001-adoption-of-domain-driven-design-ddd-layered-architecture-with-the-trazza-bounded-contexts)
- [ADR-002: Core Frontend Framework Selection: Vue 3 with Composition API and Vite](#adr-002-core-frontend-framework-selection-vue-3-with-composition-api-and-vite)
- [ADR-003: State Management with Vue Native Reactivity in the Application Layer](#adr-003-state-management-with-vue-native-reactivity-in-the-application-layer)
- [ADR-004: UI Component Framework Selection: PrimeVue with PrimeFlex and PrimeIcons](#adr-004-ui-component-framework-selection-primevue-with-primeflex-and-primeicons)
- [ADR-005: API Gateway and Data Transformation via Assembler Pattern](#adr-005-api-gateway-and-data-transformation-via-assembler-pattern)
- [ADR-006: Centralized HTTP Client, Interceptors, and Endpoint Abstraction](#adr-006-centralized-http-client-interceptors-and-endpoint-abstraction)
- [ADR-007: Route Protection and Role-Based Navigation via Vue Router Guards](#adr-007-route-protection-and-role-based-navigation-via-vue-router-guards)
- [ADR-008: Internationalization and Localization Architecture with Vue I18n](#adr-008-internationalization-and-localization-architecture-with-vue-i18n)
- [ADR-009: Immutable Value Objects and Underscore-Prefixed Private State](#adr-009-immutable-value-objects-and-underscore-prefixed-private-state)
- [ADR-010: Shared Kernel and Cross-Context Collaboration through Application Services](#adr-010-shared-kernel-and-cross-context-collaboration-through-application-services)
- [ADR-011: Route Matching as a Domain Service with District-Based Distance Estimation](#adr-011-route-matching-as-a-domain-service-with-district-based-distance-estimation)
- [ADR-012: External Services Behind Infrastructure Adapters and a Mock API](#adr-012-external-services-behind-infrastructure-adapters-and-a-mock-api)

---

## ADR-001: Adoption of Domain-Driven Design (DDD) Layered Architecture with the Trazza Bounded Contexts

### Status
Accepted

### Context
Trazza connects carriers with empty return trips and merchants who need to ship goods. The domain covers identity and profiles, route matching and rate negotiation, trip execution and monitoring, subscription billing and reputation. Each area has its own language and rules, and a flat structure (`/components`, `/views`, `/services`) would mix them and leak business logic into the UI.

### Decision
Structure the codebase around the bounded contexts defined in the Trazza domain model, plus a shared kernel:
- `iam` – IAM & Profiles (Identity & Profile Management).
- `matchmaking` – Matchmaking & Routing (core domain).
- `execution` – Service Execution & Monitoring (IoT & Transit).
- `billing` – Payment & Billing.
- `reputation` – Loyalty & Reputation.
- `shared` – Shared kernel and cross-context presentation.

Every bounded context enforces four layers:
1. **Domain Layer**: aggregates, entities, value objects, commands and domain services as plain JavaScript classes.
2. **Application Layer**: one store per context that orchestrates the use cases.
3. **Infrastructure Layer**: API gateways, assemblers, adapters, guards and interceptors.
4. **Presentation Layer**: views, components and route modules.

### Consequences
- **Positive:**
  - High cohesion inside each context and an explicit ubiquitous language per folder.
  - The core domain (Matchmaking) can evolve without touching generic contexts.
  - Clear boundaries make the code easy to defend and review.
- **Negative:**
  - More files and boilerplate (assemblers, value objects) than direct API-to-template bindings.
  - Developers must respect the layer boundaries.

---

## ADR-002: Core Frontend Framework Selection: Vue 3 with Composition API and Vite

### Status
Accepted

### Context
The application needs a modern reactive framework with fast tooling and small bundles, and it must run on the same stack used in the course.

### Decision
Use **Vue 3** (Single-File Components with `<script setup>`) built with **Vite**.

### Consequences
- **Positive:**
  - Fast Hot Module Replacement and build times.
  - The Composition API integrates naturally with reactive application stores.
- **Negative:**
  - The build pipeline (`vite.config.js`) must be maintained.

---

## ADR-003: State Management with Vue Native Reactivity in the Application Layer

### Status
Accepted

### Context
Each bounded context needs an application service that coordinates use cases, keeps loading and error state and exposes derived data to views. The project must avoid unnecessary dependencies and keep the application layer framework-light.

### Decision
Implement one store per bounded context with Vue native reactivity: the state is a `reactive({})` object, derived data uses `computed`, and use cases are plain functions. Each module exports a `useXStore()` function that returns a singleton (`useIamStore`, `useProfileStore`, `useMatchmakingStore`, `useExecutionStore`, `useBillingStore`, `useReputationStore`, `useNotificationStore`). Pinia is not used.

### Consequences
- **Positive:**
  - No extra state library; the reactivity model is the same one used by components.
  - Stores are simple ES modules, easy to read and test.
- **Negative:**
  - No devtools time travel or plugins provided by Pinia.
  - Singleton stores must be reset explicitly when needed (for example on sign-out).

---

## ADR-004: UI Component Framework Selection: PrimeVue with PrimeFlex and PrimeIcons

### Status
Accepted

### Context
The product needs data tables, forms, dialogs, date pickers, ratings, toasts and a responsive grid with minimal custom CSS.

### Decision
Adopt **PrimeVue** with the **Aura** preset customized with the Trazza Figma palette (primary #0037b0) (`definePreset`), **PrimeFlex** utilities and **PrimeIcons**. Components are registered globally with the `pv-` prefix in `main.js`, together with the Toast, Confirmation and Dialog services.

### Consequences
- **Positive:**
  - Accessible, consistent components and a responsive grid.
  - The brand palette is applied through design tokens instead of overrides.
- **Negative:**
  - Coupling to PrimeVue's component API and token system.

---

## ADR-005: API Gateway and Data Transformation via Assembler Pattern

### Status
Accepted

### Context
API payloads are flat JSON documents, while the domain uses aggregates and value objects. Binding payloads directly to views would couple the UI to the backend schema and skip the domain validations.

### Decision
Implement the **Assembler (Data Mapper) pattern** in every infrastructure layer: `UserAssembler`, `CarrierProfileAssembler`, `VehicleAssembler`, `MerchantProfileAssembler`, `ReturnRouteAssembler`, `FreightRequestAssembler`, `MatchProposalAssembler`, `ShipmentAssembler`, `IncidentAssembler`, `PaymentTransactionAssembler`, `ReceiptAssembler` and `RatingAssembler`. Each assembler exposes `toEntityFromResource`, `toEntitiesFromResponse` and `toResourceFromEntity`.

### Consequences
- **Positive:**
  - Acts as an Anti-Corruption Layer between the API and the domain.
  - Every object that reaches the application layer is a valid domain object.
- **Negative:**
  - Every new attribute must be mapped in both directions.

---

## ADR-006: Centralized HTTP Client, Interceptors, and Endpoint Abstraction

### Status
Accepted

### Context
Each bounded context calls its own endpoints. Duplicating base URLs, headers and CRUD calls in every gateway would be error-prone.

### Decision
1. `BaseApi` creates the Axios instance with the base URL from `VITE_TRAZZA_PLATFORM_API_URL` and registers the `iamInterceptor`.
2. `BaseEndpoint` encapsulates the REST operations (`getAll` with query filters, `getById`, `create`, `update`, `delete`).
3. Every context gateway (`IamApi`, `ProfileApi`, `MatchmakingApi`, `ExecutionApi`, `BillingApi`, `ReputationApi`) extends `BaseApi` and composes `BaseEndpoint` instances.
4. The interceptor reads the session token from the browser storage, so the shared infrastructure does not depend on the IAM store (no circular imports).

### Consequences
- **Positive:**
  - Consistent configuration and automatic `Authorization: Bearer` header.
  - Endpoint paths are configured per environment.
- **Negative:**
  - Gateways follow REST conventions imposed by `BaseEndpoint`.

---

## ADR-007: Route Protection and Role-Based Navigation via Vue Router Guards

### Status
Accepted

### Context
Trazza has two kinds of accounts. Carrier pages (return routes, active trip, vehicles) must not be available to merchants and merchant pages (freight requests, tracking) must not be available to carriers. Anonymous users can only reach sign-in and sign-up.

### Decision
Each route module declares `meta.public` and `meta.roles`. The `authenticationGuard` (IAM infrastructure) is wired in `router.beforeEach`: anonymous users are sent to sign-in, signed-in users are sent away from public pages, and users whose role is not listed in `meta.roles` are redirected to the dashboard. The side menu is also built from the role.

### Consequences
- **Positive:**
  - Declarative and centralized access rules.
- **Negative:**
  - Client-side guards are only a UX protection; the backend must authorize every request.

---

## ADR-008: Internationalization and Localization Architecture with Vue I18n

### Status
Accepted

### Context
Trazza is used in Peru, and the mock-ups show an EN | ES switch. Domain validation errors must also be shown in the selected language.

### Decision
Use **Vue I18n** with `en.json` and `es.json` catalogs. Domain objects throw errors whose message is an i18n key (`validation.*`, `matching.*`); the `useErrorHandler` composable translates them. The `LanguageSwitcher` lives in the top bar and in the authentication layout.

### Consequences
- **Positive:**
  - The domain stays language-agnostic while users read localized messages.
- **Negative:**
  - Both catalogs must be kept in sync whenever a key is added.

---

## ADR-009: Immutable Value Objects and Underscore-Prefixed Private State

### Status
Accepted

### Context
Domain objects are stored in Vue `reactive` state, which wraps them in Proxies. Native private class members (`#field`) throw `TypeError` when they are accessed through a Proxy, which breaks reactivity. At the same time, value objects must not change after creation and must reject invalid data.

### Decision
- Value objects validate every rule in the constructor and finish with `Object.freeze(this)`. Operations return new instances (`Money.add`, `GeoLocation.moveTowards`).
- Entities and aggregates keep their state in `_`-prefixed members, expose it through getters and change it only through intention-revealing methods (`reserveCapacity`, `counter`, `confirmDelivery`, `reportIncident`).
- The native `#` syntax is not used anywhere in the codebase.

### Consequences
- **Positive:**
  - Invalid objects cannot exist; business rules live in one place.
  - Full compatibility with Vue 3 reactivity.
- **Negative:**
  - `_` privacy is a convention, not enforced by the language.

---

## ADR-010: Shared Kernel and Cross-Context Collaboration through Application Services

### Status
Accepted

### Context
Some concepts are used by several contexts (money, addresses, locations), and some use cases span contexts: confirming a match must open a shipment, publishing must respect the subscription plan, and rating requires a delivered shipment.

### Decision
- A **Shared Kernel** (`shared/domain/model`) holds `Money`, `Address`, `GeoLocation` and the `LimaDistricts` catalog.
- Contexts never import other contexts' domain objects to change them. Collaboration happens in the application layer: `useMatchmakingStore.confirmMatch` calls `useExecutionStore.openShipment` with a snapshot of the match, `assertCanPublish` asks `useBillingStore.canPublish`, and `useReputationStore.submitRating` reads the shipment status.
- Execution stores snapshots (carrier name, vehicle label, rate) instead of references to IAM or Matchmaking aggregates.

### Consequences
- **Positive:**
  - Aggregates stay consistent inside their own context.
  - Integration points are explicit and easy to replace with events or backend calls.
- **Negative:**
  - Snapshots may become outdated if profiles change after the match.

---

## ADR-011: Route Matching as a Domain Service with District-Based Distance Estimation

### Status
Accepted

### Context
The core capability of Trazza is suggesting loads that fit a return route. The rule involves two aggregates (`ReturnRoute` and `FreightRequest`), so it does not belong to either of them. A maps provider is not integrated yet.

### Decision
Implement `RouteMatchingService` in `matchmaking/domain/services`. It estimates road distances from district centroids (haversine distance × 1.3 road factor, 30 km/h average speed), calculates the detour (origin → pickup → delivery → destination minus origin → destination) and evaluates compatibility: same date, overlapping time windows, accepted cargo type, enough free capacity and detour within the route limit. Failed rules are returned as i18n keys.

### Consequences
- **Positive:**
  - The matching policy is explicit, testable and reused by load suggestions, carrier search and proposal creation.
  - A maps provider can replace the estimation without touching the aggregates.
- **Negative:**
  - District-level estimates are approximate.

---

## ADR-012: External Services Behind Infrastructure Adapters and a Mock API

### Status
Accepted

### Context
The real platform depends on a REST backend, a payment gateway and GPS telemetry from the carrier's phone. None of them is available in the academic environment, but the use cases must be demonstrable end to end.

### Decision
- Use `json-server` (`server/db.json`) as the REST backend with the `/api/v1` prefix.
- Hide the payment gateway behind the `PaymentGateway` adapter in billing infrastructure (it approves valid cards and declines the `0002` test card).
- Model location updates as a use case (`useExecutionStore.shareLocation`) that accepts a real `GeoLocation` and falls back to a simulated one.

### Consequences
- **Positive:**
  - Every flow (match, payment, tracking, deviation alert) can be demonstrated locally.
  - Swapping the mock for real services only affects the infrastructure layer.
- **Negative:**
  - The mock API validates credentials by query and returns passwords; it must never be used in production.
