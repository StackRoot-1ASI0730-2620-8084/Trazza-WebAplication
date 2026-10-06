# Trazza Web Application (`trazza-web`)

## Overview
Trazza is a logistics web platform that connects **carriers** who drive back empty after a delivery with **merchants** (small businesses and entrepreneurs) who need to ship goods inside Metropolitan Lima. Carriers publish their *return routes* with the free capacity they have left; merchants publish *freight requests*; Trazza suggests compatible loads, lets both parties negotiate the rate, tracks the shipment until delivery and builds the reputation of both sides.

The front-end is a Vue 3 + Vite application organized with Domain-Driven Design (DDD). Every bounded context of the Trazza domain model is a top-level folder, and every bounded context is split into the `domain`, `application`, `infrastructure` and `presentation` layers.

## Goals
- Implement the Trazza bounded contexts defined in the project report with an explicit DDD layered architecture.
- Keep business rules inside aggregates, entities, value objects and domain services, never inside views.
- Keep domain objects pure: immutable value objects that validate themselves, entities with private state (`_` prefix) and intention-revealing methods.
- Map every API payload into domain objects through assemblers (Data Mapper pattern).
- Provide a fully navigable product (Carrier and Merchant accounts) in English and Spanish, backed by a local mock API.

## Tech Stack
- Vue 3 (Composition API, `<script setup>`)
- Vite
- Vue native reactivity (`reactive`, `computed`) for application stores
- Vue Router
- Vue I18n
- PrimeVue + PrimeFlex + PrimeIcons
- Axios
- `json-server` for the local mock API

## Bounded Contexts

| Bounded Context | Folder | Type | Aggregates / Entities |
|:--|:--|:--|:--|
| IAM & Profiles (Identity & Profile Management) | `src/iam` | Generic | `User` (AR), `CarrierProfile` (AR) → `Vehicle`, `MerchantProfile` (AR) |
| Matchmaking & Routing | `src/matchmaking` | **Core** | `ReturnRoute` (AR), `FreightRequest` (AR), `MatchProposal` (AR) |
| Service Execution & Monitoring (IoT & Transit) | `src/execution` | Supporting | `Shipment` (AR, *ViajeLogistico*) → `Incident` |
| Payment & Billing | `src/billing` | Generic | `PaymentTransaction` (AR), `Receipt` (AR, *Comprobante*) |
| Loyalty & Reputation | `src/reputation` | Supporting | `Rating` (AR, *Calificacion*) |
| Shared Kernel | `src/shared` | Shared | `Money`, `Address`, `GeoLocation`, Lima districts catalog |

### IAM & Profiles Context
- Registers carriers (DNI) and merchants (RUC), signs users in and out and keeps the session.
- `CarrierProfile` owns the fleet: plates are unique inside the aggregate (`addVehicle`, `updateVehicle`, `removeVehicle`).
- Value objects: `Email`, `Phone`, `Dni`, `Ruc`, `LicensePlate`, `LoadCapacity`, `UserRole`.
- Commands: `SignInCommand`, `SignUpCommand`.
- Infrastructure: `IamApi`, `ProfileApi`, assemblers, `iamInterceptor`, `authenticationGuard` (authentication + role check).

### Matchmaking & Routing Context (Core Domain)
- `ReturnRoute`: free capacity on the way back, time window, accepted cargo types and maximum detour. Its factory validates the date and that the capacity does not exceed the selected vehicle.
- `FreightRequest`: goods to ship with pickup window and optional offered rate (`draft → open → matched | cancelled`).
- `MatchProposal`: rate negotiation (`pending → counteroffer → accepted → matched`, or `rejected` / `closed`). Parties take turns; only the merchant confirms a match.
- `RouteMatchingService` (domain service): estimates road distances, calculates the detour of a load for a route and evaluates compatibility (date, time window, cargo type, capacity and detour).
- Value objects: `TimeWindow`, `Cargo`, `CargoType`, `Detour`, `RouteStatus`, `RequestStatus`, `ProposalStatus`.

### Service Execution & Monitoring Context
- `Shipment` controls the trip after a confirmed match: pickup, live location, deviation alerts (more than 2 km away from the planned route), delivery (requires acknowledgment when the vehicle is more than 1 km away from the delivery point), reception by the merchant and incidents.
- `Incident` (child entity) can be reported while the shipment is active or up to 48 hours after delivery.
- Value objects: `ShipmentStatus`, `IncidentType` (and `GeoLocation` from the Shared Kernel).

