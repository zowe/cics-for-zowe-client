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

import esStrings from "../../../src/-strings-/es";

describe("Spanish Strings (es.ts)", () => {
  describe("DEFINE", () => {
    it("should have DEFINE section with Spanish translations", () => {
      expect(esStrings.DEFINE).toBeDefined();
      expect(esStrings.DEFINE.SUMMARY).toBe("Definir nuevos recursos en CICS a través de IBM CMCI");
      expect(esStrings.DEFINE.DESCRIPTION).toBe("Definir nuevos recursos (por ejemplo, programas) en CICS a través de CMCI.");
    });

    it("should have PROGRAM resource translations", () => {
      expect(esStrings.DEFINE.RESOURCES.PROGRAM).toBeDefined();
      expect(esStrings.DEFINE.RESOURCES.PROGRAM.DESCRIPTION).toBe("Definir un nuevo programa en CICS a través de CMCI");
    });

    it("should have PROGRAM positional parameters in Spanish", () => {
      const positionals = esStrings.DEFINE.RESOURCES.PROGRAM.POSITIONALS;
      expect(positionals.PROGRAMNAME).toContain("nombre the programa");
      expect(positionals.CSDGROUP).toContain("nombre del grupo CSD");
    });

    it("should have PROGRAM options in Spanish", () => {
      const options = esStrings.DEFINE.RESOURCES.PROGRAM.OPTIONS;
      expect(options.REGIONNAME).toContain("región CICS");
      expect(options.CICSPLEX).toContain("CICS Plex");
    });

    it("should have PROGRAM success message in Spanish", () => {
      const messages = esStrings.DEFINE.RESOURCES.PROGRAM.MESSAGES;
      expect(messages.SUCCESS).toBe("La definición del programa '%s' fue exitosa.");
    });

    it("should export a valid object structure", () => {
      expect(typeof esStrings).toBe("object");
      expect(esStrings).not.toBeNull();
    });

    it("should have nested structure matching English version", () => {
      // Verify the structure matches the expected hierarchy
      expect(esStrings.DEFINE.RESOURCES.PROGRAM.POSITIONALS).toHaveProperty("PROGRAMNAME");
      expect(esStrings.DEFINE.RESOURCES.PROGRAM.POSITIONALS).toHaveProperty("CSDGROUP");
      expect(esStrings.DEFINE.RESOURCES.PROGRAM.OPTIONS).toHaveProperty("REGIONNAME");
      expect(esStrings.DEFINE.RESOURCES.PROGRAM.OPTIONS).toHaveProperty("CICSPLEX");
      expect(esStrings.DEFINE.RESOURCES.PROGRAM.MESSAGES).toHaveProperty("SUCCESS");
    });
  });
});
