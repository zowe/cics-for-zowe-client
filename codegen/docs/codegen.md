# CICS SDK Code Generation

## Quick Start

1. Install dependencies: `npm install`
2. Generate code: `npm run generate`
3. Verify changes: `npm run check-generated`

The generator reads `resourceSpecification.json` and produces SDK files, utility files, and test files using Handlebars templates.

---

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: For package management
- **TypeScript**: Knowledge helpful for understanding generated code
- **Git**: For version control and CI integration

---

## What is the Use of Codegen?

The code generation system automates the creation of CICS SDK code from a single source of truth specification. It generates:

- **SDK Resource Files**: TypeScript classes for CICS resources (LocalFile, Program, Transaction, etc.)
- **Utility Files**: Helper functions and constants for resource actions
- **Test Files**: Unit tests for SDK resource classes
- **Type Definitions**: Interfaces and type definitions for parameters

This eliminates manual coding errors, ensures consistency across resources, and makes it easy to add new resources or actions.

---

## Why Use Codegen?

### Benefits

1. **Single Source of Truth**: All resource definitions, actions, and options are defined once in `resourceSpecification.json`
2. **Consistency**: Generated code follows the same patterns and conventions across all resources
3. **Reduced Duplication**: Shared actions and options are defined once and referenced by multiple resources
4. **Maintainability**: Changes to resource behavior only require updating the specification and regenerating
5. **Error Prevention**: Automated generation eliminates manual coding mistakes
6. **Scalability**: Adding new resources or actions is straightforward
7. **Documentation**: The specification serves as documentation for available resources and actions

### Resource-Focused Architecture

The specification is organized by resources rather than actions, which:

- Reduces specification size by 79% (from 323 lines to 68 lines)
- Eliminates duplication of resource information across action groups
- Makes it easier to understand what actions are available for each resource
- Allows sharing of common actions and options across resources

---

## How to Use Codegen

### Basic Workflow

1. **Modify Specification**: Edit `resourceSpecification.json` to add/modify resources, actions, or options
2. **Validate**: The JSON schema automatically validates your changes
3. **Generate Code**: Run `npm run generate` to create SDK files
4. **Review Changes**: Check the generated files in `packages/sdk/src/` and `packages/sdk/__tests__/`
5. **Test**: Run tests to ensure generated code works correctly
6. **Commit**: Commit both specification and generated files together

### Generation Modes

#### Direct Mode (Default)
Generates all files directly into the SDK package:
- SDK resource files in `packages/sdk/src/`
- Utility files in `packages/sdk/src/utils/`
- Test files in `packages/sdk/__tests__/__unit__/`

Use this mode during active development when making changes to resources.

#### Tests-Only Mode
Generates only test files without modifying SDK source files. Useful for:
- Updating tests after manual SDK changes
- Regenerating tests when templates change
- Verifying test coverage

Enable with: `npm run generate -- --tests-only`

### Adding a New Resource

1. Add resource definition to `resourceSpecification.json` under `resources` section
2. Specify resource identifier (name, aliases, primary key, etc.)
3. List actions for the resource (can reference shared actions or define inline)
4. (Optional) Add `additionalOptions` to include extra properties in the Parms interface
5. (Optional) If reusing existing constants, update generator to handle special cases
6. Run `npm run generate`
7. Generated files appear automatically in the SDK package