### Payment & Billing Context
- Trazza charges only its own subscription (Free: 5 publications per month, Pro: unlimited). Freight rates are agreed between the parties without commission.
- `PaymentTransaction` charges a plan through the `PaymentGateway` adapter and sets the paid period.
- `Receipt` issues a *boleta* (customer with DNI) or a *factura* (customer with RUC) and breaks down the 18% IGV.
- Value objects: `SubscriptionPlan`, `PaymentMethod` (Luhn validation, only brand and last four digits are kept), `PaymentStatus`, `ReceiptType`.

### Loyalty & Reputation Context
- `Rating` records the evaluation one party gives to the other after a delivered shipment (1 to 5 stars, highlight tags and comment). A user cannot rate itself or rate the same shipment twice.
- Value objects: `Score`, `RatingTarget`.

### Shared Kernel
- `Money`, `Address` and `GeoLocation` value objects, used by several contexts.
- `LimaDistricts` catalog with the coordinates of each district, used to validate addresses and estimate distances.
- `BaseApi` and `BaseEndpoint` HTTP infrastructure, the notification store and the application layout.

## Project Structure (DDD-Oriented)
```text
src/
  iam/                          # IAM & Profiles bounded context
    domain/model/               # User, CarrierProfile, Vehicle, MerchantProfile + value objects
    domain/commands/            # SignInCommand, SignUpCommand
    application/                # iam.store.js, profile.store.js (reactive stores)
    infrastructure/             # IamApi, ProfileApi, assemblers, interceptor, guard
    presentation/               # Views, components and iam-routes.js

  matchmaking/                  # Matchmaking & Routing bounded context (core)
    domain/model/               # ReturnRoute, FreightRequest, MatchProposal + value objects
    domain/services/            # RouteMatchingService
    application/                # matchmaking.store.js
    infrastructure/             # MatchmakingApi and assemblers
    presentation/               # Views, components and matchmaking-routes.js

  execution/                    # Service Execution & Monitoring bounded context
    domain/model/               # Shipment, Incident + value objects
    application/                # execution.store.js
    infrastructure/             # ExecutionApi and assemblers
    presentation/               # Views, components and execution-routes.js

  billing/                      # Payment & Billing bounded context
    domain/model/               # PaymentTransaction, Receipt + value objects
    application/                # billing.store.js
    infrastructure/             # BillingApi, PaymentGateway and assemblers
    presentation/               # Views, components and billing-routes.js

  reputation/                   # Loyalty & Reputation bounded context
    domain/model/               # Rating + value objects
    application/                # reputation.store.js
    infrastructure/             # ReputationApi and assembler
    presentation/               # Views, components and reputation-routes.js

  shared/                       # Shared kernel and cross-context concerns
    domain/model/               # Money, Address, GeoLocation, LimaDistricts
    application/                # notification.store.js
    infrastructure/             # BaseApi, BaseEndpoint
    presentation/               # Layout, side menu, top bar, dashboard, formatters, composables

  locales/                      # en.json, es.json
  router.js                     # Route composition and global guard
  i18n.js                       # Vue I18n configuration
  main.js                       # Application bootstrap and PrimeVue registration
```

## Layer Responsibilities

### Domain Layer
- Plain JavaScript classes, framework-agnostic (no Vue, no HTTP).
- Value objects are immutable (`Object.freeze(this)`) and validate every business rule in their constructors.
- Entities and aggregates keep their state in `_`-prefixed members exposed through getters, and change it only through methods that enforce the invariants. The native `#` private syntax is not used because it breaks Vue 3 reactive proxies.
- Domain errors are thrown as `Error` objects whose message is an i18n key (for example `validation.plate-already-registered`), so the presentation layer can translate them.

### Application Layer
- One store per bounded context built with Vue native reactivity (`reactive({})` for state and `computed` for derived data).
- Stores orchestrate use cases: they build domain objects, call infrastructure gateways, map responses through assemblers and keep the UI-facing state.
- Cross-context collaboration happens here (for example, confirming a match in Matchmaking opens a shipment in Execution and checks the plan limits in Billing).

### Infrastructure Layer
- API gateways extend `BaseApi` and use `BaseEndpoint` for REST operations.
- Assemblers convert resources into domain entities (`toEntityFromResource`, `toEntitiesFromResponse`) and back (`toResourceFromEntity`).
- Adapters for external services (`PaymentGateway`), the IAM interceptor and the authentication guard.

### Presentation Layer
- Views and components built with PrimeVue components (registered with the `pv-` prefix) and PrimeFlex utilities.
- Views call store actions and render store state; they never call HTTP clients directly.

## Running the Project

### Prerequisites
- Node.js + npm installed (use versions compatible with Vite 8).

### 1) Install dependencies
```bash
npm install
```

