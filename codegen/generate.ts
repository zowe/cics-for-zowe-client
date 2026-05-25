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
import Handlebars from "handlebars";

// ============================================================================
// Type Definitions
// ============================================================================

interface Positional {
  name: string;
  description: string;
  type: string;
  required: boolean;
  sdkParamName: string;
}

interface Option {
  name: string;
  description: string;
  type: string;
  defaultValue?: string;
  allowableValues?: string[];
  caseSensitive?: boolean;
  sdkParamName: string;
  constantReference?: string;
}

interface Parameter {
  name: string;
  sdkParamField: string;
  transform?: string;
  defaultValue?: string;
  validation?: string;
}

interface VsceParameter {
  name: string;
  prompt: string;
  choices: Record<string, string>;
}

interface Messages {
  success: string;
  progress: string;
}

interface Example {
  description: string;
  options: string;
}

interface Action {
  name: string;
  actionLower: string;
  actionVerb: string;
  actionPastTense: string;
  sdkFunction: string;
  cliHandler: string;
  vsceCommandId: string;
  positionals: Positional[];
  options: Option[];
  parameters: Parameter[];
  vsceParameter?: VsceParameter;
  messages: Messages;
  examples: Example[];
}

interface Resource {
  name: string;
  aliases: string[];
  humanName: string;
  humanNameLower: string;
  sdkResourceType: string;
  parmsInterface: string;
  criteriaField: string;
  maxNameLength?: number;
  actions: Action[];
}

interface CommandGroup {
  group: string;
  groupAliases: string[];
  groupSummary: string;
  groupDescription: string;
  resources: Resource[];
}

interface CommandSpecification {
  commands: CommandGroup[];
}

// ============================================================================
// Handlebars Helpers
// ============================================================================

Handlebars.registerHelper("toUpperCase", (str: string) => str?.toUpperCase() || "");
Handlebars.registerHelper("toLowerCase", (str: string) => str?.toLowerCase() || "");
Handlebars.registerHelper("capitalize", (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "");
Handlebars.registerHelper("camelCase", (str: string) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
});
Handlebars.registerHelper("removePrefix", (str: string, prefix: string) => {
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
});
Handlebars.registerHelper("add", (a: number, b: number) => a + b);
Handlebars.registerHelper("eq", (a: any, b: any) => a === b);

// ============================================================================
// Generator Class
// ============================================================================

export class CommandGenerator {
  private spec: CommandSpecification;
  private templateDir: string;
  private outputDir: string;

  constructor(specPath: string, templateDir: string, outputDir: string) {
    const specContent = fs.readFileSync(specPath, "utf-8");
    this.spec = JSON.parse(specContent);
    this.templateDir = templateDir;
    this.outputDir = outputDir;
  }

  /**
   * Generate all code for CLI, SDK, and VSCE
   */
  public generateAll(): void {
    console.log("🚀 Starting comprehensive code generation...\n");
    
    this.generateCLI();
    this.generateSDK();
    this.generateVSCE();
    
    console.log("\n🎉 Code generation complete!");
  }

  /**
   * Generate CLI command definitions and strings
   */
  private generateCLI(): void {
    console.log("📦 Generating CLI layer...");
    
    // Check if outputDir ends with 'packages' (direct mode)
    const isDirect = this.outputDir.endsWith("packages");
    const cliOutputDir = isDirect
      ? path.join(this.outputDir, "cli", "src")
      : path.join(this.outputDir, "cli");
    this.ensureDir(cliOutputDir);

    for (const commandGroup of this.spec.commands) {
      // Generate group definition
      this.generateFromTemplate(
        "cli/group.definition.hbs",
        path.join(cliOutputDir, commandGroup.group, `${commandGroup.group.charAt(0).toUpperCase() + commandGroup.group.slice(1)}.definition.ts`),
        commandGroup
      );

      // Generate resource definitions
      for (const resource of commandGroup.resources) {
        const action = resource.actions[0]; // Get first action for this group
        const context = {
          ...resource,
          ...action,
          group: commandGroup.group,
          resourceName: resource.name,
          hasConstantReference: action.options.some(opt => opt.constantReference),
        };

        this.generateFromTemplate(
          "cli/resource.definition.hbs",
          path.join(cliOutputDir, commandGroup.group, `${commandGroup.group.charAt(0).toUpperCase() + commandGroup.group.slice(1)}${resource.name}.ts`),
          context
        );
      }

      // Generate strings (append to strings file)
      const stringsPath = path.join(cliOutputDir, "strings", `${commandGroup.group}.strings.ts`);
      this.ensureDir(path.dirname(stringsPath));
      
      for (const resource of commandGroup.resources) {
        const action = resource.actions[0];
        const context = {
          group: commandGroup.group,
          groupSummary: commandGroup.groupSummary,
          groupDescription: commandGroup.groupDescription,
          resources: [{
            ...resource,
            ...action,
          }],
        };
        
        this.generateFromTemplate("cli/strings.hbs", stringsPath, context);
      }
    }

    console.log("✅ CLI layer generated");
  }

