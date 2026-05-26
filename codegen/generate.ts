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
  sdkFileName?: string;
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
      // Check if this group has LocalFile resources
      const hasLocalFileResource = commandGroup.resources.some(
        resource => resource.sdkFileName && resource.sdkFileName.toLowerCase() === 'localfile'
      );

      // Generate group definition
      // If the group has LocalFile resources, place the group definition in the localfile subdirectory
      if (hasLocalFileResource) {
        const groupFileName = `${commandGroup.group.charAt(0).toUpperCase() + commandGroup.group.slice(1)}.definition.ts`;
        const groupFilePath = path.join(cliOutputDir, commandGroup.group, 'localfile', groupFileName);
        
        this.generateFromTemplate(
          "cli/group.definition.localfile.hbs",
          groupFilePath,
          commandGroup
        );
      } else {
        this.generateFromTemplate(
          "cli/group.definition.hbs",
          path.join(cliOutputDir, commandGroup.group, `${commandGroup.group.charAt(0).toUpperCase() + commandGroup.group.slice(1)}.definition.ts`),
          commandGroup
        );
      }

      // Generate resource definitions for all resources
      // For resources using shared handlers, generate files like OpenLocalFile.ts, CloseLocalFile.ts
      for (const resource of commandGroup.resources) {
        const action = resource.actions[0]; // Get first action for this group
        
        const context = {
          ...resource,
          ...action,
          group: commandGroup.group,
          resourceName: resource.name,
          hasConstantReference: action.options.some(opt => opt.constantReference),
        };

        // Use naming convention: {Capitalize(group)}{sdkFileName or name without CICS prefix}.ts
        // e.g., OpenLocalFile.ts, CloseLocalFile.ts, EnableLocalFile.ts
        const fileName = resource.sdkFileName
          ? `${commandGroup.group.charAt(0).toUpperCase() + commandGroup.group.slice(1)}${resource.sdkFileName}.ts`
          : `${commandGroup.group.charAt(0).toUpperCase() + commandGroup.group.slice(1)}${resource.name.replace(/^CICS/, '')}.ts`;

        // Determine subdirectory based on resource type
        // For LocalFile resources, use a 'localfile' subdirectory
        const subdirectory = resource.sdkFileName && resource.sdkFileName.toLowerCase() === 'localfile'
          ? 'localfile'
          : '';
        
        const outputPath = subdirectory
          ? path.join(cliOutputDir, commandGroup.group, subdirectory, fileName)
          : path.join(cliOutputDir, commandGroup.group, fileName);

        this.generateFromTemplate(
          "cli/resource.definition.hbs",
          outputPath,
          context
        );
      }

      // Skip generating separate strings files - strings are managed in the main en.ts file
      // The updateMainStringsFile method handles adding resource strings to the main file
    }

    // Generate/update main en.ts strings file
    if (isDirect) {
      this.updateMainStringsFile(cliOutputDir);
    }

    // Generate shared handlers for resources that use the same handler across multiple groups
    this.generateSharedHandlers(cliOutputDir);

    console.log("✅ CLI layer generated");
  }

  /**
   * Generate shared handler files for resources that appear in multiple command groups
   */
  private generateSharedHandlers(cliOutputDir: string): void {
    // Group resources by handler name
    const handlerMap = new Map<string, { resource: Resource; actions: Action[] }>();
    
    for (const commandGroup of this.spec.commands) {
      for (const resource of commandGroup.resources) {
        const action = resource.actions[0];
        const handlerName = action.cliHandler;
        
        if (!handlerMap.has(handlerName)) {
          handlerMap.set(handlerName, { resource, actions: [] });
        }
        handlerMap.get(handlerName)!.actions.push(action);
      }
    }

    // Generate handler for each unique handler name
    for (const [handlerName, { resource, actions }] of handlerMap) {
      // Only generate if there are multiple actions (shared handler)
      if (actions.length > 1) {
        const handlerFilePath = path.join(cliOutputDir, "common", `${handlerName}.ts`);
        
        // Skip if handler already exists (don't overwrite manually maintained handlers)
        if (this.outputDir.endsWith("packages") && fs.existsSync(handlerFilePath)) {
          console.log(`  ℹ️  cli/src/common/${handlerName}.ts already exists, skipping`);
          continue;
        }
        
        const context = {
          handlerName,
          resourceName: resource.name,
          humanName: resource.humanName,
          humanNameLower: resource.humanNameLower,
          parmsInterface: resource.parmsInterface,
          actions,
          hasCloseAction: actions.some(a => a.name === "CLOSE"),
        };

        this.generateFromTemplate(
          "cli/handler.hbs",
          handlerFilePath,
          context
        );
        
        console.log(`  ✓ cli/src/common/${handlerName}.ts`);
      }
    }
  }

  /**
   * Update the main en.ts strings file with generated strings
   */
  private updateMainStringsFile(cliOutputDir: string): void {
    const mainStringsPath = path.join(cliOutputDir, "-strings-", "en.ts");
    
    if (!fs.existsSync(mainStringsPath)) {
      console.log("⚠️  Main strings file not found, skipping merge");
      return;
    }

    let mainContent = fs.readFileSync(mainStringsPath, "utf-8");
    
    // Process each command group
    for (const commandGroup of this.spec.commands) {
      const groupUpper = commandGroup.group.toUpperCase();
      
      // Check if this group already exists in the main file
      const groupRegex = new RegExp(`\\s+${groupUpper}:\\s*\\{`, "g");
      
      if (!groupRegex.test(mainContent)) {
        console.log(`  ⚠️  Group ${groupUpper} not found in main strings file, skipping`);
        continue;
      }

      // Process each resource in the group
      for (const resource of commandGroup.resources) {
        const action = resource.actions[0];
        const resourceKey = resource.name.replace(/^CICS/, "").toUpperCase();
        
        // Build the resource strings object
        const resourceStrings = this.buildResourceStrings(resource, action);
        
        // Find the RESOURCES section for this group
        const resourcesRegex = new RegExp(
          `(\\s+${groupUpper}:\\s*\\{[\\s\\S]*?RESOURCES:\\s*\\{)([\\s\\S]*?)(\\n\\s+\\},)`,
          "m"
        );
        
        const match = mainContent.match(resourcesRegex);
        if (!match) {
          console.log(`  ⚠️  RESOURCES section not found for ${groupUpper}, skipping`);
          continue;
        }

        const [fullMatch, before, resourcesContent, closingBrace] = match;
        
        // Check if this resource already exists
        const resourceKeyRegex = new RegExp(`\\s+${resourceKey}:\\s*\\{`, "g");
        
        if (resourceKeyRegex.test(resourcesContent)) {
          console.log(`  ℹ️  ${groupUpper}.RESOURCES.${resourceKey} already exists, skipping`);
          continue;
        }

        // Insert the new resource before the closing brace of RESOURCES
        const updatedContent = before + resourcesContent + resourceStrings + closingBrace;
        mainContent = mainContent.replace(fullMatch, updatedContent);
        
        console.log(`  ✓ Added ${groupUpper}.RESOURCES.${resourceKey}`);
        
        // Also update the group description to include this resource type if it's a new one
        const descPattern = new RegExp(
          `(${groupUpper}:\\s*\\{[\\s\\S]*?DESCRIPTION:\\s*"[^"]*\\(for example,\\s*)([^)]*)(\\)[^"]*")`,
          "m"
        );
        const descMatch = mainContent.match(descPattern);
        if (descMatch) {
          const [, prefix, examples, suffix] = descMatch;
          const humanNameLower = resource.humanNameLower + "s";
          if (!examples.includes(humanNameLower)) {
            const updatedExamples = examples.trim()
              ? `${examples.trim()}, ${humanNameLower}`
              : humanNameLower;
            mainContent = mainContent.replace(
              descMatch[0],
              prefix + updatedExamples + suffix
            );
          }
        }
      }
    }

    // Write the updated content back
    fs.writeFileSync(mainStringsPath, mainContent, "utf-8");
    console.log("  ✓ Updated main strings file: -strings-/en.ts");
  }

  /**
   * Build resource strings object as a formatted string
   */
  private buildResourceStrings(resource: Resource, action: Action): string {
    const resourceKey = resource.name.replace(/^CICS/, "").toUpperCase();
    const lines: string[] = [];
    
    lines.push(`      ${resourceKey}: {`);
    lines.push(`        DESCRIPTION: "${action.actionVerb.charAt(0).toUpperCase() + action.actionVerb.slice(1)} a ${resource.humanNameLower} in CICS.",`);
    
    // Positionals
    lines.push(`        POSITIONALS: {`);
    for (const pos of action.positionals) {
      lines.push(`          ${pos.name.toUpperCase()}: "${pos.description}",`);
    }
    lines.push(`        },`);
    
    // Options
    lines.push(`        OPTIONS: {`);
    for (const opt of action.options) {
      const optKey = opt.name.replace(/-([a-z])/g, (g) => g[1].toUpperCase()).replace(/^(.)/, (g) => g.toUpperCase());
      lines.push(`          ${optKey.toUpperCase()}: "${opt.description}",`);
    }
    lines.push(`        },`);
    
    // Messages
    lines.push(`        MESSAGES: {`);
    lines.push(`          SUCCESS: "${action.messages.success}",`);
    lines.push(`          PROGRESS: "${action.messages.progress}",`);
    lines.push(`        },`);
    
    // Examples
    lines.push(`        EXAMPLES: {`);
    action.examples.forEach((ex, idx) => {
      lines.push(`          EX${idx + 1}: "${ex.description}",`);
    });
    lines.push(`        },`);
    
    lines.push(`      },`);
    
    return "\n" + lines.join("\n");
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

    // Group actions by resource to generate unified resource files
    const resourceMap = new Map<string, { resource: Resource; actions: Action[] }>();
    
    for (const commandGroup of this.spec.commands) {
      for (const resource of commandGroup.resources) {
        const resourceKey = resource.name;
        if (!resourceMap.has(resourceKey)) {
          resourceMap.set(resourceKey, { resource, actions: [] });
        }
        resourceMap.get(resourceKey)!.actions.push(...resource.actions);
      }
    }

    // Generate or update unified resource files
    for (const [resourceName, { resource, actions }] of resourceMap) {
      const fileName = `${resource.sdkFileName || resourceName}.ts`;
      const filePath = path.join(sdkOutputDir, fileName);
      
      if (isDirect && fs.existsSync(filePath)) {
        // Update existing file by adding missing functions
        this.updateSDKResourceFile(filePath, resource, actions);
      } else {
        // Generate new unified file with all actions
        const context = {
          ...resource,
          actions: actions.map(action => ({
            ...action,
            hasRegionName: action.options.some(opt => opt.sdkParamName === "regionName"),
            hasValidation: action.parameters.some(p => p.validation),
            maxLengthConstant: resource.maxNameLength ? `${resource.sdkResourceType}_MAX_LENGTH` : undefined,
            criteriaFieldConstant: `${resource.sdkResourceType}_CRITERIA_FIELD`,
          })),
        };

        this.generateFromTemplate(
          "sdk/resource.function.hbs",
          filePath,
          context
        );
      }
      
      console.log(`  ✓ sdk/src/resources/${fileName}`);
    }

    console.log("✅ SDK layer generated");
  }

  /**
   * Update existing SDK resource file by adding missing functions
   */
  private updateSDKResourceFile(filePath: string, resource: Resource, actions: Action[]): void {
    let content = fs.readFileSync(filePath, "utf-8");
    
    for (const action of actions) {
      const functionName = action.sdkFunction;
      
      // Check if function already exists
      const functionRegex = new RegExp(`export\\s+async\\s+function\\s+${functionName}\\s*\\(`, "g");
      
      if (functionRegex.test(content)) {
        console.log(`  ℹ️  Function ${functionName} already exists in ${resource.name}.ts, skipping`);
        continue;
      }

      // Generate the new function
      const newFunction = this.buildSDKFunction(resource, action);
      
      // Insert before the last closing brace or at the end
      const lastExportIndex = content.lastIndexOf("export async function");
      if (lastExportIndex !== -1) {
        // Find the end of the last function
        let insertIndex = content.length - 1;
        // Insert after the last function
        content = content.trimEnd() + "\n\n" + newFunction;
      } else {
        // No functions yet, add after imports
        const lastImportIndex = content.lastIndexOf("import");
        if (lastImportIndex !== -1) {
          const nextLineIndex = content.indexOf("\n", lastImportIndex);
          content = content.slice(0, nextLineIndex + 1) + "\n" + newFunction + content.slice(nextLineIndex + 1);
        } else {
          content += "\n" + newFunction;
        }
      }
      
      console.log(`  ✓ Added function ${functionName} to ${resource.name}.ts`);
    }
    
    fs.writeFileSync(filePath, content, "utf-8");
  }

  /**
   * Build SDK function code as a string
   */
  private buildSDKFunction(resource: Resource, action: Action): string {
    const lines: string[] = [];
    const isClose = action.name === "CLOSE";
    
    lines.push(`/**`);
    lines.push(` * ${action.actionVerb.charAt(0).toUpperCase() + action.actionVerb.slice(1)} a ${resource.humanNameLower} in CICS`);
    lines.push(` * @param {AbstractSession} session - the session to connect to CMCI with`);
    lines.push(` * @param {${resource.parmsInterface}} parms - parameters for ${action.actionVerb} the ${resource.humanNameLower}`);
    lines.push(` * @param {string} parms.name - the name of the ${resource.humanNameLower} to ${action.actionLower} (1-${resource.maxNameLength} characters)`);
    lines.push(` * @param {string} parms.regionName - the CICS region name`);
    lines.push(` * @param {string} [parms.cicsPlex] - the CICSPlex name (optional)`);
    if (isClose) {
      lines.push(` * @param {string} [parms.busy] - busy condition option: "WAIT", "NOWAIT", or "FORCE" (case-insensitive, optional, default: "WAIT")`);
    }
    lines.push(` * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response`);
    lines.push(` * @throws {ImperativeError} CICS ${resource.humanNameLower} name not defined, blank, or exceeds maximum length`);
    lines.push(` * @throws {ImperativeError} CICS region name not defined or blank`);
    if (isClose) {
      lines.push(` * @throws {ImperativeError} Invalid BUSY parameter value`);
    }
    lines.push(` * @throws {ImperativeError} CicsCmciRestClient request fails`);
    lines.push(` */`);
    lines.push(`export async function ${action.sdkFunction}(session: AbstractSession, parms: ${resource.parmsInterface}): Promise<ICMCIApiResponse> {`);
    lines.push(`  // Validate required parameters`);
    lines.push(`  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS ${resource.humanName} name", "CICS ${resource.humanNameLower} name is required");`);
    lines.push(`  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");`);
    lines.push(``);
    lines.push(`  // Validate file name length (CICS resource names are limited to ${resource.maxNameLength} characters)`);
    lines.push(`  if (parms.name.length > CicsCmciConstants.CICS_LOCAL_FILE_MAX_LENGTH) {`);
    lines.push(`    throw new ImperativeError({`);
    lines.push(`      msg: \`CICS ${resource.humanNameLower} name "\${parms.name}" exceeds maximum length of \${CicsCmciConstants.CICS_LOCAL_FILE_MAX_LENGTH} characters\`,`);
    lines.push(`    });`);
    lines.push(`  }`);
    lines.push(``);
    
    if (isClose) {
      lines.push(`  Logger.getAppLogger().debug(`);
      lines.push(`    \`Attempting to ${action.actionLower} a ${resource.humanNameLower} with the following parameters:\\n%s\`,`);
      lines.push(`    JSON.stringify(parms)`);
      lines.push(`  );`);
      lines.push(``);
      lines.push(`  // Get busy parameter value`);
      lines.push(`  const busyValue = parms.busy ? parms.busy.trim().toUpperCase() : "WAIT";`);
      lines.push(``);
      lines.push(`  // Validate busy parameter`);
      lines.push(`  if (!CicsCmciConstants.${resource.sdkResourceType}_BUSY_VALUES.includes(busyValue)) {`);
      lines.push(`    const allowedValuesStr = CicsCmciConstants.${resource.sdkResourceType}_BUSY_VALUES.join(", ");`);
      lines.push(`    throw new ImperativeError({`);
      lines.push(`      msg: \`Invalid BUSY parameter value: "\${busyValue}". Must be one of: \${allowedValuesStr}\`,`);
      lines.push(`    });`);
      lines.push(`  }`);
      lines.push(``);
      lines.push(`  // Use generic performAction utility`);
      lines.push(`  return performAction(`);
      lines.push(`    session,`);
      lines.push(`    CicsCmciConstants.${resource.sdkResourceType},`);
      lines.push(`    "${action.name}",`);
      lines.push(`    {`);
      lines.push(`      name: parms.name,`);
      lines.push(`      regionName: parms.regionName,`);
      lines.push(`      cicsPlex: parms.cicsPlex,`);
      lines.push(`    },`);
      lines.push(`    CicsCmciConstants.${resource.sdkResourceType}_CRITERIA_FIELD,`);
      lines.push(`    { name: "BUSY", value: busyValue }`);
      lines.push(`  );`);
    } else {
      lines.push(`  Logger.getAppLogger().debug(`);
      lines.push(`    \`Attempting to ${action.actionLower} a ${resource.humanNameLower} with the following parameters:\\n%s\`,`);
      lines.push(`    JSON.stringify(parms)`);
      lines.push(`  );`);
      lines.push(``);
      lines.push(`  // Use generic performAction utility (no additional parameters needed for ${action.name})`);
      lines.push(`  return performAction(`);
      lines.push(`    session,`);
      lines.push(`    CicsCmciConstants.${resource.sdkResourceType},`);
      lines.push(`    "${action.name}",`);
      lines.push(`    {`);
      lines.push(`      name: parms.name,`);
      lines.push(`      regionName: parms.regionName,`);
      lines.push(`      cicsPlex: parms.cicsPlex,`);
      lines.push(`    },`);
      lines.push(`    CicsCmciConstants.CICS_LOCAL_FILE_CRITERIA_FIELD`);
      lines.push(`  );`);
    }
    lines.push(`}`);
    
    return lines.join("\n");
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

    // Group actions by resource, using sdkFileName as the key
    const resourceMap = new Map<string, { resource: Resource; actions: Action[] }>();
    
    for (const commandGroup of this.spec.commands) {
      for (const resource of commandGroup.resources) {
        // Use sdkFileName if available, otherwise fall back to resource name
        const handlerKey = resource.sdkFileName || resource.name;
        
        if (!resourceMap.has(handlerKey)) {
          resourceMap.set(handlerKey, { resource, actions: [] });
        }
        resourceMap.get(handlerKey)!.actions.push(...resource.actions);
      }
    }

    // Generate or update handler for each resource
    for (const [handlerKey, { resource, actions }] of resourceMap) {
      const context = {
        resourceName: resource.name,
        handlerFileName: handlerKey, // Use sdkFileName for the file name
        humanName: resource.humanName,
        humanNameLower: resource.humanNameLower,
        humanNamePlural: resource.humanNameLower + "s",
        parmsInterface: resource.parmsInterface,
        criteriaField: resource.criteriaField,
        actions,
      };

      const handlerFilePath = path.join(vsceOutputDir, `${handlerKey}CommandHandler.ts`);
      
      // Check if file exists and update it, otherwise create new
      if (isDirect && fs.existsSync(handlerFilePath)) {
        this.updateVSCEHandlerFile(handlerFilePath, resource, actions);
      } else {
        this.generateFromTemplate(
          "vsce/command.handler.hbs",
          handlerFilePath,
          context
        );
      }
    }

    console.log("✅ VSCE layer generated");
  }

  /**
   * Update an existing VSCE handler file with new actions
   */
  private updateVSCEHandlerFile(filePath: string, resource: Resource, newActions: Action[]): void {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    
    // Find existing actions by checking if the register method exists
    const existingActions = new Set<string>();
    for (const action of newActions) {
      const actionMethodName = action.name.charAt(0).toUpperCase() + action.name.slice(1).toLowerCase();
      const methodPattern = new RegExp(`public\\s+register${actionMethodName}Command\\s*\\(`);
      if (content.match(methodPattern)) {
        existingActions.add(action.name);
      }
    }
    
    // Find actions that need to be added
    const actionsToAdd = newActions.filter(a => !existingActions.has(a.name));
    
    if (actionsToAdd.length === 0) {
      console.log(`  ℹ ${path.basename(filePath)} - already up to date`);
      return;
    }
    
    console.log(`  ↻ Updating ${path.basename(filePath)} with ${actionsToAdd.length} new action(s)`);
    
    let updatedContent = content;
    
    // Process each action to add
    for (const action of actionsToAdd) {
      const actionMethodName = action.name.charAt(0).toUpperCase() + action.name.slice(1).toLowerCase();
      
      // Add to imports if not present
      if (!updatedContent.includes(action.sdkFunction)) {
        updatedContent = updatedContent.replace(
          /import\s*{([^}]+)}\s*from\s*"@zowe\/cics-for-zowe-sdk"/s,
          (match, imports) => {
            // Clean up the imports - remove extra whitespace, empty lines, and trailing commas
            const importLines = imports
              .split("\n")
              .map((line: string) => line.trim().replace(/,+$/, ""))  // Remove trailing commas
              .filter((line: string) => line && line !== "," && !line.startsWith("type ") && !line.startsWith("ICMCIApiResponse") && !line.startsWith("ILocalFileParms") && !line.startsWith("LocalFileAction"));
            
            // Add the new import
            importLines.push(action.sdkFunction);
            
            // Re-add the type imports at the end
            const typeImports = imports
              .split("\n")
              .map((line: string) => line.trim().replace(/,+$/, ""))
              .filter((line: string) => line.startsWith("type ") || line.startsWith("ICMCIApiResponse") || line.startsWith("ILocalFileParms") || line.startsWith("LocalFileAction"));
            
            const allImports = [...importLines, ...typeImports];
            return `import {\n  ${allImports.join(",\n  ")}\n} from "@zowe/cics-for-zowe-sdk"`;
          }
        );
      }
      
      // Add case to getSdkFunction switch - fix indentation
      const switchPattern = /private getSdkFunction\(action:[^)]+\):[^{]+{\s*switch\s*\(action\)\s*{([^}]+)default:/s;
      const switchMatch = updatedContent.match(switchPattern);
      if (switchMatch) {
        const newCase = `\n      case "${action.name}":\n        return ${action.sdkFunction};`;
        updatedContent = updatedContent.replace(
          switchPattern,
          (match, cases) => match.replace(/\s*default:/, `${newCase}\n      default:`)
        );
      }
      
      // Build the register method with parameter configuration if provided
      const parameterConfig = action.vsceParameter ? `
      parameter: {
        name: "${action.vsceParameter.name}",
        prompt: l10n.t("${action.vsceParameter.prompt}"),
        choices: {
${Object.entries(action.vsceParameter.choices).map(([key, value]) => `          [l10n.t("${key}")]: "${value}",`).join("\n")}
        },
      },` : `
      // No parameter needed for ${action.actionLower}`;
      
      const registerMethod = `
  /**
   * Registers the ${action.name} ${resource.humanNameLower} command
   * @returns Disposable command registration
   */
  public register${actionMethodName}Command() {
    return this.createActionCommand({
      commandId: "${action.vsceCommandId}",
      action: "${action.name}",${parameterConfig}
    });
  }
`;
      
      // Insert the method before registerAllCommands
      const lines = updatedContent.split("\n");
      let foundIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("Registers all") && lines[i].includes(resource.humanNameLower)) {
          foundIndex = i;
          break;
        }
      }
      if (foundIndex >= 0) {
        // Insert before the comment (2 lines before the found line)
        const beforeComment = lines.slice(0, foundIndex - 2).join("\n");
        const afterComment = lines.slice(foundIndex - 2).join("\n");
        updatedContent = beforeComment + registerMethod + "\n" + afterComment;
      } else {
        console.warn(`  ⚠️  Could not find insertion point for register${actionMethodName}Command method`);
      }
      
      // Add to registerAllCommands array only once
      const registerAllArrayPattern = /(public registerAllCommands\(\)\s*{\s*return\s*\[)([^\]]+)(\];)/s;
      const arrayMatch = updatedContent.match(registerAllArrayPattern);
      if (arrayMatch && !arrayMatch[2].includes(`register${actionMethodName}Command`)) {
        updatedContent = updatedContent.replace(
          registerAllArrayPattern,
          (match, start, methods, end) => {
            // Clean up methods - remove trailing commas and extra whitespace
            const cleanMethods = methods.trim().replace(/,+\s*$/, "");
            return `${start}\n      ${cleanMethods},\n      this.register${actionMethodName}Command()\n    ${end}`;
          }
        );
      }
      
      // Use the handlerFileName (sdkFileName) instead of resource.name for consistency
      const handlerClassName = resource.sdkFileName || resource.name;
      
      // Add export function at the end of the file only if it doesn't exist
      const exportFuncName = `get${actionMethodName}${handlerClassName}Command`;
      if (!updatedContent.includes(`export function ${exportFuncName}`)) {
        const exportFunc = `
/**
 * Registers the command to ${action.actionLower} CICS ${resource.humanNameLower}s from the VS Code tree view
 * @param tree - The CICS tree to refresh after ${action.actionVerb}
 * @param treeview - The tree view containing selected nodes
 * @returns Disposable command registration
 */
export function ${exportFuncName}(tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) {
  const handler = new ${handlerClassName}CommandHandler(tree, treeview);
  return handler.register${actionMethodName}Command();
}
`;
        
        // Append at the end of the file
        updatedContent = updatedContent.trimEnd() + "\n" + exportFunc;
      }
    }
    
    fs.writeFileSync(filePath, updatedContent);
    console.log(`  ✓ Updated ${path.basename(filePath)}`);
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
