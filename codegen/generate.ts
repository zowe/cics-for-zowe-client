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
  cliName?: string;
  cliDir?: string;
  cliClass?: string;
  cliAliases?: string[];
  cliPositionalName?: string;
  useSharedHandler?: boolean;
  humanNameSingular: string;
  humanNamePlural?: string;
  primaryKey: string;
  maxPrimaryKeyLength?: number;
  snakeKey?: string;
  constantName?: string;
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
  cliName?: string;
  cliAliases?: string[];
  type: string;
  defaultValue?: string | number | boolean;
  allowableValues?: string[];
  caseSensitive?: boolean;
  description?: string;
  required?: boolean;
  isPositional?: boolean;
}

interface UpdateAttribute {
  field: string;
  value: string;
}

interface ActionReference {
  identifier: ActionIdentifier;
  options?: (string | OptionDefinition)[];
  updateAttribute?: UpdateAttribute;
  noCicsPlex?: boolean;
  sdkFunction?: string;
  urimapVariant?: string;
  extraPositionals?: string[];
  webserviceAction?: boolean;
  getAction?: boolean;
}

interface ActionDefinition {
  identifier: ActionIdentifier;
  options?: (string | OptionDefinition)[];
  updateAttribute?: UpdateAttribute;
  noCicsPlex?: boolean;
  sdkFunction?: string;
  urimapVariant?: string;
  extraPositionals?: string[];
  webserviceAction?: boolean;
  getAction?: boolean;
}

interface GroupMeta {
  name: string;
  aliases: string[];
  summary: string;
  description: string;
  stringsKey: string;
}

interface Resource {
  identifier: ResourceIdentifier;
  actions: (string | ActionReference)[];
  additionalOptions?: string[];
}

interface ResourceSpecification {
  resources: Record<string, Resource>;
  actions?: Record<string, ActionDefinition>;
  options?: Record<string, OptionDefinition>;
  groupMeta?: Record<string, GroupMeta>;
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
  testFileSlug: string;
  maxNameLength?: number;
  
  // Resolved actions
  actions: DerivedAction[];
  
  // Aggregated options from all actions (for Parms interface)
  allOptions: DerivedOption[];

  // True if any action on this resource uses attribute-update style
  hasAttributeUpdate: boolean;
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

  // Attribute-update style (e.g. URIMap ENABLE/DISABLE sets ENABLESTATUS rather than calling a CMCI action)
  useAttributeUpdate: boolean;
  attributeField?: string;
  attributeValue?: string;
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
Handlebars.registerHelper("kebabCase", (str: string) => {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
});
Handlebars.registerHelper("lowerFirst", (str: string) => str ? str.charAt(0).toLowerCase() + str.slice(1) : "");
Handlebars.registerHelper("removePrefix", (str: string, prefix: string) => {
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
});
Handlebars.registerHelper("add", (a: number, b: number) => a + b);
Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("dollarBrace", () => "${");
Handlebars.registerHelper("json", (value: unknown) => JSON.stringify(value));

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

    const derivedResources = this.deriveResources();
    this.generateSDK(derivedResources);
    this.generateTests(derivedResources);
    this.generateCLI(derivedResources);