### 2) Start the mock API server (`json-server`)
From the project root:
```bash
cd server
sh start.sh
```
or simply:
```bash
npm run server
```

The server reads:
- `server/db.json`
- `server/routes.json` (maps `/api/v1/*` to root resources)

Default local API base used by the development environment:
- `http://localhost:3000/api/v1`

### 3) Start the Vue app
In a separate terminal, from the project root:
```bash
npm run dev
```

### 4) Build for production
```bash
npm run build
```

### 5) Preview the production build
```bash
npm run preview
```

## Demo Accounts
All demo accounts use the password `Trazza2026`.

| Role | Email | Notes |
|:--|:--|:--|
| Carrier | `juan.ramos@email.com` | Active return route Lurín → Los Olivos, a shipment in transit and an offer waiting for an answer |
| Merchant | `valeria.torres@email.com` | Textiles Andinos SAC, request FR-2210 with offers to review and a shipment in transit |
| Carrier | `carlos.mendoza@email.com`, `pedro.quispe@email.com` | Routes compatible with FR-2210 |
| Merchant | `camila.rojas@email.com`, `luis.ferrer@email.com` | Loads suggested to Juan |

Test cards for the Pro plan checkout: `4242 4242 4242 4242` is approved and `4000 0000 0000 0002` is declined (any future expiry date).

To restore the initial data, discard the changes of `server/db.json` (for example with `git checkout server/db.json`).

## Environment Variables
Environment files included:
- `.env.development`
- `.env.production`

Main variables:
- `VITE_TRAZZA_PLATFORM_API_URL`
- `VITE_USERS_ENDPOINT_PATH`
- `VITE_CARRIER_PROFILES_ENDPOINT_PATH`
- `VITE_MERCHANT_PROFILES_ENDPOINT_PATH`
- `VITE_RETURN_ROUTES_ENDPOINT_PATH`
- `VITE_FREIGHT_REQUESTS_ENDPOINT_PATH`
- `VITE_MATCH_PROPOSALS_ENDPOINT_PATH`
- `VITE_SHIPMENTS_ENDPOINT_PATH`
- `VITE_PAYMENT_TRANSACTIONS_ENDPOINT_PATH`
- `VITE_RECEIPTS_ENDPOINT_PATH`
- `VITE_RATINGS_ENDPOINT_PATH`
- `VITE_PRIME_UI_LICENSE_KEY`

Tip: if your API is running on a different port, update `VITE_TRAZZA_PLATFORM_API_URL` in `.env.development`.

## Routing Notes
- Public routes: `/iam/sign-in`, `/iam/sign-up`. Every other route requires a session.
- Route metadata declares the allowed roles (`meta.roles`); the `authenticationGuard` redirects users to the dashboard when their role is not allowed.
- Carrier routes: `/matchmaking/return-routes`, `/matchmaking/load-suggestions`, `/execution/active-trip`, `/execution/trip-history`, `/iam/vehicles`.
- Merchant routes: `/matchmaking/freight-requests`, `/matchmaking/find-carriers`, `/matchmaking/offers/:requestId`, `/execution/shipment-tracking`, `/execution/shipment-history`.
- Shared routes: `/dashboard`, `/matchmaking/offers`, `/reputation/ratings`, `/billing/plan`, `/iam/profile`.
- The global `beforeEach` sets the translated document title from route metadata.

## API and Data Notes
- Mock collections: `users`, `carrier-profiles`, `merchant-profiles`, `return-routes`, `freight-requests`, `match-proposals`, `shipments`, `payment-transactions`, `receipts`, `ratings`.
- `json-server` has no authentication endpoints, so sign-in validates the credentials by querying `users` and the client creates a session token. A production backend must expose real authentication endpoints and must never return passwords.
- Distances and detours are estimated from district centroids (straight-line distance × 1.3 road factor). They are approximations until a maps provider is integrated.
- Live location is simulated by the "Share location" action, which moves the vehicle towards the delivery point and occasionally away from the planned route to exercise the deviation alerts.

## Documentation
- Domain and architecture references:
  - `docs/class-diagram.puml`
  - `docs/user-stories.md`
  - `docs/adrs.md`
- Project history and release notes:
  - `CHANGELOG.md`

## Recommended Development Practices
- Keep each feature inside its bounded context first; move to `shared` only when it is truly cross-context.
- Preserve layer boundaries (presentation does not call raw HTTP clients; domain does not import Vue).
- Validate business rules in value object constructors and aggregate methods, not in views.
- Use explicit domain language in naming and documentation.
- Add or update docs when introducing new aggregates, value objects, commands or use cases.

## License
See `LICENSE.md`.