**Example 1**: Adding a Program resource with ENABLE/DISABLE actions and a csdGroup option:

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
      "actions": [
        "ENABLE",
        "DISABLE"
      ],
      "additionalOptions": ["CSDGROUP"]
    }
  },
  "options": {
    "CSDGROUP": {
      "name": "csdGroup",
      "type": "string",
      "description": "The CICS CSD Group for program definition operations."
    }
  }
}
```

This generates:
- `packages/sdk/src/resources/Program.ts` with `enableProgram()` and `disableProgram()` functions
- `packages/sdk/src/doc/IProgramParms.ts` with `busy` and `csdGroup` properties
- Unit tests for both operations

**Example 2**: Adding a URIMap resource with many additional options for backward compatibility:

```json
{
  "resources": {
    "CICSURIMap": {
      "identifier": {
        "aliases": ["urimap"],
        "humanNameSingular": "URIMap",
        "humanNamePlural": "URIMaps",
        "primaryKey": "urimap",
        "maxPrimaryKeyLength": 8
      },
      "actions": [
        "ENABLE",
        "DISABLE"
      ],
      "additionalOptions": [
        "CSDGROUP", "PATH", "HOST", "SCHEME",
        "PROGRAMNAME", "PIPELINENAME", "CERTIFICATE",
        "AUTHENTICATE", "DESCRIPTION", "TRANSACTIONNAME",
        "WEBSERVICENAME", "ENABLEATTR", "TCPIPSERVICE"
      ]
    }
  }
}
```

**Note**: For URIMap, the generator has special handling to use the existing `CICS_URIMAP` constant instead of generating `CICS_CMCI_U_R_I_MAP`. This is configured in `generate.ts` with a special case for resources that need to reuse existing constants.

This generates:
- `packages/sdk/src/resources/URIMap.ts` with `enableURIMap()` and `disableURIMap()` functions
- `packages/sdk/src/doc/IURIMapParms.ts` with all 14 properties (busy + 13 additional options)
- Uses existing `CICS_URIMAP` constant from the codebase
- Unit tests for both operations

### Adding a New Action

1. Define action in `actions` section of `resourceSpecification.json`
2. Specify action identifier (name, aliases, description, verbs)
3. List options for the action (can reference shared options or define inline)
4. Reference the action in relevant resources
5. Run `npm run generate`

### Modifying Options

1. Update option definition in `options` section
2. Changes automatically apply to all actions using that option
3. Run `npm run generate`

---

## Architecture of Codegen

### Components

#### 1. Specification File (`resourceSpecification.json`)
The single source of truth containing:
- **Resources**: CICS resource types (LocalFile, Program, Transaction, etc.)
- **Actions**: Operations that can be performed (ENABLE, DISABLE, OPEN, CLOSE, etc.)
- **Options**: Parameters for actions (busy, force, etc.)

#### 2. Schema File (`resourceSpecification.schema.json`)
JSON schema that validates the specification structure and ensures:
- Required fields are present
- Data types are correct
- References to shared actions/options are valid
- Naming conventions are followed

#### 3. Generator (`generate.ts`)
TypeScript program that:
- Reads and validates the specification
- Derives properties (constants, interface names, function names)
- Processes Handlebars templates
- Writes generated files to the SDK package
- Handles both direct and tests-only generation modes

#### 4. Templates (`templates/`)
Handlebars templates that define the structure of generated files:
- `sdk/resource.file.hbs`: SDK resource class template
- `sdk/resource.index.hbs`: SDK index file template
- `sdk/utils.resourceactions.hbs`: Utility functions template
- `sdk/utils.index.hbs`: Utility index file template
- `tests/sdk.resource.unit.test.hbs`: Unit test template

### Data Flow

1. **Input**: `resourceSpecification.json` defines resources, actions, and options
2. **Validation**: JSON schema validates the specification structure
3. **Processing**: Generator reads specification and derives additional properties
4. **Template Rendering**: Handlebars templates are populated with resource data
5. **Output**: Generated TypeScript files are written to SDK package

### Derived Properties

The generator automatically creates properties that don't need to be stored in the specification:

- **SDK Resource Type**: Constant name like `CICS_CMCI_LOCALFILE`
- **Parameters Interface**: Interface name like `ILocalFileParms`
- **Criteria Field**: Primary key field name in lowercase
- **Function Names**: Action function names like `openLocalFile`
- **File Names**: SDK file names like `LocalFile.ts`

This reduces specification size and eliminates manual maintenance of derived values.

### Shared Definitions

Actions and options can be defined once and referenced by multiple resources:

- **Shared Actions**: Common actions like ENABLE and DISABLE are defined in the `actions` section
- **Shared Options**: Common options like BUSY are defined in the `options` section
- **References**: Resources reference shared definitions by name
- **Inline Definitions**: Resources can also define actions/options inline for resource-specific behavior

---

## CI Integration

### Automated Checks

The CI pipeline includes a check to ensure generated files are up-to-date:

1. CI runs `npm run check-generated`
2. Script regenerates all files in a temporary directory
3. Compares generated files with committed files
4. Fails if differences are detected

This prevents:
- Manual modifications to generated files
- Forgetting to regenerate after specification changes
- Inconsistencies between specification and code

### Git Workflow

1. **Modify Specification**: Make changes to `resourceSpecification.json`
2. **Generate Code**: Run `npm run generate` locally
3. **Review Changes**: Check generated files with `git diff`
4. **Commit Together**: Commit specification and generated files in the same commit
5. **Push**: CI automatically verifies generated files match specification

### Best Practices

- Always regenerate after modifying the specification
- Never manually edit generated files (they will be overwritten)
- Commit specification and generated files together
- Use meaningful commit messages describing specification changes
- Run `npm run check-generated` before pushing to catch issues early

---

## Troubleshooting

### Common Issues

#### Generated Files Don't Match Specification

**Problem**: After running `npm run generate`, the generated files don't reflect your specification changes.

**Solutions**:
- Ensure you saved `resourceSpecification.json` before generating
- Check for JSON syntax errors in the specification
- Verify the schema validation passes
- Clear any cached files and regenerate

#### Schema Validation Errors

**Problem**: The generator reports schema validation errors.

**Solutions**:
- Check that all required fields are present in your resource definitions
- Verify action and option references exist in their respective sections
- Ensure data types match the schema (strings, arrays, objects)
- Review the error message for specific field issues

#### CI Check Fails

**Problem**: The `check-generated` CI check fails even though you regenerated locally.

**Solutions**:
- Ensure you committed the generated files along with the specification
- Verify you're using the same Node.js version as CI
- Run `npm run check-generated` locally to reproduce the issue
- Check for platform-specific line ending differences (CRLF vs LF)

#### Template Rendering Errors

**Problem**: Handlebars template errors during generation.

**Solutions**:
- Check that all template variables are defined in the specification
- Verify template syntax is correct
- Ensure derived properties are being generated correctly
- Review the generator code for property derivation logic

#### Missing Generated Files

**Problem**: Some expected files are not generated.

**Solutions**:
- Verify the resource is properly defined in the specification
- Check that the resource has at least one action
- Ensure templates exist for the file types you expect
- Review generator output for error messages

#### Incorrect Action Order

**Problem**: Actions appear in the wrong order in generated files.

**Solutions**:
- The generator sorts actions with CLOSE first, then alphabetically
- This is intentional for consistency
- If you need a different order, modify the generator's sorting logic

### Getting Help

If you encounter issues not covered here:

1. Check the specification schema for validation rules
2. Review the generator code for processing logic
3. Examine template files for expected data structure
4. Run the generator with verbose logging if available
5. Consult the team or create an issue with details about the problem