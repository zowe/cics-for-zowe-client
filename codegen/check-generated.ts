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

import * as path from "path";
import { execSync } from "child_process";

/**
 * CI Check Script: Verifies that running the generator does not change tracked files.
 *
 * This script:
 * 1. Runs the generator against the repository
 * 2. Uses git to detect whether tracked files changed
 * 3. Fails if generation leaves the working tree dirty
 *
 * Usage: npm run check:generated
 */

class GeneratedFileChecker {
  /**
   * Main check function
   */
  public async check(): Promise<boolean> {
    console.log("🔍 Checking that generated files are up to date...\n");

    this.generateInRepo();
    return this.reportResults();
  }

  /**
   * Run generator against the repository
   */
  private generateInRepo(): void {
    console.log("📦 Running generator against repository...");

    try {
      execSync("npm run generate", {
        cwd: __dirname,
        stdio: "inherit",
      });
      console.log("✅ Generation completed\n");
    } catch (error) {
      console.error("❌ Failed to generate files:", error);
      throw error;
    }
  }

  /**
   * Report git diff results
   */
  private reportResults(): boolean {
    const changedFilesOutput = execSync("git diff --name-only -- packages/sdk", {
      cwd: path.join(__dirname, ".."),
      encoding: "utf-8",
    }).trim();

    if (changedFilesOutput.length > 0) {
      const changedFiles = changedFilesOutput.split("\n").filter(Boolean);

      console.log("❌ Generated files are not up to date.\n");
      console.log("Changed files:");
      for (const file of changedFiles) {
        console.log(`  • ${file}`);
      }

      console.log("\n💡 To fix this:");
      console.log("  1. Run: cd codegen && npm run generate");
      console.log("  2. Review the changes");
      console.log("  3. Commit the regenerated files\n");
      return false;
    }

    console.log("✅ No tracked files changed after generation.\n");
    return true;
  }
}

// Main execution
if (require.main === module) {
  const checker = new GeneratedFileChecker();
  checker.check().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error("❌ Check failed with error:", error);
    process.exit(1);
  });
}