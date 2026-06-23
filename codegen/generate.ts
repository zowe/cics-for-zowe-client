/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import Handlebars from "handlebars";

// ============================================================================
// Type Definitions for Resource-Focused Specification
// ============================================================================

interface ResourceIdentifier {
  aliases?: string[];
  humanNameSingular: string;
  humanNamePlural?: string;
  primaryKey: string;
  maxPrimaryKeyLength?: number;
}

interface ActionIdentifier {
  name: string;
  aliases?: string[];
  group: string;
  description: string;
  verb: string;
  verbPastTense: string;
}

interface OptionDefinition {
  name: string;
  type: string;
  defaultValue?: string | number | boolean;
  allowableValues?: string[];
  caseSensitive?: boolean;
  description?: string;
}

interface ActionReference {
  identifier: ActionIdentifier;
  options?: (string | OptionDefinition)[];
}

interface ActionDefinition {
  identifier: ActionIdentifier;
  options?: (string | OptionDefinition)[];
}

interface Resource {
  identifier: ResourceIdentifier;
  actions: (string | ActionReference)[];
}

interface ResourceSpecification {
  resources: Record<string, Resource>;
  actions?: Record<string, ActionDefinition>;
  options?: Record<string, OptionDefinition>;
}

// ============================================================================
// Derived Types (Generated from Specification)
// ============================================================================

interface DerivedResource {
  // Original data
  name: string;
  identifier: ResourceIdentifier;
  
  // Generated properties
  sdkFileName: string;
  sdkResourceType: string;
  resourceTypeUpper: string;
  parmsInterface: string;
  criteriaField: string;
  criteriaFieldConstant: string;
  maxLengthConstant?: string;
  busyValuesConstant?: string;
  hasBusyOption: boolean;
  humanNameLower: string;
  humanName: string;
  maxNameLength?: number;
  
  // Resolved actions
  actions: DerivedAction[];
}

interface DerivedAction {
  // Original data
  name: string;
  identifier: ActionIdentifier;
  
  // Generated properties
  actionLower: string;
  actionVerb: string;
  actionPastTense: string;
  sdkFunction: string;
  cliHandler: string;
  vsceCommandId: string;
  
  // Resolved options
  options: DerivedOption[];
  parameters: DerivedParameter[];
  
  // Metadata
  hasParameters: boolean;
  hasValidation: boolean;
}

interface DerivedOption {
  name: string;
  type: string;
  defaultValue?: string | number | boolean;
  allowableValues?: string[];
  caseSensitive?: boolean;
  description?: string;
  sdkParamName: string;
  constantReference?: string;
}

interface DerivedParameter {
  name: string;
  sdkParamField: string;
  transform?: string;
  defaultValue?: string;
  validation?: string;
}

// ============================================================================
// Handlebars Helpers
// ============================================================================

