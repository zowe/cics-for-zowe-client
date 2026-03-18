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

import { isICMCIResponseErrorFeedBack, type ICMCIResponseErrorFeedBack } from "../../../src/doc/ICMCIResponseErrorFeedBack";
import { isICMCIResponseErrors, type ICMCIResponseErrors } from "../../../src/doc/ICMCIResponseErrors";

describe("CMCI Response Interface Tests", () => {
    const TEST_NUMBER = 123;

    describe("ICMCIResponseErrorFeedBack", () => {
        it("should define a valid ICMCIResponseErrorFeedBack object with all required fields", () => {
            const feedback: ICMCIResponseErrorFeedBack = {
                eibfn_alt: "EXEC CICS LINK",
                resp: "16",
                resp_alt: "INVREQ",
                resp2: "1"
            };

            expect(feedback.eibfn_alt).toBe("EXEC CICS LINK");
            expect(feedback.resp).toBe("16");
            expect(feedback.resp_alt).toBe("INVREQ");
            expect(feedback.resp2).toBe("1");
        });

        it("should define a valid ICMCIResponseErrorFeedBack object with optional fields", () => {
            const feedback: ICMCIResponseErrorFeedBack = {
                eyu_cicsname: "CICSRGN1",
                action: "CREATE",
                eibfn: "0x0602",
                eibfn_alt: "EXEC CICS LINK",
                resp: "16",
                resp_alt: "INVREQ",
                resp2: "1"
            };

            expect(feedback.eyu_cicsname).toBe("CICSRGN1");
            expect(feedback.action).toBe("CREATE");
            expect(feedback.eibfn).toBe("0x0602");
            expect(feedback.eibfn_alt).toBe("EXEC CICS LINK");
            expect(feedback.resp).toBe("16");
            expect(feedback.resp_alt).toBe("INVREQ");
            expect(feedback.resp2).toBe("1");
        });

        it("should allow undefined optional fields", () => {
            const feedback: ICMCIResponseErrorFeedBack = {
                eibfn_alt: "EXEC CICS LINK",
                resp: "16",
                resp_alt: "INVREQ",
                resp2: "1"
            };

            expect(feedback.eyu_cicsname).toBeUndefined();
            expect(feedback.action).toBeUndefined();
            expect(feedback.eibfn).toBeUndefined();
        });
    });

    describe("ICMCIResponseErrors", () => {
        it("should define a valid ICMCIResponseErrors object", () => {
            const feedback: ICMCIResponseErrorFeedBack = {
                eibfn_alt: "EXEC CICS LINK",
                resp: "16",
                resp_alt: "INVREQ",
                resp2: "1"
            };

            const errors: ICMCIResponseErrors = {
                feedback: feedback
            };

            expect(errors.feedback).toBeDefined();
            expect(errors.feedback.eibfn_alt).toBe("EXEC CICS LINK");
            expect(errors.feedback.resp).toBe("16");
            expect(errors.feedback.resp_alt).toBe("INVREQ");
            expect(errors.feedback.resp2).toBe("1");
        });

        it("should define a valid ICMCIResponseErrors object with complete feedback", () => {
            const feedback: ICMCIResponseErrorFeedBack = {
                eyu_cicsname: "CICSRGN1",
                action: "CREATE",
                eibfn: "0x0602",
                eibfn_alt: "EXEC CICS LINK",
                resp: "16",
                resp_alt: "INVREQ",
                resp2: "1"
            };

            const errors: ICMCIResponseErrors = {
                feedback: feedback
            };

            expect(errors.feedback).toBeDefined();
            expect(errors.feedback.eyu_cicsname).toBe("CICSRGN1");
            expect(errors.feedback.action).toBe("CREATE");
            expect(errors.feedback.eibfn).toBe("0x0602");
            expect(errors.feedback.eibfn_alt).toBe("EXEC CICS LINK");
            expect(errors.feedback.resp).toBe("16");
            expect(errors.feedback.resp_alt).toBe("INVREQ");
            expect(errors.feedback.resp2).toBe("1");
        });

        it("should handle nested error structure", () => {
            const errors: ICMCIResponseErrors = {
                feedback: {
                    eyu_cicsname: "TESTRGN",
                    action: "DELETE",
                    eibfn: "0x0604",
                    eibfn_alt: "EXEC CICS DELETE",
                    resp: "13",
                    resp_alt: "NOTFND",
                    resp2: "0"
                }
            };

            expect(errors.feedback.eyu_cicsname).toBe("TESTRGN");
            expect(errors.feedback.action).toBe("DELETE");
            expect(errors.feedback.resp_alt).toBe("NOTFND");
        });
    });

    describe("Type Guards", () => {
        describe("isICMCIResponseErrorFeedBack", () => {
            it("should return true for valid ICMCIResponseErrorFeedBack object", () => {
                const feedback: ICMCIResponseErrorFeedBack = {
                    eibfn_alt: "EXEC CICS LINK",
                    resp: "16",
                    resp_alt: "INVREQ",
                    resp2: "1"
                };

                expect(isICMCIResponseErrorFeedBack(feedback)).toBe(true);
            });

            it("should return true for valid ICMCIResponseErrorFeedBack with optional fields", () => {
                const feedback: ICMCIResponseErrorFeedBack = {
                    eyu_cicsname: "CICSRGN1",
                    action: "CREATE",
                    eibfn: "0x0602",
                    eibfn_alt: "EXEC CICS LINK",
                    resp: "16",
                    resp_alt: "INVREQ",
                    resp2: "1"
                };

                expect(isICMCIResponseErrorFeedBack(feedback)).toBe(true);
            });

            it("should return false for object missing required fields", () => {
                const invalidFeedback = {
                    eibfn_alt: "EXEC CICS LINK",
                    resp: "16"
                };

                expect(isICMCIResponseErrorFeedBack(invalidFeedback)).toBe(false);
            });

            it("should return false for null", () => {
                expect(isICMCIResponseErrorFeedBack(null)).toBe(false);
            });

            it("should return false for undefined", () => {
                expect(isICMCIResponseErrorFeedBack(undefined)).toBe(false);
            });

            it("should return false for non-object", () => {
                expect(isICMCIResponseErrorFeedBack("string")).toBe(false);
                expect(isICMCIResponseErrorFeedBack(TEST_NUMBER)).toBe(false);
            });
        });

        describe("isICMCIResponseErrors", () => {
            it("should return true for valid ICMCIResponseErrors object", () => {
                const errors: ICMCIResponseErrors = {
                    feedback: {
                        eibfn_alt: "EXEC CICS LINK",
                        resp: "16",
                        resp_alt: "INVREQ",
                        resp2: "1"
                    }
                };

                expect(isICMCIResponseErrors(errors)).toBe(true);
            });

            it("should return false for object missing feedback", () => {
                const invalidErrors = {};

                expect(isICMCIResponseErrors(invalidErrors)).toBe(false);
            });

            it("should return false for null", () => {
                expect(isICMCIResponseErrors(null)).toBe(false);
            });

            it("should return false for undefined", () => {
                expect(isICMCIResponseErrors(undefined)).toBe(false);
            });

            it("should return false for non-object", () => {
                expect(isICMCIResponseErrors("string")).toBe(false);
                expect(isICMCIResponseErrors(TEST_NUMBER)).toBe(false);
            });
        });
    });
});