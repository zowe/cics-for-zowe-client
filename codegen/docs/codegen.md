# CICS Code Generation

## Quick Start

1. Install dependencies: `npm install` (inside `codegen/`)
2. Generate code: `npm run generate`
3. Verify changes: `npm run check-generated`

The generator reads `resourceSpecification.json` and produces SDK files, CLI files, utility files, and test files using Handlebars templates.

---

## What Does Codegen Generate?

The generator currently owns code in two packages:

### SDK Package (`packages/sdk`)

| Generated File | Template |
|---|---|
| `src/resources/<Resource>.ts` | `sdk/resource.file.hbs` |
| `src/resources/index.ts` | `sdk/resource.index.hbs` |
| `src/doc/I<Resource>Parms.ts` | `sdk/parms.interface.hbs` |
| `src/doc/index.ts` | `sdk/doc.index.hbs` |
| `src/utils/ResourceActions.ts` | `sdk/utils.resourceactions.hbs` |
| `src/utils/index.ts` | `sdk/utils.index.hbs` |
| `src/constants.ts` | `sdk/constants.hbs` |
| `__tests__/__unit__/<action>/<action>.<resource>.unit.test.ts` | `tests/sdk.resource.unit.test.hbs` |

### CLI Package (`packages/cli`)

| Generated File | Template |
|---|---|
| `src/common/LocalFileHandler.ts` | `cli/localfile.handler.hbs` (Pattern A only) |
| `src/<group>/<Group>.definition.ts` | `cli/group.definition.hbs` |
| `src/<group>/<resourceDir>/<Resource>.definition.ts` | `cli/resource.definition.hbs` |
| `src/<group>/<resourceDir>/<Resource>.handler.ts` | `cli/resource.handler.hbs` (Pattern B only) |
| `src/-strings-/en.ts` | `cli/en.ts.hbs` |
| `__tests__/__unit__/<group>/localFile/<Resource>.handler.unit.test.ts` | `tests/cli.localfile.handler.unit.test.hbs` (Pattern A only) |
| `__tests__/__unit__/<group>/<Group>.definition.unit.test.ts` | `tests/cli.group.definition.unit.test.hbs` |

Pattern A (`useSharedHandler: true`) — definition points at the shared `LocalFileHandler`; no per-resource handler file is generated.
Pattern B — definition and handler are co-located in the same subdirectory.

---

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: For package management
- **TypeScript**: Knowledge helpful for understanding generated code
- **Git**: For version control and CI integration

---

## Why Use Codegen?

1. **Single Source of Truth**: All resource definitions, actions, and options are defined once in `resourceSpecification.json`
2. **Consistency**: Generated code follows the same patterns and conventions across all resources
3. **Reduced Duplication**: Shared actions and options are defined once and referenced by multiple resources
4. **Maintainability**: Changes to resource behaviour only require updating the specification and regenerating
5. **Scalability**: Adding new resources or actions is straightforward

---

## How to Use Codegen

### Basic Workflow

1. **Modify Specification**: Edit `resourceSpecification.json` to add or modify resources, actions, or options
2. **Validate**: The JSON schema automatically validates your changes
3. **Generate Code**: Run `npm run generate` to create files
4. **Review Changes**: Check the generated files in `packages/sdk/src/` and `packages/cli/src/`
5. **Test**: Run tests to ensure generated code works correctly
6. **Commit**: Commit both the specification and the generated files together

### Adding a New Resource (SDK)

1. Add a resource entry to the `resources` section of `resourceSpecification.json`
2. Specify the resource identifier (name, aliases, primary key, etc.)
3. List actions for the resource (reference shared actions or define inline)
4. Optionally add `additionalOptions` to include extra properties in the Parms interface
5. Run `npm run generate`

**Example — Program resource with ENABLE/DISABLE and a `csdGroup` option:**

```json
{
  "resources": {
    "CICSProgram": {
      "identifier": {
        "aliases": ["prog"],
        "humanNameSingular": "Program",
        "humanNamePlural": "Programs",
        "primaryKey": "program",
        "maxPrimaryKeyLength": 8
      },
      "actions": ["ENABLE", "DISABLE"],
      "additionalOptions": ["CSDGROUP"]
    }
  }
}
```

This generates:
- `packages/sdk/src/resources/Program.ts` with `enableProgram()` and `disableProgram()`
- `packages/sdk/src/doc/IProgramParms.ts` with `csdGroup` in the interface
- Unit tests for both operations

**Example — URIMap resource with inline action overrides and many additional options:**