    console.log("\n🎉 Code generation complete!");
  }

  /**
   * Generate SDK code
   */
  private generateSDK(derivedResources: DerivedResource[]): void {
    console.log("📦 Generating SDK layer...");
    
    const sdkOutputDir = path.join(this.outputDir, "sdk", "src", "resources");
    this.ensureDir(sdkOutputDir);

    
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
      // Skip generating a parms file for resources with no additional options;
      // those resources use IResourceParms directly.
      if (resource.allOptions.length === 0) {
        continue;
      }

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
   * Generate ALL CLI files from the spec — definitions, handlers, i18n strings,
   * and unit tests. No file under packages/cli/src/ or packages/cli/__tests__/ is
   * manually maintained after this runs.
   *
   * Pattern A (CICSLocalFile): one shared handler, one definition per action group.
   * Pattern B (all other resources): one handler + one definition per (resource, action-group).
   *
   * Special cases handled:
   *   - urimapVariant: "server"|"client"|"pipeline" → sub-command name like "urimap-server"
   *   - webserviceAction: custom wsbind path-fix logic
   *   - getAction: outputFormatOptions + format.output response
   *   - noCicsPlex: omit cics-plex option
   *   - sdkFunction override: e.g. REFRESH uses programNewcopy
   *   - extraPositionals: additional positional args (csdGroup, programName, bundleDir)
   */
  private generateCLI(derivedResources: DerivedResource[]): void {
    console.log("📦 Generating CLI layer...");

    const cliSrcDir = path.join(this.outputDir, "cli", "src");
    const cliTestDir = path.join(this.outputDir, "cli", "__tests__", "__unit__");

    // ── 1. Shared LocalFileHandler (Pattern A) ──────────────────────────────
    const localFileResource = derivedResources.find(r => r.name === "CICSLocalFile");
    if (localFileResource) {
      const busyActionNames = localFileResource.actions
        .filter(a => a.options.some(o => o.name === "busy"))
        .map(a => a.name);
      this.generateFromTemplate(
        "cli/localfile.handler.hbs",
        path.join(cliSrcDir, "common", "LocalFileHandler.ts"),
        { actions: localFileResource.actions, busyActionNames }
      );
      console.log("  ✓ cli/src/common/LocalFileHandler.ts");
    }

    // ── 2. i18n strings ─────────────────────────────────────────────────────
    this.generateFromTemplate("cli/en.ts.hbs", path.join(cliSrcDir, "-strings-", "en.ts"), {});
    console.log("  ✓ cli/src/-strings-/en.ts");

    // ── 3. Build a per-group map: group → [CLIResourceEntry] ─────────────────
    // Each entry carries everything a template needs to render one resource cmd.
    interface CLIResourceEntry {
      resourceName: string;
      cliName: string;           // e.g. "CICSLocalFile", "program", "urimap-server"
      cliAliases: string[];
      cliPositionalName: string; // camelCase positional arg
      resourceClass: string;     // PascalCase, e.g. "LocalFile", "UrimapServer"
      resourceDir: string;       // subdir inside group, e.g. "localFile", "urimap-server"
      definitionExport: string;  // e.g. "LocalFileDefinition"
      definitionFile: string;    // filename without .ts, e.g. "LocalFile.definition"
      useSharedHandler: boolean;
      sdkFunction: string;
      stringsGroupKey: string;   // e.g. "ENABLE"
      stringsResourceKey: string;// e.g. "CICSLOCALFILE", "URIMAP"
      stringsImportPath: string; // relative from handler/definition file
      cicsBaseHandlerImport: string;
      actionVerb: string;
      humanName: string;
      hasBusyOption: boolean;
      noCicsPlex: boolean;
      isWebserviceAction: boolean;
      isGetAction: boolean;
      actionOptions: CLIOption[];
      extraPositionals: CLIPositional[];
      sdkCallParams: { name: string; argName: string }[];
      exampleOptions: string;
      // for group.definition context
      actionGroup: string;
    }

    interface CLIOption {
      name: string;              // sdk param name
      cliOptionName: string;     // kebab-case CLI option name
      cliAliases: string[];
      stringsKey: string;        // UPPERCASE key in strings.OPTIONS
      type: string;
      defaultValue?: string | number | boolean;
      allowableValues?: string[];
      caseSensitive?: boolean;
      required?: boolean;
      argName: string;           // camelCase for params.arguments
    }

    interface CLIPositional {
      name: string;              // camelCase argument name
      stringsKey: string;        // UPPERCASE strings key
    }

    const groupMap = new Map<string, CLIResourceEntry[]>();

    // Iterate over RAW spec resources (not derived) to access urimapVariant and other spec-only fields
    for (const [resourceName, specResource] of Object.entries(this.spec.resources)) {
      // Find the corresponding derived resource for SDK-derived properties
      const resource = derivedResources.find(r => r.name === resourceName)!;
      if (!resource) continue;

      const rid = specResource.identifier;

      // Skip resources that have no CLI metadata — they are SDK-only for now.
      // A resource opts into CLI generation by setting cliName or useSharedHandler.
      if (!rid.cliName && !rid.useSharedHandler) continue;

      const isShared = !!rid.useSharedHandler;
      const cliPositionalName = rid.cliPositionalName ?? this.camelCase(rid.primaryKey);

      for (const rawAction of specResource.actions) {
        // Resolve action definition
        let actionDef: ActionDefinition;
        if (typeof rawAction === "string") {
          if (!this.spec.actions?.[rawAction]) {
            throw new Error(`Action "${rawAction}" not found in spec.actions`);
          }
          actionDef = this.spec.actions[rawAction];
        } else {
          actionDef = rawAction as ActionDefinition;
        }

        const group = actionDef.identifier.group;
        const groupMeta = this.spec.groupMeta?.[group];
        const stringsGroupKey = groupMeta?.stringsKey ?? group.replace(/-/g, "").toUpperCase();

        // Determine CLI command name (may differ for urimap variants)
        const variant = actionDef.urimapVariant;
        const baseCliName = rid.cliName ?? rid.humanNameSingular.toLowerCase();
        const cliName = variant ? `${baseCliName}-${variant}` : baseCliName;

        // PascalCase resource class name — use spec override if present
        const resourceClass = rid.cliClass
          ? (variant ? this.toPascalCase(`${rid.cliClass} ${variant}`) : rid.cliClass)
          : this.toPascalCase(cliName.replace(/-/g, " "));

        // Sub-directory inside the group dir — use spec override if present
        const resourceDir = rid.cliDir
          ? (variant ? `${rid.cliDir}-${variant}` : rid.cliDir)
          : cliName;

        // strings resource key: UPPERCASE, no dashes
        // For shared handler, it's the resource name without CICS prefix
        const stringsResourceKey = isShared
          ? resource.name.replace(/^CICS/, "").toUpperCase()
          : (variant
              ? `${baseCliName.replace(/-/g, "")}${variant}`.toUpperCase()
              : baseCliName.replace(/-/g, "").toUpperCase());

        // Import depth: from src/<group>/<resourceDir>/ → src/-strings-/en
        const stringsImportPath = "../../-strings-/en";
        const cicsBaseHandlerImport = "../../CicsBaseHandler";

        // Resolve SDK function name
        let sdkFunction: string;
        if (actionDef.sdkFunction) {
          sdkFunction = actionDef.sdkFunction;
        } else {
          const actionLower = actionDef.identifier.name.toLowerCase().replace(/_/g, "");
          sdkFunction = `${actionLower}${resource.sdkFileName}`;
          if (variant) {
            sdkFunction = `${actionLower}${resource.sdkFileName}${this.capitalize(variant)}`;
          }
        }

        // Resolve options (non-positional, non-busy CLI options)
        const actionOptions: CLIOption[] = [];
        const rawOptions = actionDef.options ?? [];
        for (const rawOpt of rawOptions) {
          let optDef: OptionDefinition;
          if (typeof rawOpt === "string") {
            if (!this.spec.options?.[rawOpt]) continue;
            optDef = this.spec.options[rawOpt];
          } else {
            optDef = rawOpt;
          }
          if (optDef.isPositional) continue; // handled separately as extra positionals
          const cliOptName = optDef.cliName ?? this.toKebabCase(optDef.name);
          const cliOptAliases = optDef.cliAliases ?? [];
          actionOptions.push({
            name: optDef.name,
            cliOptionName: cliOptName,
            cliAliases: cliOptAliases,
            stringsKey: (optDef.cliName ?? optDef.name).replace(/-/g, "").toUpperCase(),
            type: optDef.type,
            defaultValue: optDef.defaultValue,
            allowableValues: optDef.allowableValues,
            caseSensitive: optDef.caseSensitive,
            required: optDef.required,
            argName: this.camelCase(cliOptName),
          });
        }

        // Resolve extra positionals
        const extraPositionals: CLIPositional[] = [];
        for (const posRef of (actionDef.extraPositionals ?? [])) {
          if (!this.spec.options?.[posRef]) continue;
          const posDef = this.spec.options[posRef];
          extraPositionals.push({
            name: posDef.name,
            stringsKey: posDef.name.toUpperCase(),
          });
        }

        // Build SDK call params list (for the handler template)
        const sdkCallParams: { name: string; argName: string }[] = [];
        // Extra positionals → SDK params
        for (const ep of extraPositionals) {
          sdkCallParams.push({ name: ep.name, argName: ep.name });
        }
        // Action options → SDK params
        for (const opt of actionOptions) {
          sdkCallParams.push({ name: opt.name, argName: opt.argName });
        }

        // Example options string
        const mainArg = cliPositionalName === "name" ? "MYGRP" :
          cliPositionalName === "resourceName" ? "CICSProgram" :
          cliPositionalName.includes("urimap") ? "URIMAPA" :
          cliPositionalName.includes("bundle") ? "BND123" :
          cliPositionalName.includes("webservice") ? "WEBSVCA" :
          cliPositionalName.includes("transaction") ? "TRN1" :
          cliPositionalName.includes("program") ? "PGM123" :
          cliPositionalName.includes("file") ? "TESTFILE" :
          "MYRESOURCE";
        const hasBusy = rawOptions.includes("BUSY") || (typeof rawOptions[0] !== "string" && (rawOptions as OptionDefinition[]).some(o => o.name === "busy"));
        const exampleOptions = `${mainArg} --region-name MYREGION`;

        const entry: CLIResourceEntry = {
          resourceName: resource.name,
          cliName,
          cliAliases: rid.cliAliases ?? [],
          cliPositionalName,
          resourceClass,
          resourceDir,
          definitionExport: `${resourceClass}Definition`,
          definitionFile: `${resourceClass}.definition`,
          useSharedHandler: isShared,
          sdkFunction,
          stringsGroupKey,
          stringsResourceKey,
          stringsImportPath,
          cicsBaseHandlerImport,
          actionVerb: actionDef.identifier.verb,
          humanName: resource.humanName,
          hasBusyOption: !!hasBusy,
          noCicsPlex: !!actionDef.noCicsPlex,
          isWebserviceAction: !!actionDef.webserviceAction,
          isGetAction: !!actionDef.getAction,
          actionOptions,
          extraPositionals,
          sdkCallParams,
          exampleOptions,
          actionGroup: group,
        };

        if (!groupMap.has(group)) groupMap.set(group, []);
        groupMap.get(group)!.push(entry);
      }
    }

    // ── 4. For each action group: render definitions, handlers, group def ─────
    for (const [group, entries] of groupMap.entries()) {
      const groupMeta = this.spec.groupMeta?.[group];
      const stringsKey = groupMeta?.stringsKey ?? group.replace(/-/g, "").toUpperCase();
      const groupAliases = groupMeta?.aliases ?? [];
      const capitalize = this.capitalize.bind(this);
      const groupDirName = group;

      // Build imports array for group definition template
      const imports = entries.map(e => ({
        exportName: e.definitionExport,
        dir: e.resourceDir,
        file: e.definitionFile,
      }));

      // Group definition file
      const groupDefFile = path.join(
        cliSrcDir, groupDirName,
        `${this.toPascalCase(group.replace(/-/g, " "))}.definition.ts`
      );
      this.generateFromTemplate("cli/group.definition.hbs", groupDefFile, {
        groupName: group,
        aliases: groupAliases,
        stringsKey,
        imports,
      });
      console.log(`  ✓ cli/src/${group}/${path.basename(groupDefFile)}`);

      // Group definition unit test
      const groupTestDir = path.join(cliTestDir, groupDirName);
      this.ensureDir(groupTestDir);
      const groupTestFile = path.join(groupTestDir,
        `${this.toPascalCase(group.replace(/-/g, " "))}.definition.unit.test.ts`);
      this.generateFromTemplate("tests/cli.group.definition.unit.test.hbs", groupTestFile, {
        actionGroup: group,
        capitalize,
        resourcesCount: entries.length,
        stringsKey,
        groupClassName: this.toPascalCase(group.replace(/-/g, " ")),
      });
      console.log(`  ✓ cli/__tests__/__unit__/${group}/${path.basename(groupTestFile)}`);

      // Per-resource files
      for (const entry of entries) {
        const resDir = path.join(cliSrcDir, groupDirName, entry.resourceDir);
        this.ensureDir(resDir);
        const resTestDir = path.join(cliTestDir, groupDirName, entry.resourceDir);
        this.ensureDir(resTestDir);

        if (entry.useSharedHandler) {
          // Pattern A: only render the definition file; handler already generated
          this.generateFromTemplate("cli/localfile.definition.hbs", path.join(resDir, `${entry.resourceClass}.definition.ts`), {
            ...entry,
            actionGroup: group,
          });
          console.log(`  ✓ cli/src/${group}/${entry.resourceDir}/${entry.resourceClass}.definition.ts`);

          // Handler unit test (shared handler test)
          const localFileDerivedAction = localFileResource?.actions.find(a => a.identifier.group === group);
          if (localFileDerivedAction) {
            this.generateFromTemplate("tests/cli.localfile.handler.unit.test.hbs",
              path.join(resTestDir, `${entry.resourceClass}.handler.unit.test.ts`),
              {
                ...entry,
                actionGroup: group,
                sdkFunction: localFileDerivedAction.sdkFunction,
                hasBusyOption: localFileDerivedAction.options.some(o => o.name === "busy"),
              });
            console.log(`  ✓ cli/__tests__/__unit__/${group}/${entry.resourceDir}/${entry.resourceClass}.handler.unit.test.ts`);
          }
        } else {
          // Pattern B: render both definition and handler
          this.generateFromTemplate("cli/resource.definition.hbs",
            path.join(resDir, `${entry.resourceClass}.definition.ts`), entry);
          console.log(`  ✓ cli/src/${group}/${entry.resourceDir}/${entry.resourceClass}.definition.ts`);

          this.generateFromTemplate("cli/resource.handler.hbs",
            path.join(resDir, `${entry.resourceClass}.handler.ts`), entry);
          console.log(`  ✓ cli/src/${group}/${entry.resourceDir}/${entry.resourceClass}.handler.ts`);
        }
      }
    }

    console.log("✅ CLI layer generated");
  }

  /** Convert a space-separated or camelCase string to PascalCase */
  private toPascalCase(str: string): string {
    return str
      .split(/[\s-_]+/)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join("")
      .replace(/^(.)/, c => c.toUpperCase());
  }

  /** Convert a camelCase or PascalCase string to kebab-case */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .toLowerCase();
  }

  /** camelCase from any string */
  private camelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[-\s_]([a-z])/g, (_, c) => c.toUpperCase());
  }

  /** Capitalise the first letter of a string */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /** Render a template and return the result as a string without writing to disk */
  private renderTemplate(templatePath: string, context: unknown): string {
    const fullTemplatePath = path.join(this.templateDir, templatePath);
    const templateContent = fs.readFileSync(fullTemplatePath, "utf-8");
    const template = Handlebars.compile(templateContent);
    return template(context);
  }

  /**
   * Generate unit tests
   */
  private generateTests(derivedResources: DerivedResource[]): void {
    console.log("📦 Generating SDK unit tests...");
    this.generatedTestFiles = [];
    
    const sdkTestOutputDir = path.join(this.outputDir, "sdk", "__tests__", "__unit__");
    this.ensureDir(sdkTestOutputDir);

    for (const resource of derivedResources) {
      for (const action of resource.actions) {
        const context = {
          ...resource,
          ...action,
          actionName: action.name,
          hasRegionName: true,
          hasValidation: action.hasValidation,
          hasParameters: action.hasParameters,
          testFileName: `${action.identifier.group.charAt(0).toUpperCase() + action.identifier.group.slice(1)}.${resource.testFileSlug}.unit.test.ts`,
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
    
    // Generate constants - convert camelCase/PascalCase to SCREAMING_SNAKE_CASE.
    // snakeKey in the spec overrides the regex for resources with non-trivial capitalisation
    // (e.g. CICSURIMap → URI_MAP rather than the naive U_R_I_M_A_P).
    const nameWithoutCICS = resourceName.replace(/^CICS/, "");
    const resourceTypeUpper = resource.identifier.snakeKey
      ?? nameWithoutCICS.replace(/([A-Z])/g, "_$1").toUpperCase().replace(/^_/, "");

    // constantName allows the spec to override the full constant name (e.g. "CICS_URIMAP")
    // when the resource predates the CICS_CMCI_ naming convention.
    const sdkResourceType = resource.identifier.constantName ?? `CICS_CMCI_${resourceTypeUpper}`;
    
    const parmsInterface = `I${sdkFileName}Parms`;
    // primaryKey is used as-is in criteria (IBM docs key field name, e.g. "file", "program", "NAME")
    const criteriaField = resource.identifier.primaryKey;

    // Use resourceTypeUpper consistently for all criteria field constants
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

    // Collect all unique options from all actions for the Parms interface
    const allOptionsMap = new Map<string, DerivedOption>();
    for (const action of derivedActions) {
      for (const option of action.options) {
        // Use option name as key to ensure uniqueness
        if (!allOptionsMap.has(option.name)) {
          allOptionsMap.set(option.name, option);
        }
      }
    }
    
    // Add additional options from resource definition
    if (resource.additionalOptions) {
      for (const optionRef of resource.additionalOptions) {
        if (this.spec.options?.[optionRef]) {
          const optionDef = this.spec.options[optionRef];
          const derivedOption: DerivedOption = {
            ...optionDef,
            sdkParamName: optionDef.name,
            constantReference: optionDef.allowableValues
              ? `CICS_CMCI_${resourceTypeUpper}_${optionDef.name.toUpperCase()}_VALUES`
              : undefined,
          };
          if (!allOptionsMap.has(optionDef.name)) {
            allOptionsMap.set(optionDef.name, derivedOption);
          }
        }
      }
    }
    
    const allOptions = Array.from(allOptionsMap.values());

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
      testFileSlug: resource.identifier.humanNameSingular.includes(" ")
        ? resource.identifier.humanNameSingular.replace(/\s+/g, "").charAt(0).toLowerCase() +
          resource.identifier.humanNameSingular.replace(/\s+/g, "").slice(1)
        : resource.identifier.humanNameSingular.toLowerCase(),
      maxNameLength: resource.identifier.maxPrimaryKeyLength,
      actions: derivedActions,
      allOptions,
      hasAttributeUpdate: derivedActions.some(a => a.useAttributeUpdate),
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

    const updateAttribute = actionDef.updateAttribute;

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
      useAttributeUpdate: !!updateAttribute,
      attributeField: updateAttribute?.field,
      attributeValue: updateAttribute?.value,
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