  /**
   * Generate SDK resource functions
   */
  private generateSDK(): void {
    console.log("📦 Generating SDK layer...");
    
    // Check if outputDir ends with 'packages' (direct mode)
    const isDirect = this.outputDir.endsWith("packages");
    const sdkOutputDir = isDirect
      ? path.join(this.outputDir, "sdk", "src", "resources")
      : path.join(this.outputDir, "sdk");
    this.ensureDir(sdkOutputDir);

    for (const commandGroup of this.spec.commands) {
      for (const resource of commandGroup.resources) {
        for (const action of resource.actions) {
          const context = {
            ...resource,
            ...action,
            actionName: action.name,
            hasRegionName: action.options.some(opt => opt.sdkParamName === "regionName"),
            hasValidation: action.parameters.some(p => p.validation),
            maxLengthConstant: resource.maxNameLength ? `${resource.sdkResourceType}_MAX_LENGTH` : undefined,
            criteriaFieldConstant: `${resource.sdkResourceType}_CRITERIA_FIELD`,
          };

          this.generateFromTemplate(
            "sdk/resource.function.hbs",
            path.join(sdkOutputDir, `${action.sdkFunction}.ts`),
            context
          );
        }
      }
    }

    console.log("✅ SDK layer generated");
  }

  /**
   * Generate VSCE command handlers
   */
  private generateVSCE(): void {
    console.log("📦 Generating VSCE layer...");
    
    // Check if outputDir ends with 'packages' (direct mode)
    const isDirect = this.outputDir.endsWith("packages");
    const vsceOutputDir = isDirect
      ? path.join(this.outputDir, "vsce", "src", "commands")
      : path.join(this.outputDir, "vsce");
    this.ensureDir(vsceOutputDir);

    // Group actions by resource
    const resourceMap = new Map<string, { resource: Resource; actions: Action[] }>();
    
    for (const commandGroup of this.spec.commands) {
      for (const resource of commandGroup.resources) {
        if (!resourceMap.has(resource.name)) {
          resourceMap.set(resource.name, { resource, actions: [] });
        }
        resourceMap.get(resource.name)!.actions.push(...resource.actions);
      }
    }

    // Generate handler for each resource
    for (const [resourceName, { resource, actions }] of resourceMap) {
      const context = {
        resourceName: resource.name,
        humanName: resource.humanName,
        humanNameLower: resource.humanNameLower,
        humanNamePlural: resource.humanNameLower + "s",
        parmsInterface: resource.parmsInterface,
        criteriaField: resource.criteriaField,
        actions,
      };

      this.generateFromTemplate(
        "vsce/command.handler.hbs",
        path.join(vsceOutputDir, `${resourceName}CommandHandler.ts`),
        context
      );
    }

    console.log("✅ VSCE layer generated");
  }

  /**
   * Generate file from template
   */
  private generateFromTemplate(templatePath: string, outputPath: string, context: any): void {
    const fullTemplatePath = path.join(this.templateDir, templatePath);
    const templateSource = fs.readFileSync(fullTemplatePath, "utf-8");
    const template = Handlebars.compile(templateSource);
    const output = template(context);

    this.ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, output);
    console.log(`  ✓ ${path.relative(this.outputDir, outputPath)}`);
  }

  /**
   * Ensure directory exists
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// ============================================================================
// Main Execution
// ============================================================================

if (require.main === module) {
  const specPath = path.join(__dirname, "commandSpecification.json");
  const templateDir = path.join(__dirname, "templates");
  
  // Check if --direct flag is provided to write directly to packages
  const isDirect = process.argv.includes("--direct");
  const outputDir = isDirect
    ? path.join(__dirname, "..", "packages")  // Write directly to packages
    : path.join(__dirname, "generated");       // Write to generated folder (default)

  try {
    const generator = new CommandGenerator(specPath, templateDir, outputDir);
    
    if (isDirect) {
      console.log("⚠️  DIRECT MODE: Writing directly to packages directory");
      console.log("📁 Output directory:", outputDir);
      console.log("");
    }
    
    generator.generateAll();
  } catch (error) {
    console.error("❌ Error during code generation:", error);
    process.exit(1);
  }
}

// Made with Bob
