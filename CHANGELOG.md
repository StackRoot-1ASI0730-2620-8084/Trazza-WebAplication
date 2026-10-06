# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-05

### Added
- **Domain-Driven Design (DDD) Architecture:**
  - One top-level folder per bounded context, each one split into `domain`, `application`, `infrastructure` and `presentation` layers.
  - Immutable value objects (`Object.freeze`) with constructor validation and entities with `_`-prefixed private state compatible with Vue 3 reactive proxies.
- **Shared Kernel:**
  - Value objects: `Money`, `Address`, `GeoLocation` and the `LimaDistricts` catalog.
  - Reusable HTTP client `BaseApi` (with IAM interceptor) and CRUD abstraction `BaseEndpoint`.
  - `useNotificationStore` for in-app alerts.
  - Layout with side menu by role, top bar with alerts, language switcher and user summary; `Dashboard` and `PageNotFound` views; `AddressField` component; formatters and `useErrorHandler` composable.
- **IAM & Profiles Bounded Context:**
  - Domain layer: `User`, `CarrierProfile`, `Vehicle`, `MerchantProfile`; value objects `Email`, `Phone`, `Dni`, `Ruc`, `LicensePlate`, `LoadCapacity`, `UserRole`; commands `SignInCommand`, `SignUpCommand`.
  - Application layer: `useIamStore` (sign-in, sign-up, sign-out, session restore) and `useProfileStore` (profiles and fleet management).
  - Infrastructure layer: `IamApi`, `ProfileApi`, `UserAssembler`, `CarrierProfileAssembler`, `VehicleAssembler`, `MerchantProfileAssembler`, `iamInterceptor`, `authenticationGuard` with role checks.
  - Presentation layer: `SignIn`, `SignUp`, `Profile`, `VehicleList`, `VehicleForm` views and `VehicleCard` component.
- **Matchmaking & Routing Bounded Context (Core Domain):**
  - Domain layer: `ReturnRoute`, `FreightRequest`, `MatchProposal`; value objects `TimeWindow`, `Cargo`, `CargoType`, `Detour`, `RouteStatus`, `RequestStatus`, `ProposalStatus`; domain service `RouteMatchingService`.
  - Application layer: `useMatchmakingStore` (publication, load suggestions, carrier search, negotiation and match confirmation).
  - Infrastructure layer: `MatchmakingApi`, `ReturnRouteAssembler`, `FreightRequestAssembler`, `MatchProposalAssembler`.
  - Presentation layer: `ReturnRouteList`, `ReturnRouteForm`, `LoadSuggestions`, `LoadDetail`, `FreightRequestList`, `FreightRequestForm`, `FindCarriers`, `OfferList`, `OfferDetail` views and `LoadSuggestionCard`, `CarrierCard`, `CounterOfferPanel` components.
- **Service Execution & Monitoring Bounded Context:**
  - Domain layer: `Shipment` aggregate with `Incident` child entity; value objects `ShipmentStatus`, `IncidentType`.
  - Application layer: `useExecutionStore` (open shipment, pickup, location sharing with deviation alerts, delivery, reception, incidents).
  - Infrastructure layer: `ExecutionApi`, `ShipmentAssembler`, `IncidentAssembler`.
  - Presentation layer: `ActiveTrip`, `TripHistory`, `ShipmentTracking`, `ShipmentHistory` views and `ShipmentTimeline`, `TrackingMap`, `IncidentDialog` components.
- **Payment & Billing Bounded Context:**
  - Domain layer: `PaymentTransaction`, `Receipt`; value objects `SubscriptionPlan`, `PaymentMethod`, `PaymentStatus`, `ReceiptType`.
  - Application layer: `useBillingStore` (current plan, publication limits, Pro upgrade and receipt issuing).
  - Infrastructure layer: `BillingApi`, `PaymentGateway` adapter, `PaymentTransactionAssembler`, `ReceiptAssembler`.
  - Presentation layer: `PlanBilling` view and `ReceiptDialog` component.
- **Loyalty & Reputation Bounded Context:**
  - Domain layer: `Rating`; value objects `Score`, `RatingTarget`.
  - Application layer: `useReputationStore` (ratings, reputation summaries and rating submission).
  - Infrastructure layer: `ReputationApi`, `RatingAssembler`.
  - Presentation layer: `RatingList` view and `RatingDialog` component.
- **Internationalization (i18n):**
  - English (`en`) and Spanish (`es`) catalogs, including translated domain validation messages.
- **UI Framework & Styling:**
  - PrimeVue with an Aura preset customized with the Trazza Figma palette (primary #0037b0), PrimeFlex and PrimeIcons.
  - Toast and confirmation dialog services; responsive layout with a drawer menu on mobile.
- **Mock Server & Infrastructure:**
  - `json-server` mock backend with demo data aligned with the Trazza mock-ups (`server/db.json`) and route rewrite rules (`server/routes.json`).
  - Environment configuration for development and production and Vite environment type definitions (`vite-env.d.ts`).
  - Firebase hosting deployment configuration (`firebase.json`, `.firebaserc`).
- **Documentation & Licensing:**
  - `README.md` with architecture overview, bounded contexts, demo accounts and running instructions.
  - `docs/user-stories.md` with the Requirement Traceability Matrix and user stories `US-001` to `US-035`.
  - `docs/adrs.md` with architectural decisions ADR-001 to ADR-012.
  - `docs/class-diagram.puml` modeling every bounded context.
  - `LICENSE.md` (MIT License).
