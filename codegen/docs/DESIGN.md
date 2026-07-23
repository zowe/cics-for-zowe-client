# CICS Code Generation System — Design Document

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Design](#component-design)
4. [Data Flow](#data-flow)
5. [Diagrams](#diagrams)
6. [Extension Points](#extension-points)
7. [Known Design Gaps](#known-design-gaps)

---

## Overview

The CICS Code Generation System is a template-based code generator that produces SDK and CLI code for CICS resources from a single JSON specification. Resources are the primary organising unit: each resource declares the actions it supports, and the generator derives all naming, constants, and file structure from that declaration.

### Key Features
- **Single Source of Truth**: All resource definitions in `resourceSpecification.json`
- **Template-Based Generation**: Handlebars templates for consistent code structure
- **Multi-Package Support**: Generates code for the SDK and CLI packages
- **Automated Testing**: Generates unit tests alongside implementation code
- **CI Integration**: Automated validation that generated files match the specification

### Supported Packages

| Package | Status |
|---|---|
| `packages/sdk` | Fully generated |
| `packages/cli` | Partially generated — see [Known Design Gaps](#known-design-gaps) |
| `packages/vsce` | Not yet in scope |

---

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Code Generation System                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐          ┌──────────────────┐              │
│  │  Specification   │─────────▶│  JSON Schema     │              │
│  │  (JSON)          │          │  Validator       │              │
│  └──────────────────┘          └──────────────────┘              │
│           │                              │                         │
│           │                              ▼                         │
│           │                     ┌────────────────┐                │
│           └────────────────────▶│   Generator    │                │
│                                 │  (TypeScript)  │                │
│                                 └────────────────┘                │
│                                          │                         │
│                    ┌─────────────────────┼────────────────────┐   │
│                    ▼                     ▼                     ▼   │
│          ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│          │  SDK Templates  │  │  CLI Templates   │  │ Test Templates   │
│          │  (Handlebars)   │  │  (Handlebars)    │  │ (Handlebars)     │
│          └─────────────────┘  └──────────────────┘  └──────────────────┘
│                    │                     │                     │    │
│                    └─────────────────────┼─────────────────────┘    │
│                                          ▼                           │
│                               ┌─────────────────────┐               │
│                               │   Generated Code    │               │
│                               │   - SDK resources   │               │
│                               │   - CLI handlers    │               │
│                               │   - Unit tests      │               │
│                               └─────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

### Repository Structure

```
cics-for-zowe-client/
├── codegen/
│   ├── resourceSpecification.json        # Single source of truth
│   ├── resourceSpecification.schema.json # Validates the spec
│   ├── generate.ts                        # Main generator
│   ├── check-generated.ts                 # CI validation script
│   ├── templates/
│   │   ├── sdk/
│   │   │   ├── resource.file.hbs          # One file per resource
│   │   │   ├── resource.index.hbs
│   │   │   ├── parms.interface.hbs        # One interface per resource
│   │   │   ├── doc.index.hbs
│   │   │   ├── utils.resourceactions.hbs
│   │   │   ├── utils.index.hbs
│   │   │   └── constants.hbs
│   │   ├── cli/
│   │   │   ├── localfile.definition.hbs   # ⚠ Resource-specific (see Design Gaps)
│   │   │   ├── localfile.handler.hbs      # ⚠ Resource-specific (see Design Gaps)
│   │   │   ├── group.definition.hbs       # ⚠ Hardcoded children (see Design Gaps)
│   │   │   ├── strings.en.snippet.hbs
│   │   │   └── en.ts.hbs
│   │   └── tests/
│   │       ├── sdk.resource.unit.test.hbs
│   │       ├── cli.localfile.handler.unit.test.hbs
│   │       └── cli.group.definition.unit.test.hbs
│   └── docs/
│       ├── codegen.md   # User guide
│       └── DESIGN.md    # This document
│
└── packages/
    ├── sdk/
    │   ├── src/
    │   │   ├── resources/              # ✅ Fully generated
    │   │   │   ├── LocalFile.ts
    │   │   │   ├── Program.ts
    │   │   │   ├── URIMap.ts
    │   │   │   ├── Library.ts
    │   │   │   └── index.ts
    │   │   ├── doc/                    # ✅ Fully generated
    │   │   │   ├── ILocalFileParms.ts
    │   │   │   └── ...
    │   │   ├── utils/                  # ✅ Fully generated
    │   │   │   ├── ResourceActions.ts
    │   │   │   └── index.ts
    │   │   └── constants.ts            # ✅ Fully generated
    │   └── __tests__/__unit__/         # ✅ Fully generated
    │
    └── cli/
        ├── src/
        │   ├── common/
        │   │   └── LocalFileHandler.ts      # ✅ Generated
        │   ├── enable/
        │   │   ├── Enable.definition.ts     # ✅ Generated
        │   │   ├── localFile/
        │   │   │   └── LocalFile.definition.ts  # ✅ Generated
        │   │   └── urimap/                  # ✗ Not generated
        │   ├── disable/
        │   │   ├── Disable.definition.ts    # ✅ Generated
        │   │   ├── localFile/
        │   │   │   └── LocalFile.definition.ts  # ✅ Generated
        │   │   └── urimap/                  # ✗ Not generated
        │   ├── open/                        # ✗ Not generated (manually maintained)
        │   └── close/                       # ✗ Not generated (manually maintained)
        └── __tests__/__unit__/
            ├── enable/                      # ✅ Generated
            └── disable/                     # ✅ Generated
```

---

## Component Design

### 1. Resource Specification (`resourceSpecification.json`)

The specification is organised hierarchically:

```json
{
  "resources": {
    "ResourceName": {
      "identifier": { /* metadata */ },
      "actions": [ /* action references or inline definitions */ ],
      "additionalOptions": [ /* optional: extra fields in Parms interface */ ]
    }
  },
  "actions": {
    "ActionName": {
      "identifier": { /* metadata */ },
      "options": [ /* option references or inline definitions */ ]
    }
  },
  "options": {
    "OptionName": { /* option definition */ }
  }
}
```

**Design Principles:**
- Resources are the primary organising unit
- Actions and options can be shared across resources
- Inline definitions allow resource-specific customisation
- `additionalOptions` adds fields to the Parms interface that aren't tied to a specific action (e.g. backward-compat fields for Define operations)
- All naming, constants, and file paths are derived — nothing is manually specified

**Special identifier fields:**

| Field | Purpose | Example |
|---|---|---|
| `snakeKey` | Overrides the `SCREAMING_SNAKE` suffix used for constants. Needed when the naive capitalisation split would be wrong. | `CICSURIMap` → `URI_MAP` (without: `U_R_I_M_A_P`) |
| `constantName` | Overrides the full resource-type constant name. For legacy resources that predate the `CICS_CMCI_` prefix convention. | `CICS_URIMAP` instead of `CICS_CMCI_URI_MAP` |

### 2. JSON Schema Validator (`resourceSpecification.schema.json`)

Validates the specification on every generator run:
- Required fields are present
- Data types are correct
- Referenced shared actions and options exist
- Naming conventions are followed

### 3. Generator (`generate.ts`)

**Class: `ResourceGenerator`**

```
┌──────────────────────────────────────────────────────────────────┐
│                       ResourceGenerator                           │
├──────────────────────────────────────────────────────────────────┤
│ - spec: ResourceSpecification                                     │
│ - templateDir: string                                             │
│ - outputDir: string                                               │
│ - generatedTestFiles: string[]                                    │
├──────────────────────────────────────────────────────────────────┤
│ + generateAll(): void                                             │
│ - generateSDK(resources): void                                    │
│ - generateCLI(resources): void                                    │
│ - generateTests(resources): void                                  │
│ - deriveResources(): DerivedResource[]                            │
│ - deriveResource(name, resource): DerivedResource                 │
│ - deriveAction(action, resourceName): DerivedAction               │
│ - deriveOptions(options): DerivedOption[]                         │
│ - deriveParameters(options): DerivedParameter[]                   │
│ - generateFromTemplate(template, output, context): void           │
│ - renderTemplate(template, context): string                       │
│ - ensureDir(path): void                                           │
│ + runTests(): void                                                │
└──────────────────────────────────────────────────────────────────┘
```

`generateAll()` calls three sub-generators in sequence:
1. `generateSDK()` — runs over all resources in the spec
2. `generateCLI()` — currently only runs for `CICSLocalFile` and only for `enable`/`disable` action groups (see [Known Design Gaps](#known-design-gaps))
3. `generateTests()` — generates SDK unit tests for all resources

### 4. Templates (`templates/`)

Each template is Handlebars (`.hbs`). The generator compiles a template once and renders it with a `DerivedResource` or `DerivedAction` context object.

**SDK templates** — generic; rendered once per resource:

| Template | Output per resource |
|---|---|
| `sdk/resource.file.hbs` | `packages/sdk/src/resources/<Resource>.ts` |
| `sdk/resource.index.hbs` | `packages/sdk/src/resources/index.ts` |
| `sdk/parms.interface.hbs` | `packages/sdk/src/doc/I<Resource>Parms.ts` |
| `sdk/doc.index.hbs` | `packages/sdk/src/doc/index.ts` |
| `sdk/utils.resourceactions.hbs` | `packages/sdk/src/utils/ResourceActions.ts` |
| `sdk/utils.index.hbs` | `packages/sdk/src/utils/index.ts` |
| `sdk/constants.hbs` | `packages/sdk/src/constants.ts` |

**CLI templates** — currently resource-specific (see [Known Design Gaps](#known-design-gaps)):

| Template | Output |
|---|---|
| `cli/localfile.handler.hbs` | `packages/cli/src/common/LocalFileHandler.ts` |
| `cli/localfile.definition.hbs` | `packages/cli/src/<group>/localFile/LocalFile.definition.ts` |
| `cli/group.definition.hbs` | `packages/cli/src/<group>/<Group>.definition.ts` |
| `cli/en.ts.hbs` | `packages/cli/src/-strings-/en.ts` |

**Test templates** — rendered once per resource×action combination:

| Template | Output |
|---|---|
| `tests/sdk.resource.unit.test.hbs` | `packages/sdk/__tests__/__unit__/<action>/<Action>.<resource>.unit.test.ts` |
| `tests/cli.localfile.handler.unit.test.hbs` | `packages/cli/__tests__/__unit__/<group>/localFile/LocalFile.handler.unit.test.ts` |
| `tests/cli.group.definition.unit.test.hbs` | `packages/cli/__tests__/__unit__/<group>/<Group>.definition.unit.test.ts` |

---

## Data Flow

### Generation Process

```
resourceSpecification.json
          │
          ▼
  Parse & validate against schema
          │
          ▼
  deriveResources()
  ┌────────────────────────────────────────────────────────────┐
  │ For each resource:                                          │
  │   • Remove "CICS" prefix → SDK file name                   │
  │   • Split on capitals → SCREAMING_SNAKE_CASE constant      │
  │   • Build interface name (IPascalCaseParms)                 │
  │   • For each action:                                        │
  │       – Resolve shared or inline action definition          │
  │       – Derive function name (camelCase: group+ResourceName)│
  │       – Resolve shared or inline options                    │
  │       – Derive SDK parameters from options                  │
  └────────────────────────────────────────────────────────────┘
          │
          ├──▶ generateSDK()   — renders one file per resource
          │
          ├──▶ generateCLI()   — renders LocalFile handler + enable/disable
          │                       group and definition files only
          │
          └──▶ generateTests() — renders one test file per resource×action
```

### Property Derivation Example

```
Input: "CICSLocalFile"
  │
  ├─▶ Strip "CICS" prefix ──▶ "LocalFile"
  │       │
  │       ├─▶ SDK file name:     LocalFile.ts
  │       └─▶ Parms interface:   ILocalFileParms
  │
  └─▶ Split on capitals, join with "_", uppercase
          │
          └─▶ "LOCAL_FILE"
                  │
                  ├─▶ Resource type constant:  CICS_CMCI_LOCAL_FILE
                  ├─▶ Criteria field constant: CICS_CMCI_LOCAL_FILE_CRITERIA_FIELD
                  ├─▶ Max length constant:     CICS_CMCI_LOCAL_FILE_MAX_LENGTH
                  └─▶ Busy values constant:    CICS_CMCI_LOCAL_FILE_BUSY_VALUES

  snakeKey / constantName override fields skip the derivation above
  when the naive algorithm would produce an incorrect result.
```

### Action Resolution

```
Action entry in spec
        │
        ▼
  Is it a string?
  ├── Yes ──▶ Look up in spec["actions"] ──▶ Not found? → throw error
  └── No  ──▶ Use the inline object directly
        │
        ▼
  Extract identifier (name, group, aliases, description, verbs)
        │
        ▼
  Derive function name = camelCase(group) + PascalCase(resourceName)
  e.g. group="enable", resource="LocalFile" → "enableLocalFile"
        │
        ▼
  Resolve options (shared lookup or inline)
        │
        ▼
  Derive SDK parameters from resolved options
        │
        ▼
  Return DerivedAction
```

---

## Diagrams

### Class Diagram

```
┌──────────────────────────────────────────────┐
│              ResourceSpecification            │
├──────────────────────────────────────────────┤
│ + resources: Record<string, Resource>         │
│ + actions?:  Record<string, ActionDefinition> │
│ + options?:  Record<string, OptionDefinition> │
└──────────────────────────────────────────────┘
                      │ contains
                      ▼
┌──────────────────────────────────────────────┐
│                   Resource                    │
├──────────────────────────────────────────────┤
│ + identifier:       ResourceIdentifier        │
│ + actions:          (string|ActionReference)[]│
│ + additionalOptions?: string[]                │
└──────────────────────────────────────────────┘
          │ has                    │ references
          ▼                        ▼
┌────────────────────┐   ┌────────────────────────┐
│ ResourceIdentifier │   │    ActionDefinition     │
├────────────────────┤   ├────────────────────────┤
│ aliases?: string[] │   │ identifier: ActionIdent │
│ humanNameSingular  │   │ options?: (string|Opt)[]│
│ humanNamePlural?   │   │ updateAttribute?        │
│ primaryKey         │   └────────────────────────┘
│ maxPrimaryKeyLength│             │ has
│ snakeKey?          │             ▼
│ constantName?      │   ┌────────────────────────┐
└────────────────────┘   │   ActionIdentifier      │
                         ├────────────────────────┤
                         │ name: string            │
                         │ aliases?: string[]      │
                         │ group: string           │
                         │ description: string     │
                         │ verb: string            │
                         │ verbPastTense: string   │
                         └────────────────────────┘
```

### Sequence Diagram — Code Generation

```
User         Generator      Specification    Templates     FileSystem
 │               │                │              │              │
 │ npm run       │                │              │              │
 │ generate      │                │              │              │
 ├──────────────▶│                │              │              │
 │               │ Load & Parse   │              │              │
 │               ├───────────────▶│              │              │
 │               │ Validate schema│              │              │
 │               ├───────────────▶│              │              │
 │               │◀───────────────┤              │              │
 │               │                │              │              │
 │               │  deriveResources() ───────────┤              │
 │               │  ┌─────────────────────────┐  │              │
 │               │  │ For each resource        │  │              │
 │               │  │   derive properties      │  │              │
 │               │  │   derive actions/options │  │              │
 │               │  └─────────────────────────┘  │              │
 │               │                │              │              │
 │               │  generateSDK() / generateCLI()│              │
 │               │  ┌─────────────────────────┐  │              │
 │               │  │ For each output file     │  │              │
 │               │  │   Load template          ├─▶│              │
 │               │  │   Render with context    │◀─┤              │
 │               │  │   Write output           ├──┼─────────────▶│
 │               │  └─────────────────────────┘  │              │
 │               │                │              │              │
 │               │  generateTests()              │              │
 │               │  ┌─────────────────────────┐  │              │
 │               │  │ For each resource×action │  │              │
 │               │  │   Render test template   ├─▶│              │
 │               │  │   Write test file        ├──┼─────────────▶│
 │               │  └─────────────────────────┘  │              │
 │◀──────────────┤                │              │              │
 │ Complete      │                │              │              │
```

---

## Extension Points

### Adding a New Resource

1. Add an entry to `resources` in `resourceSpecification.json`:

```json
{
  "resources": {
    "CICSNewResource": {
      "identifier": {
        "humanNameSingular": "New Resource",
        "humanNamePlural": "New Resources",
        "primaryKey": "name",
        "maxPrimaryKeyLength": 8
      },
      "actions": ["ENABLE", "DISABLE"]
    }
  }
}
```

2. Run `npm run generate`.

Generated SDK files:
- `packages/sdk/src/resources/NewResource.ts`
- `packages/sdk/src/doc/INewResourceParms.ts`
- `packages/sdk/__tests__/__unit__/enable/Enable.newResource.unit.test.ts`
- `packages/sdk/__tests__/__unit__/disable/Disable.newResource.unit.test.ts`

> CLI files are **not** automatically generated for new resources until the CLI template gaps described below are resolved.

### Adding a New Shared Action

1. Define it in the `actions` section:

```json
{
  "actions": {
    "REFRESH": {
      "identifier": {
        "name": "REFRESH",
        "group": "refresh",
        "description": "Refresh a resource in CICS",
        "verb": "refreshing",
        "verbPastTense": "refreshed"
      },
      "options": []
    }
  }
}
```

2. Reference it by name in any resource's `actions` array:

```json
"actions": ["ENABLE", "DISABLE", "REFRESH"]
```

3. Run `npm run generate`.

### Adding a New Shared Option

1. Define it in the `options` section:

```json
{
  "options": {
    "TIMEOUT": {
      "name": "timeout",
      "type": "number",
      "defaultValue": 30,
      "description": "Timeout in seconds."
    }
  }
}
```

2. Reference it by name in an action's `options` array.

3. Run `npm run generate`.

### Adding a New Template

1. Create a `.hbs` file in the appropriate `templates/` subdirectory.
2. Add a `generateFromTemplate()` call in the relevant generator method (`generateSDK`, `generateCLI`, `generateTests`).
3. The context passed to the template is a `DerivedResource` or a subset of it — refer to the `DerivedResource` / `DerivedAction` interfaces in `generate.ts` for available fields.

---

## Known Design Gaps

> These are current limitations of the CLI generation layer. They are documented here as the authoritative record of what needs to change.

### 1. CLI templates are resource-specific, not generic

`cli/localfile.definition.hbs` and `cli/localfile.handler.hbs` have `LocalFile` hardcoded throughout — the export name, handler path, strings key path, positional argument name, and example options. They cannot be reused to generate CLI files for `CICSProgram`, `CICSURIMap`, or any other resource.

**Target design**: rename to `cli/resource.definition.hbs` and `cli/resource.handler.hbs`. Replace all hardcoded `LocalFile`/`localFile`/`LOCALFILE` references with template variables sourced from `DerivedResource` (e.g. `{{sdkFileName}}`, `{{parmsInterface}}`, `{{identifier.primaryKey}}`). This mirrors how `sdk/resource.file.hbs` already works.

### 2. Only `enable` and `disable` action groups are owned by codegen

`open` and `close` are manually maintained in `packages/cli/src/open/` and `packages/cli/src/close/` and are excluded from the generator via a hardcoded allowlist in `generateCLI()`:

```ts
const GROUPS_OWNED_BY_CODEGEN = new Set(["enable", "disable"]);
```

Additionally, `generateCLI()` opens with:

```ts
const localFileResource = derivedResources.find(r => r.name === "CICSLocalFile");
if (!localFileResource) { return; }
```

This makes the entire CLI generation unconditionally dependent on a single specific resource name.

**Target design**: once templates are generic (gap 1), remove the allowlist and the `CICSLocalFile` guard. Iterate over all resources and all action groups in the spec, rendering the generic templates for each.

### 3. `group.definition.hbs` hardcodes its children list

The template contains:

```ts
children: [LocalFileDefinition, UrimapDefinition],
```

This cannot be derived from the spec at render time because each resource's CLI definition file may or may not exist yet (due to gap 1 and gap 2 above).

**Target design**: pass a `children` array into the template context, built by the generator from the resources in the spec that have a CLI definition for the given action group. The template then iterates `{{#each children}}` to produce the imports and the `children` array.
