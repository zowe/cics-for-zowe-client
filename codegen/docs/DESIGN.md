# CICS Code Generation System - Design Document

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Design](#component-design)
4. [Data Flow](#data-flow)
5. [UML Diagrams](#uml-diagrams)
6. [Flowcharts](#flowcharts)
7. [Extension Points](#extension-points)
8. [Future Enhancements](#future-enhancements)

---

## Overview

The CICS Code Generation System is a template-based code generator that produces SDK and CLI code for CICS resources from a single JSON specification. It follows a resource-focused architecture where resources are the primary organizing principle.

### Key Features
- **Single Source of Truth**: All resource definitions in `resourceSpecification.json`
- **Template-Based Generation**: Handlebars templates for consistent code structure
- **Multi-Package Support**: Generates code for SDK and CLI packages
- **Automated Testing**: Generates unit tests alongside implementation code
- **CI Integration**: Automated validation of generated code

### Supported Packages
1. **SDK Package** (`packages/sdk`): Core TypeScript SDK for CICS operations
2. **CLI Package** (`packages/cli`): Command-line interface (future)
3. **VSCode Extension** (`packages/vsce`): VS Code extension (future)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Code Generation System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │   Specification  │────────▶│  JSON Schema     │             │
│  │   (JSON)         │         │  Validator       │             │
│  └──────────────────┘         └──────────────────┘             │
│           │                             │                        │
│           │                             ▼                        │
│           │                    ┌─────────────────┐              │
│           └───────────────────▶│   Generator     │              │
│                                │   (TypeScript)  │              │
│                                └─────────────────┘              │
│                                         │                        │
│                    ┌────────────────────┼────────────────────┐  │
│                    ▼                    ▼                    ▼  │
│           ┌─────────────────┐  ┌─────────────────┐  ┌──────────┴──┐
│           │  SDK Templates  │  │  CLI Templates  │  │ Test Templates│
│           │  (Handlebars)   │  │  (Handlebars)   │  │ (Handlebars)  │
│           └─────────────────┘  └─────────────────┘  └──────────────┘
│                    │                    │                    │
│                    └────────────────────┼────────────────────┘
│                                         ▼
│                              ┌─────────────────────┐
│                              │  Generated Code     │
│                              │  - SDK Resources    │
│                              │  - CLI Handlers     │
│                              │  - Unit Tests       │
│                              └─────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

### Package Structure

```
cics-for-zowe-client/
├── codegen/                          # Code generation system
│   ├── resourceSpecification.json    # Single source of truth
│   ├── resourceSpecification.schema.json
│   ├── generate.ts                   # Main generator
│   ├── check-generated.ts            # CI validation
│   ├── templates/                    # Handlebars templates
│   │   ├── sdk/
│   │   │   ├── resource.file.hbs
│   │   │   ├── resource.index.hbs
│   │   │   ├── utils.resourceactions.hbs
│   │   │   └── utils.index.hbs
│   │   ├── cli/                      # Future CLI templates
│   │   └── tests/
│   │       └── sdk.resource.unit.test.hbs
│   └── docs/
│       ├── codegen.md                # User documentation
│       └── DESIGN.md                 # This document
│
├── packages/
│   ├── sdk/                          # Generated SDK code
│   │   ├── src/
│   │   │   ├── resources/            # Generated resource files
│   │   │   │   ├── LocalFile.ts
│   │   │   │   └── index.ts
│   │   │   └── utils/
│   │   │       ├── ResourceActions.ts
│   │   │       └── index.ts
│   │   └── __tests__/__unit__/       # Generated tests
│   │       ├── close/
│   │       ├── open/
│   │       └── ...
│   │
│   ├── cli/                          # Future CLI package
│   └── vsce/                         # Future VSCode extension
```

---

## Component Design

### 1. Resource Specification (`resourceSpecification.json`)

The specification is organized hierarchically:

```json
{
  "resources": {
    "ResourceName": {
      "identifier": { /* metadata */ },
      "actions": [ /* action references or inline definitions */ ]
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
- Resources are the primary organizing unit
- Actions and options can be shared across resources
- Inline definitions allow resource-specific customization
- Metadata drives code generation (no manual derivation needed)

### 2. JSON Schema Validator

Validates the specification structure:
- Required fields presence
- Data type correctness
- Reference validity (shared actions/options exist)
- Naming convention compliance

### 3. Generator (`generate.ts`)

**Class: ResourceGenerator**

```typescript
class ResourceGenerator {
  private spec: ResourceSpecification;
  private templateDir: string;
  private outputDir: string;
  
  // Main generation methods
  public generateAll(): void
  private generateSDK(): void
  private generateCLI(): void  // Future
  private generateTests(): void
  
  // Resource processing
  private deriveResources(): DerivedResource[]
  private deriveResource(name, resource): DerivedResource
  private deriveAction(action, resourceName): DerivedAction
  private deriveOptions(options): DerivedOption[]
  private deriveParameters(options): DerivedParameter[]
  
  // Template rendering
  private generateFromTemplate(template, output, context): void
  private ensureDir(path): void
}
```

### 4. Templates (Handlebars)

**Template Types:**

1. **SDK Resource Template** (`sdk/resource.file.hbs`)
   - Generates TypeScript resource files
   - Includes action functions with validation
   - Uses shared utility functions

2. **SDK Utils Template** (`sdk/utils.resourceactions.hbs`)
   - Generates generic action performer
   - Handles CMCI REST API calls
   - Builds request bodies

3. **Test Template** (`tests/sdk.resource.unit.test.hbs`)
   - Generates Jest unit tests
   - Tests validation logic
   - Tests success scenarios with mocks

4. **Index Templates**
   - Generate barrel exports
   - Maintain clean module structure

---

## Data Flow

### Generation Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LOAD SPECIFICATION                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  resourceSpecification.json ──▶ Parse JSON ──▶ Validate Schema  │
│                                                                   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. DERIVE PROPERTIES                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  For each Resource:                                              │
│    ├─ Generate SDK file name (remove CICS prefix)               │
│    ├─ Generate constants (SCREAMING_SNAKE_CASE)                 │
│    ├─ Generate interface names (IPascalCaseParms)               │
│    ├─ Resolve action references                                 │
│    └─ For each Action:                                           │
│         ├─ Generate function names (camelCase)                   │
│         ├─ Resolve option references                            │
│         └─ Derive parameters from options                       │
│                                                                   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. RENDER TEMPLATES                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  For each Resource:                                              │
│    ├─ Render SDK resource file                                  │
│    └─ For each Action:                                           │
│         └─ Render unit test file                                │
│                                                                   │
│  Render utility files:                                           │
│    ├─ ResourceActions.ts                                         │
│    └─ index.ts files                                             │
│                                                                   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. WRITE OUTPUT                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  packages/sdk/src/resources/                                     │
│    ├─ LocalFile.ts                                               │
│    └─ index.ts                                                   │
│                                                                   │
│  packages/sdk/src/utils/                                         │
│    ├─ ResourceActions.ts                                         │
│    └─ index.ts                                                   │
│                                                                   │
│  packages/sdk/__tests__/__unit__/                                │
│    ├─ close/Close.localFile.unit.test.ts                        │
│    └─ open/Open.localFile.unit.test.ts                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Property Derivation Flow

```
Input: "CICSLocalFile"
  │
  ├─▶ Remove "CICS" prefix ──▶ "LocalFile"
  │                              │
  │                              ├─▶ SDK File Name: "LocalFile"
  │                              └─▶ Interface Name: "ILocalFileParms"
  │
  └─▶ Convert to SCREAMING_SNAKE_CASE
      │
      ├─▶ Split on capitals: ["CICS", "Local", "File"]
      ├─▶ Remove "CICS": ["Local", "File"]
      ├─▶ Join with "_": "LOCAL_FILE"
      └─▶ Add prefix: "CICS_CMCI_LOCAL_FILE"
          │
          ├─▶ Resource Type Constant
          ├─▶ Criteria Field Constant: "CICS_CMCI_LOCAL_FILE_CRITERIA_FIELD"
          ├─▶ Max Length Constant: "CICS_CMCI_LOCAL_FILE_MAX_LENGTH"
          └─▶ Busy Values Constant: "CICS_CMCI_LOCAL_FILE_BUSY_VALUES"
```

---

## UML Diagrams

### Class Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ResourceSpecification                         │
├─────────────────────────────────────────────────────────────────┤
│ + resources: Map<string, Resource>                               │
│ + actions: Map<string, ActionDefinition>                         │
│ + options: Map<string, OptionDefinition>                         │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ contains
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Resource                                 │
├─────────────────────────────────────────────────────────────────┤
│ + identifier: ResourceIdentifier                                 │
│ + actions: (string | ActionReference)[]                          │
├─────────────────────────────────────────────────────────────────┤
│ + deriveResource(): DerivedResource                              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ has
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ResourceIdentifier                            │
├─────────────────────────────────────────────────────────────────┤
│ + aliases: string[]                                              │
│ + humanNameSingular: string                                      │
│ + humanNamePlural: string                                        │
│ + primaryKey: string                                             │
│ + maxPrimaryKeyLength: number                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ActionDefinition                              │
├─────────────────────────────────────────────────────────────────┤
│ + identifier: ActionIdentifier                                   │
│ + options: (string | OptionDefinition)[]                         │
├─────────────────────────────────────────────────────────────────┤
│ + deriveAction(): DerivedAction                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ has
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ActionIdentifier                              │
├─────────────────────────────────────────────────────────────────┤
│ + name: string                                                   │
│ + aliases: string[]                                              │
│ + group: string                                                  │
│ + description: string                                            │
│ + verb: string                                                   │
│ + verbPastTense: string                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    OptionDefinition                              │
├─────────────────────────────────────────────────────────────────┤
│ + name: string                                                   │
│ + type: string                                                   │
│ + defaultValue: any                                              │
│ + allowableValues: string[]                                      │
│ + caseSensitive: boolean                                         │
│ + description: string                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ResourceGenerator                             │
├─────────────────────────────────────────────────────────────────┤
│ - spec: ResourceSpecification                                    │
│ - templateDir: string                                            │
│ - outputDir: string                                              │
│ - generatedTestFiles: string[]                                   │
├─────────────────────────────────────────────────────────────────┤
│ + generateAll(): void                                            │
│ - generateSDK(): void                                            │
│ - generateCLI(): void                                            │
│ - generateTests(): void                                          │
│ - deriveResources(): DerivedResource[]                           │
│ - deriveResource(name, resource): DerivedResource                │
│ - deriveAction(action, resourceName): DerivedAction              │
│ - deriveOptions(options): DerivedOption[]                        │
│ - deriveParameters(options): DerivedParameter[]                  │
│ - generateFromTemplate(template, output, context): void          │
│ - ensureDir(path): void                                          │
│ + runTests(): void                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Sequence Diagram - Code Generation

```
User          Generator       Specification    Templates       FileSystem
 │                │                │               │               │
 │ npm run       │                │               │               │
 │ generate      │                │               │               │
 ├──────────────▶│                │               │               │
 │                │                │               │               │
 │                │ Load & Parse   │               │               │
 │                ├───────────────▶│               │               │
 │                │                │               │               │
 │                │ Validate       │               │               │
 │                │ Schema         │               │               │
 │                ├───────────────▶│               │               │
 │                │◀───────────────┤               │               │
 │                │                │               │               │
 │                │ For each Resource              │               │
 │                │ ┌──────────────┐               │               │
 │                │ │ Derive       │               │               │
 │                │ │ Properties   │               │               │
 │                │ └──────────────┘               │               │
 │                │                │               │               │
 │                │                │ Load Template │               │
 │                │                ├──────────────▶│               │
 │                │                │◀──────────────┤               │
 │                │                │               │               │
 │                │                │ Render with   │               │
 │                │                │ Context       │               │
 │                │                ├──────────────▶│               │
 │                │                │◀──────────────┤               │
 │                │                │               │               │
 │                │                │               │ Write File    │
 │                │                │               ├──────────────▶│
 │                │                │               │               │
 │                │ └──────────────────────────────┘               │
 │                │                │               │               │
 │                │ Generate Tests │               │               │
 │                │ ┌──────────────┐               │               │
 │                │ │ For each     │               │               │
 │                │ │ Action       │               │               │
 │                │ └──────────────┘               │               │
 │                │                │               │               │
 │◀───────────────┤                │               │               │
 │ Complete       │                │               │               │
```

---

## Flowcharts

### Main Generation Flow

```
                    START
                      │
                      ▼
         ┌────────────────────────┐
         │ Load Specification     │
         │ (JSON)                 │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Validate Against       │
         │ JSON Schema            │
         └────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Valid?        │
              └───────────────┘
                 │         │
                No        Yes
                 │         │
                 ▼         ▼
         ┌──────────┐  ┌────────────────────────┐
         │ Throw    │  │ Parse Resources        │
         │ Error    │  │ from Specification     │
         └──────────┘  └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ For Each Resource      │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ Derive Properties:     │
                   │ - SDK File Name        │
                   │ - Constants            │
                   │ - Interface Names      │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ Resolve Actions        │
                   │ (Shared or Inline)     │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ For Each Action        │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ Derive Action Props:   │
                   │ - Function Names       │
                   │ - Parameters           │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ Resolve Options        │
                   │ (Shared or Inline)     │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ Render SDK Template    │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ Write SDK File         │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ Render Test Template   │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ Write Test File        │
                   └────────────────────────┘
                              │
                              ▼
                   ┌────────────────────────┐
                   │ More Resources?        │
                   └────────────────────────┘
                         │         │
                        Yes       No
                         │         │
                         └─────────┤
                                   ▼
                        ┌────────────────────────┐
                        │ Generate Index Files   │
                        └────────────────────────┘
                                   │
                                   ▼
                        ┌────────────────────────┐
                        │ Generate Utils Files   │
                        └────────────────────────┘
                                   │
                                   ▼
                                  END
```

### Property Derivation Flow

```
                    START
                      │
                      ▼
         ┌────────────────────────┐
         │ Input: Resource Name   │
         │ (e.g., "CICSLocalFile")│
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Remove "CICS" Prefix   │
         │ Result: "LocalFile"    │
         └────────────────────────┘
                      │
                      ├─────────────────────────┐
                      │                         │
                      ▼                         ▼
         ┌────────────────────────┐  ┌────────────────────────┐
         │ SDK File Name          │  │ Convert to             │
         │ = "LocalFile"          │  │ SCREAMING_SNAKE_CASE   │
         └────────────────────────┘  └────────────────────────┘
                                                │
                                                ▼
                                     ┌────────────────────────┐
                                     │ Split on Capitals:     │
                                     │ ["Local", "File"]      │
                                     └────────────────────────┘
                                                │
                                                ▼
                                     ┌────────────────────────┐
                                     │ Join with "_":         │
                                     │ "LOCAL_FILE"           │
                                     └────────────────────────┘
                                                │
                                                ▼
                                     ┌────────────────────────┐
                                     │ Add Prefix:            │
                                     │ "CICS_CMCI_LOCAL_FILE" │
                                     └────────────────────────┘
                                                │
                      ┌─────────────────────────┼─────────────────────────┐
                      │                         │                         │
                      ▼                         ▼                         ▼
         ┌────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
         │ Resource Type      │  │ Criteria Field       │  │ Max Length           │
         │ Constant           │  │ Constant             │  │ Constant             │
         └────────────────────┘  └──────────────────────┘  └──────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Interface Name:        │
         │ "I" + SDK File Name    │
         │ + "Parms"              │
         │ = "ILocalFileParms"    │
         └────────────────────────┘
                      │
                      ▼
                     END
```

### Action Resolution Flow

```
                    START
                      │
                      ▼
         ┌────────────────────────┐
         │ Input: Action          │
         │ (string or object)     │
         └────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Is String?    │
              └───────────────┘
                 │         │
                Yes       No
                 │         │
                 ▼         ▼
    ┌────────────────────┐  ┌────────────────────┐
    │ Lookup in Shared   │  │ Use Inline         │
    │ Actions            │  │ Definition         │
    └────────────────────┘  └────────────────────┘
                 │                     │
                 ▼                     │
         ┌───────────────┐             │
         │ Found?        │             │
         └───────────────┘             │
            │         │                │
           Yes       No                │
            │         │                │
            │         ▼                │
            │  ┌──────────┐            │
            │  │ Throw    │            │
            │  │ Error    │            │
            │  └──────────┘            │
            │                          │
            └──────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Extract Identifier     │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Generate Function Name │
         │ = group + ResourceName │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Resolve Options        │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Derive Parameters      │
         │ from Options           │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Return DerivedAction   │
         └────────────────────────┘
                      │
                      ▼
                     END
```

### CI Validation Flow

```
                    START
                      │
                      ▼
         ┌────────────────────────┐
         │ CI Pipeline Triggered  │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Run check-generated.ts │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Execute Generator      │
         │ in Repository          │
         └────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Run git diff           │
         │ on packages/sdk        │
         └────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Files Changed?│
              └───────────────┘
                 │         │
                Yes       No
                 │         │
                 ▼         ▼
         ┌──────────┐  ┌────────────────────┐
         │ List     │  │ ✅ Check Passed    │
         │ Changed  │  │ Generated files    │
         │ Files    │  │ are up-to-date     │
         └──────────┘  └────────────────────┘
                 │              │
                 ▼              │
         ┌──────────┐           │
         │ ❌ Fail  │           │
         │ CI Check │           │
         └──────────┘           │
                 │              │
                 └──────────────┘
                        │
                        ▼
                       END
```

---

## Extension Points

### Adding New Resource Types

1. **Update Specification**
   ```json
   {
     "resources": {
       "CICSNewResource": {
         "identifier": {
           "humanNameSingular": "New Resource",
           "primaryKey": "resourcekey",
           "maxPrimaryKeyLength": 8
         },
         "actions": ["ENABLE", "DISABLE"]
       }
     }
   }
   ```

2. **Run Generator**
   ```bash
   npm run generate
   ```

3. **Generated Files**
   - `packages/sdk/src/resources/NewResource.ts`
   - `packages/sdk/__tests__/__unit__/enable/Enable.newResource.unit.test.ts`
   - `packages/sdk/__tests__/__unit__/disable/Disable.newResource.unit.test.ts`

### Adding New Actions

1. **Define Shared Action**
   ```json
   {
     "actions": {
       "REFRESH": {
         "identifier": {
           "name": "REFRESH",
           "group": "refresh",
           "description": "Refresh a resource",
           "verb": "refreshing",
           "verbPastTense": "refreshed"
         },
         "options": []
       }
     }
   }
   ```

2. **Reference in Resources**
   ```json
   {
     "resources": {
       "CICSProgram": {
         "actions": ["ENABLE", "DISABLE", "REFRESH"]
       }
     }
   }
   ```

### Adding New Options

1. **Define Shared Option**
   ```json
   {
     "options": {
       "TIMEOUT": {
         "name": "timeout",
         "type": "number",
         "defaultValue": 30,
         "description": "Timeout in seconds"
       }
     }
   }
   ```

2. **Reference in Actions**
   ```json
   {
     "actions": {
       "OPEN": {
         "options": ["BUSY", "TIMEOUT"]
       }
     }
   }
   ```

### Adding New Templates

1. **Create Template File**
   - Location: `codegen/templates/cli/handler.hbs`
   - Use Handlebars syntax with derived properties

2. **Update Generator**
   ```typescript
   private generateCLI(): void {
     const derivedResources = this.deriveResources();
     for (const resource of derivedResources) {
       this.generateFromTemplate(
         "cli/handler.hbs",
         `packages/cli/src/${resource.sdkFileName}Handler.ts`,
         resource
       );
     }
   }
   ```

3. **Call in generateAll()**
   ```typescript
   public generateAll(): void {
     this.generateSDK();
     this.generateCLI();  // Add this
     this.generateTests();
   }
   ```

---

## Future Enhancements

### 1. CLI Package Generation

**Goal**: Generate CLI command handlers and definitions

**Components to Generate**:
- Command definition files
- Handler classes
- Command group definitions
- Help text

**Template Structure**:
```
templates/
├── cli/
│   ├── handler.hbs
│   ├── definition.hbs
│   └── group.definition.hbs
```

**Example Output**:
```typescript
// packages/cli/src/open/OpenLocalFile.handler.ts
export class OpenLocalFileHandler extends CicsBaseHandler {
  public async process(params: IHandlerParameters): Promise<void> {
    const response = await openLocalFile(
      this.session,
      {
        name: params.arguments.name,
        regionName: params.arguments.regionName,
        cicsPlex: params.arguments.cicsPlex,
      }
    );
    // Handle response...
  }
}
```

### 2. VSCode Extension Generation

**Goal**: Generate VS Code command registrations and handlers

**Components to Generate**:
- Command registration code
- Tree view item actions
- Context menu contributions
- Command palette entries

**Template Structure**:
```
templates/
├── vsce/
│   ├── command.registration.hbs
│   ├── command.handler.hbs
│   └── package.json.contribution.hbs
```

### 3. Documentation Generation

**Goal**: Generate API documentation from specification

**Components to Generate**:
- Markdown API reference
- JSDoc comments
- Usage examples
- Migration guides

**Template Structure**:
```
templates/
├── docs/
│   ├── api.reference.hbs
│   ├── resource.guide.hbs
│   └── changelog.entry.hbs
```

### 4. Enhanced Validation

**Improvements**:
- Cross-reference validation (ensure all referenced actions/options exist)
- Naming convention enforcement
- Duplicate detection
- Deprecation warnings

**Implementation**:
```typescript
class SpecificationValidator {
  public validate(spec: ResourceSpecification): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Check for duplicate resource names
    // Validate action references
    // Validate option references
    // Check naming conventions
    
    return { valid: errors.length === 0, errors };
  }
}
```

### 5. Incremental Generation

**Goal**: Only regenerate changed files

**Benefits**:
- Faster generation
- Preserve manual customizations in non-generated sections
- Better IDE performance

**Implementation**:
```typescript
class IncrementalGenerator extends ResourceGenerator {
  private computeHash(content: string): string {
    // Compute content hash
  }
  
  private shouldRegenerate(file: string, context: any): boolean {
    // Compare hashes
  }
}
```

### 6. Multi-Language Support

**Goal**: Generate code for multiple languages

**Supported Languages**:
- TypeScript (current)
- Python (future)
- Java (future)

**Template Structure**:
```
templates/
├── typescript/
│   └── sdk/
├── python/
│   └── sdk/
└── java/
    └── sdk/
```

### 7. Custom Template Plugins

**Goal**: Allow external template contributions

**Plugin System**:
```typescript
interface TemplatePlugin {
  name: string;
  templateDir: string;
  outputDir: string;
  generate(resources: DerivedResource[]): void;
}

class PluginManager {
  private plugins: TemplatePlugin[] = [];
  
  public registerPlugin(plugin: TemplatePlugin): void {
    this.plugins.push(plugin);
  }
  
  public generateAll(): void {
    for (const plugin of this.plugins) {
      plugin.generate(this.deriveResources());
    }
  }
}
```

---

## Conclusion

The CICS Code Generation System provides a robust, extensible foundation for generating consistent code across multiple packages. Its resource-focused architecture, template-based approach, and comprehensive validation ensure maintainability and scalability as the project grows.

### Key Takeaways

1. **Single Source of Truth**: All resource definitions in one place
2. **Template-Driven**: Easy to modify output without changing generator logic
3. **Extensible**: Simple to add new resources, actions, and packages
4. **Validated**: JSON schema ensures specification correctness
5. **CI-Integrated**: Automated checks prevent drift between spec and code

### Next Steps

1. Implement CLI package generation
2. Add VSCode extension generation
3. Enhance validation with cross-reference checks
4. Create documentation generation templates
5. Develop incremental generation capability

---

**Document Version**: 1.0  
**Last Updated**: 2026-06-19  
**Author**: Code Generation System Design Team