<!--
Sync Impact Report
===================
Version change: [TEMPLATE] → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles (5 principles)
  - Technology Stack & Constraints
  - Development Workflow
  - Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ compatible (Constitution Check
    section is dynamic; no updates needed)
  - .specify/templates/spec-template.md — ✅ compatible (no constitution-
    specific mandatory sections required)
  - .specify/templates/tasks-template.md — ✅ compatible (task categorization
    aligns with principles)
  - .specify/templates/commands/*.md — no command files found; N/A
Follow-up TODOs: None
-->

# Bucket Constitution

## Core Principles

### I. TypeScript First

All new code MUST be written in TypeScript with strict type checking
enabled. This ensures type safety, improved developer experience, and
early detection of errors across the Expo/React Native codebase.

- All source files MUST use `.ts` or `.tsx` extensions.
- The TypeScript compiler MUST run in strict mode.
- Use of `any` MUST be justified with an inline comment explaining
  why a precise type is infeasible.
- Type definitions MUST accompany all public function signatures and
  component props.

**Rationale**: TypeScript catches entire categories of runtime errors
at compile time, which is critical for mobile apps where crashes
directly impact user experience and app store ratings.

### II. Mobile-First Design

All features MUST prioritize mobile-first patterns, performance, and
cross-platform compatibility on iOS and Android via Expo/React Native.

- UI components MUST be designed for touch interaction and small
  screens first; larger layouts are secondary.
- Performance budgets MUST target 60 fps for animations and
  transitions using `react-native-reanimated` for native-thread
  execution.
- Platform-specific code MUST be isolated behind platform abstractions
  and clearly marked.
- All features MUST be tested on both iOS and Android before merging.

**Rationale**: Bucket is a mobile-first product. Decisions that
compromise mobile UX or performance undermine the core value
proposition.

### III. Documentation-Driven Development

Developers MUST consult official Expo documentation before implementing
features or adopting new libraries.

- The primary references are `docs.expo.dev/llms-full.txt` (Expo),
  `docs.expo.dev/llms-eas.txt` (EAS), and `docs.expo.dev/llms-sdk.txt`
  (SDK).
- New library adoption MUST be checked against Expo compatibility
  using `npx expo install --check`.
- Features using Expo Router MUST follow documented navigation
  patterns from the official Expo Router documentation.

**Rationale**: Expo's managed workflow imposes constraints that
differ from bare React Native. Using undocumented or incompatible
patterns leads to build failures and runtime crashes that are
difficult to diagnose.

### IV. Follow Existing Patterns

New code MUST follow patterns already established in the codebase.
Consistency reduces cognitive load and onboarding friction.

- New screens MUST follow the file-based routing conventions in
  `app/` using Expo Router.
- New components MUST follow the organizational structure in
  `components/` (UI primitives in `components/ui/`, feature
  components at top level).
- Theming MUST use the existing color scheme hooks and constants
  in `constants/` and `hooks/`.
- Deviations from existing patterns MUST be documented with rationale
  in the PR description.

**Rationale**: A consistent codebase is easier to navigate, review,
and maintain. Pattern divergence creates hidden complexity.

### V. Simplicity & Self-Documenting Code

Code MUST be clear, readable, and self-explanatory. Complexity MUST
be justified. Follow YAGNI (You Aren't Gonna Need It) principles.

- Comments MUST only be added for complex business logic or
  non-obvious design decisions; do not narrate obvious code.
- Functions and components MUST use meaningful, descriptive names.
- Over-engineering MUST be avoided: do not add features, abstractions,
  or configurability beyond what is directly required.
- Error handling MUST be proportional to risk: validate at system
  boundaries (user input, external APIs), trust internal code.

**Rationale**: Simple code is easier to understand, test, and
modify. Premature abstraction creates maintenance burden without
delivering value.

## Technology Stack & Constraints

- **Framework**: Expo (managed workflow) with React Native.
- **Language**: TypeScript (strict mode).
- **Navigation**: Expo Router (file-based routing).
- **Images**: `expo-image` for optimized image handling and caching.
- **Animations**: `react-native-reanimated` for native-thread
  animations.
- **Gestures**: `react-native-gesture-handler` for native gesture
  recognition.
- **Storage**: `expo-sqlite` for persistent storage;
  `expo-sqlite/kv-store` for simple key-value storage.
- **Build/Deploy**: EAS Build, EAS Submit, EAS Workflows for CI/CD.
- **Linting**: ESLint via `npx expo lint`.
- **React Version**: React 19 patterns (function components, hooks,
  React Compiler enabled).

Package installation MUST use `npx expo install <package>` to ensure
version compatibility with the current Expo SDK.

## Development Workflow

- **Dev Server**: `npx expo start` (use `--clear` to reset cache).
- **Health Check**: `npx expo doctor` to verify project health and
  dependency compatibility.
- **Linting**: `npx expo lint` MUST pass before merging.
- **Development Builds**: When Expo Go encounters errors or after
  installing packages with native modules, create a development build
  via `eas build:dev`.
- **CI/CD**: EAS Workflows defined in `.eas/workflows/` handle build,
  preview, and production deployment automation.
- **Build Profiles**: `development`, `development-simulator`,
  `preview`, and `production` profiles are defined in `eas.json`.
- **Testing**: Use `testID` props on components for automation.
  Visual and interaction testing via Expo MCP tools when available.

All PRs MUST verify compliance with Core Principles before approval.

## Governance

This constitution is the authoritative source of project standards
for the Bucket app. In case of conflict between this document and
other project documentation, this constitution takes precedence.

- **Amendment Process**: Any change to this constitution MUST be
  documented with a version bump, rationale, and sync impact report.
  Amendments MUST be reviewed and approved before merging.
- **Versioning Policy**: This constitution follows semantic versioning:
  - MAJOR: Backward-incompatible principle removals or redefinitions.
  - MINOR: New principle or section added, or materially expanded
    guidance.
  - PATCH: Clarifications, wording, typo fixes, non-semantic
    refinements.
- **Compliance Review**: All pull requests and code reviews MUST
  verify adherence to the Core Principles. Violations MUST be
  flagged and resolved before merge.
- **Runtime Guidance**: For day-to-day development guidance, refer
  to `AGENTS.md` at the repository root. That file provides
  operational details consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-01-30 | **Last Amended**: 2026-01-30