Handlebars.registerHelper("toUpperCase", (str: string) => str?.toUpperCase() || "");
Handlebars.registerHelper("toLowerCase", (str: string) => str?.toLowerCase() || "");
Handlebars.registerHelper("capitalize", (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "");
Handlebars.registerHelper("camelCase", (str: string) => {
  return str
    .toLowerCase()
    .replace(/[-\s]([a-z])/g, (g) => g[1].toUpperCase())
    .replace(/^[a-z]/, (g) => g.toLowerCase());
});
Handlebars.registerHelper("removePrefix", (str: string, prefix: string) => {
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
});
Handlebars.registerHelper("add", (a: number, b: number) => a + b);
Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

// ============================================================================
// Resource-Focused Generator Class
// ============================================================================

export class ResourceGenerator {
  private spec: ResourceSpecification;
  private templateDir: string;
  private outputDir: string;
  private generatedTestFiles: string[] = [];

  constructor(specPath: string, templateDir: string, outputDir: string) {
    const specContent = fs.readFileSync(specPath, "utf-8");
    this.spec = JSON.parse(specContent);
    this.templateDir = templateDir;
    this.outputDir = outputDir;
  }

  /**
   * Generate all code
   */
  public generateAll(): void {
    console.log("🚀 Starting resource-focused code generation...\n");

    this.generateSDK();
    this.generateTests();

    console.log("\n🎉 Code generation complete!");
  }

  /**
   * Generate SDK code
   */
  private generateSDK(): void {
    console.log("📦 Generating SDK layer...");
    
    const sdkOutputDir = path.join(this.outputDir, "sdk", "src", "resources");
    this.ensureDir(sdkOutputDir);

    // Process each resource
    const derivedResources = this.deriveResources();
    
    for (const resource of derivedResources) {
      const fileName = `${resource.sdkFileName}.ts`;
      const filePath = path.join(sdkOutputDir, fileName);
      
      this.generateFromTemplate(
        "sdk/resource.file.hbs",
        filePath,
        resource
      );
      
      console.log(`  ✓ sdk/src/resources/${fileName}`);
    }

    // Generate index.ts file for resources
    const indexPath = path.join(sdkOutputDir, "index.ts");
    this.generateFromTemplate(
      "sdk/resource.index.hbs",
      indexPath,
      { resources: derivedResources.map(r => ({ sdkFileName: r.sdkFileName })) }
    );
    console.log(`  ✓ sdk/src/resources/index.ts`);

    // Generate Parms interfaces in doc directory
    const docOutputDir = path.join(this.outputDir, "sdk", "src", "doc");
    this.ensureDir(docOutputDir);
    
    for (const resource of derivedResources) {
      const parmsFileName = `I${resource.sdkFileName}Parms.ts`;
      const parmsFilePath = path.join(docOutputDir, parmsFileName);
      
      this.generateFromTemplate(
        "sdk/parms.interface.hbs",
        parmsFilePath,
        resource
      );
      
      console.log(`  ✓ sdk/src/doc/${parmsFileName}`);
    }

    // Generate doc/index.ts
    const docIndexPath = path.join(docOutputDir, "index.ts");
    this.generateFromTemplate(
      "sdk/doc.index.hbs",
      docIndexPath,
      { resources: derivedResources }
    );
    console.log(`  ✓ sdk/src/doc/index.ts`);

    // Generate CicsCmci.constants.ts
    const constantsDir = path.join(this.outputDir, "sdk", "src", "constants");
    this.ensureDir(constantsDir);
    
    const constantsPath = path.join(constantsDir, "CicsCmci.constants.ts");
    this.generateFromTemplate(
      "sdk/constants.hbs",
      constantsPath,
      { resources: derivedResources }
    );
    console.log(`  ✓ sdk/src/constants/CicsCmci.constants.ts`);

    // Generate ResourceActions.ts utility file
    const utilsDir = path.join(this.outputDir, "sdk", "src", "utils");
    this.ensureDir(utilsDir);
    
    const resourceActionsPath = path.join(utilsDir, "ResourceActions.ts");
    this.generateFromTemplate(
      "sdk/utils.resourceactions.hbs",
      resourceActionsPath,
      {}
    );
    console.log(`  ✓ sdk/src/utils/ResourceActions.ts`);

    // Generate utils/index.ts
    const utilsIndexPath = path.join(utilsDir, "index.ts");
    this.generateFromTemplate(
      "sdk/utils.index.hbs",
      utilsIndexPath,
      {}
    );
    console.log(`  ✓ sdk/src/utils/index.ts`);

    console.log("✅ SDK layer generated");
  }

  /**
   * Generate unit tests
   */
  private generateTests(): void {
    console.log("📦 Generating SDK unit tests...");
    this.generatedTestFiles = [];
    
    const sdkTestOutputDir = path.join(this.outputDir, "sdk", "__tests__", "__unit__");
    this.ensureDir(sdkTestOutputDir);

    const derivedResources = this.deriveResources();
    
    for (const resource of derivedResources) {
      for (const action of resource.actions) {
        const context = {
          ...resource,
          ...action,
          actionName: action.name,
          hasRegionName: true,
          hasValidation: action.hasValidation,
          hasParameters: action.hasParameters,
          testFileName: `${action.identifier.group.charAt(0).toUpperCase() + action.identifier.group.slice(1)}.${
            resource.sdkFileName.charAt(0).toLowerCase() + resource.sdkFileName.slice(1)
          }.unit.test.ts`,
        };

        const outputPath = path.join(
          sdkTestOutputDir,
          action.identifier.group,
          context.testFileName
        );

        this.generateFromTemplate(
          "tests/sdk.resource.unit.test.hbs",
          outputPath,
          context
        );
        
        this.generatedTestFiles.push(outputPath);
        console.log(`  ✓ ${path.relative(this.outputDir, outputPath)}`);
      }
    }

    console.log("✅ SDK unit tests generated");
  }

  /**
   * Derive all resources with generated properties
   */
  private deriveResources(): DerivedResource[] {
    const derived: DerivedResource[] = [];

    for (const [resourceName, resource] of Object.entries(this.spec.resources)) {
      const derivedResource = this.deriveResource(resourceName, resource);
      derived.push(derivedResource);
    }

    return derived;
  }

  /**
   * Derive a single resource with all generated properties
   */
  private deriveResource(resourceName: string, resource: Resource): DerivedResource {
    // Generate SDK file name (remove CICS prefix if present)
    const sdkFileName = resourceName.replace(/^CICS/, "");
    
    // Generate constants - convert camelCase/PascalCase to SCREAMING_SNAKE_CASE
    // Remove CICS prefix first, then convert
    const nameWithoutCICS = resourceName.replace(/^CICS/, "");
    const resourceTypeUpper = nameWithoutCICS
      .replace(/([A-Z])/g, "_$1")
      .toUpperCase()
      .replace(/^_/, "");
    const sdkResourceType = `CICS_CMCI_${resourceTypeUpper}`;
    const parmsInterface = `I${sdkFileName}Parms`;
    const criteriaField = resource.identifier.primaryKey.toLowerCase(); // lowercase for tests (original behavior)
    // For criteria field and busy values, use CICS_ prefix without _CMCI_
    const criteriaFieldConstant = `CICS_${resourceTypeUpper}_CRITERIA_FIELD`;
    const maxLengthConstant = resource.identifier.maxPrimaryKeyLength
      ? `CICS_${resourceTypeUpper}_MAX_LENGTH`
      : undefined;
    
    // Check if any action uses BUSY option
    const usesBusyOption = resource.actions.some(action => {
      if (typeof action === "string") {
        const actionDef = this.spec.actions?.[action];
        return actionDef?.options?.includes("BUSY");
      } else {
        return action.options?.includes("BUSY");
      }
    });
    const busyValuesConstant = usesBusyOption ? `CICS_${resourceTypeUpper}_BUSY_VALUES` : undefined;

    // Derive actions
    const derivedActions = resource.actions.map(action =>
      this.deriveAction(action, resourceName, sdkFileName)
    );

    // Sort actions: CLOSE first, then others alphabetically
    derivedActions.sort((a, b) => {
      if (a.name === "CLOSE") {
        return -1;
      }
      if (b.name === "CLOSE") {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      name: resourceName,
      identifier: resource.identifier,
      sdkFileName,
      sdkResourceType,
      resourceTypeUpper,
      parmsInterface,
      criteriaField,
      criteriaFieldConstant,
      maxLengthConstant,
      busyValuesConstant,
      hasBusyOption: usesBusyOption,
      humanNameLower: resource.identifier.humanNameSingular.toLowerCase(),
      humanName: resource.identifier.humanNameSingular,
      maxNameLength: resource.identifier.maxPrimaryKeyLength,
      actions: derivedActions,
    };
  }

  /**
   * Derive an action with all generated properties
   */
  private deriveAction(
    action: string | ActionReference, 
    resourceName: string, 
    sdkFileName: string
  ): DerivedAction {
    let actionDef: ActionDefinition;
    
    // Resolve action definition
    if (typeof action === "string") {
      if (!this.spec.actions?.[action]) {
        throw new Error(`Action reference "${action}" not found in shared actions`);
      }
      actionDef = this.spec.actions[action];
    } else {
      actionDef = action as ActionDefinition;
    }

    const identifier = actionDef.identifier;
    const actionLower = identifier.group;
    const actionVerb = identifier.verb;
    const actionPastTense = identifier.verbPastTense;
    
    // Generate function names
    const sdkFunction = `${actionLower}${sdkFileName}`;
    const cliHandler = `${sdkFileName}Handler`;
    const vsceCommandId = `cics-extension-for-zowe.${actionLower}${sdkFileName}`;

    // Resolve options
    const derivedOptions = this.deriveOptions(actionDef.options || [], resourceName);
    const derivedParameters = this.deriveParameters(actionDef.options || [], resourceName);

    return {
      name: identifier.name,
      identifier,
      actionLower,
      actionVerb,
      actionPastTense,
      sdkFunction,
      cliHandler,
      vsceCommandId,
      options: derivedOptions,
      parameters: derivedParameters,
      hasParameters: derivedParameters.length > 0,
      hasValidation: derivedParameters.some(p => p.validation),
    };
  }

  /**
   * Derive options from option references
   */
  private deriveOptions(
    options: (string | OptionDefinition)[], 
    resourceName: string
  ): DerivedOption[] {
    return options.map(option => {
      let optionDef: OptionDefinition;
      
      if (typeof option === "string") {
        if (!this.spec.options?.[option]) {
          throw new Error(`Option reference "${option}" not found in shared options`);
        }
        optionDef = this.spec.options[option];
      } else {
        optionDef = option;
      }

      const resourceTypeUpper = resourceName
        .replace(/([A-Z])/g, "_$1")
        .toUpperCase()
        .replace(/^_/, "");
      
      const constantReference = optionDef.allowableValues 
        ? `CICS_CMCI_${resourceTypeUpper}_${optionDef.name.toUpperCase()}_VALUES`
        : undefined;

      return {
        ...optionDef,
        sdkParamName: optionDef.name,
        constantReference,
      };
    });
  }

  /**
   * Derive parameters from options (for SDK action parameters)
   */
  private deriveParameters(
    options: (string | OptionDefinition)[], 
    resourceName: string
  ): DerivedParameter[] {
    const parameters: DerivedParameter[] = [];

    for (const option of options) {
      let optionDef: OptionDefinition;
      
      if (typeof option === "string") {
        if (!this.spec.options?.[option]) {
          continue;
        }
        optionDef = this.spec.options[option];
      } else {
        optionDef = option;
      }

      // Only create parameters for options with allowable values
      if (optionDef.allowableValues) {
        const resourceTypeUpper = resourceName
          .replace(/([A-Z])/g, "_$1")
          .toUpperCase()
          .replace(/^_/, "");
        
        parameters.push({
          name: optionDef.name.toUpperCase(),
          sdkParamField: optionDef.name,
          transform: optionDef.caseSensitive === false ? "toUpperCase" : undefined,
          defaultValue: optionDef.defaultValue?.toString(),
          validation: `CICS_CMCI_${resourceTypeUpper}_${optionDef.name.toUpperCase()}_VALUES`,
        });
      }
    }

    return parameters;
  }

  /**
   * Generate a file from a Handlebars template
   */
  private generateFromTemplate(templatePath: string, outputPath: string, context: unknown): void {
    const fullTemplatePath = path.join(this.templateDir, templatePath);
    const templateContent = fs.readFileSync(fullTemplatePath, "utf-8");
    const template = Handlebars.compile(templateContent);
    const output = template(context);
    
    this.ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, output, "utf-8");
  }

  /**
   * Ensure a directory exists
   */
  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Run generated unit tests
   */
  public runTests(): void {
    if (this.generatedTestFiles.length === 0) {
      console.log("⚠️  No test files were generated, skipping test execution");
      return;
    }

    const sdkDir = path.join(this.outputDir, "sdk");
    const testPatterns = this.generatedTestFiles.map(filePath => {
      return path.relative(sdkDir, filePath);
    }).join(" ");
    
    try {
      console.log("🧪 Running generated SDK unit tests...");
      console.log(`   Testing: ${this.generatedTestFiles.length} file(s)`);

      const jestConfigPath = path.join(__dirname, "..", "packages", "sdk", "unit.jest_config.ts");
      const jestCommand = `npx jest --config "${jestConfigPath}" ${testPatterns}`;
      execSync(jestCommand, { cwd: sdkDir, stdio: "inherit" });

      console.log("✅ Generated unit tests passed");
    } catch (error) {
      console.error("❌ Generated unit tests failed");
      throw error;
    }
  }
}

// ============================================================================
// Main Execution
// ============================================================================

if (require.main === module) {
  const specPath = path.join(__dirname, "resourceSpecification.json");
  const templateDir = path.join(__dirname, "templates");
  const outputDir = path.join(__dirname, "..", "packages");

  const generator = new ResourceGenerator(specPath, templateDir, outputDir);

  console.log("📁 Output directory:", outputDir);
  console.log("📄 Using resource-focused specification\n");

  generator.generateAll();
}

// Made with Bob