```json
{
  "resources": {
    "CICSURIMap": {
      "identifier": {
        "snakeKey": "URI_MAP",
        "constantName": "CICS_URIMAP"
      },
      "actions": [
        {
          "identifier": { "name": "ENABLE", ... },
          "updateAttribute": { "field": "ENABLESTATUS", "value": "ENABLED" }
        }
      ],
      "additionalOptions": ["CSDGROUP", "PATH", "HOST", ...]
    }
  }
}
```

The `snakeKey` and `constantName` fields let you control constant naming when the default derivation would produce the wrong result (e.g. `CICSURIMap` → `URI_MAP` not `U_R_I_M_A_P`).

### Adding a New Action

1. Define the action in the `actions` section with an identifier, description, verbs, and options
2. Reference it by name in any relevant resource's `actions` array
3. Run `npm run generate`

### Modifying Options

1. Update the option definition in the `options` section
2. Changes automatically propagate to all actions that reference that option
3. Run `npm run generate`

---

## Architecture

### Components

#### 1. Specification (`resourceSpecification.json`)

The single source of truth, organised into three sections:

- **`resources`** — CICS resource types; each has an `identifier`, `actions` list, and optional `additionalOptions`
- **`actions`** — shared action definitions (e.g. `ENABLE`, `DISABLE`) that resources can reference by name
- **`options`** — shared option definitions (e.g. `BUSY`, `CSDGROUP`) that actions can reference by name

Resources can also define actions and options inline for resource-specific behaviour.

#### 2. Schema (`resourceSpecification.schema.json`)

Validates the specification: required fields, data types, reference validity.

#### 3. Generator (`generate.ts`)

Reads the specification, derives additional properties, renders Handlebars templates, and writes files to the SDK and CLI packages. Key derivation examples:

| Input | Derived |
|---|---|
| `"CICSLocalFile"` | SDK file `LocalFile.ts`, interface `ILocalFileParms`, constant `CICS_CMCI_LOCAL_FILE` |
| action group `"enable"` | function name `enableLocalFile`, CLI handler path, test file slug |

#### 4. Templates (`templates/`)

Handlebars templates; one template typically produces one file per resource or per resource+action combination. See the table under [What Does Codegen Generate?](#what-does-codegen-generate) for the current mapping.

### Shared vs Inline Definitions

| Type | Where defined | When to use |
|---|---|---|
| Shared action | `actions` section | Same semantics across multiple resources (e.g. standard ENABLE) |
| Inline action | Inside the resource | Resource-specific overrides (e.g. URIMap ENABLE sets `ENABLESTATUS`) |
| Shared option | `options` section | Same option reused by multiple actions (e.g. `BUSY`) |
| Inline option | Inside the action | One-off option for a single action |

---

## Known Design Gaps

### `group.definition.hbs` hardcodes its children list

The top-level group definition template hardcodes `[LocalFileDefinition, UrimapDefinition]` as the children array. When a new resource is added to the spec its CLI definition is not automatically wired in — the template must be manually updated. The children list should instead be derived from the resources in the spec that have a CLI definition for that action group.

---

## CI Integration

### Automated Checks

The CI pipeline verifies that generated files are up to date:

1. CI runs `npm run check-generated`
2. The script regenerates all files and compares them to the committed versions
3. The check fails if any differences are found

This prevents manual edits to generated files and ensures the specification and code stay in sync.

### Git Workflow

1. Modify `resourceSpecification.json`
2. Run `npm run generate` locally
3. Review changes with `git diff`
4. Commit specification and generated files together
5. Push — CI verifies they match

### Best Practices

- Never manually edit files marked `⚠️ GENERATED FILE - DO NOT EDIT MANUALLY`
- Always commit specification and generated files in the same commit
- Run `npm run check-generated` before pushing

---

## Troubleshooting

### Generated files don't reflect specification changes

- Ensure `resourceSpecification.json` was saved before generating
- Check for JSON syntax errors
- Verify schema validation passes

### Schema validation errors

- Check that all required fields are present
- Verify action and option references exist in their respective sections
- Review the error message for the specific field

### CI check fails after regenerating locally

- Ensure generated files were committed alongside the specification
- Verify you are using the same Node.js version as CI
- Check for platform line-ending differences (CRLF vs LF)
- Run `npm run check-generated` locally to reproduce the failure

### Template rendering errors

- Check that all template variables are defined in the spec
- Verify Handlebars template syntax
- Review generator code for the relevant property derivation logic

### Expected file not generated

- Verify the resource is defined in the specification with at least one action
- Check that the template for the expected file type exists
- Review generator output for error messages
