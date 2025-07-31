import '@testing-library/cypress/add-commands';

// cypress/support/index.ts
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select tree element by aria-label attribute.
       * @example cy.getTreeNode('Regions')
       */
      getTreeNode(value: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to get tree header element by aria-label attribute.
       * @example cy.getTreeHeader('Data Sets')
       */
      getTreeHeader(value: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to reset wiremock scenarios.
       * @example cy.resetWiremock()
       */
      resetWiremock(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add("getTreeNode", (value: string) => {
  return cy.get(`div.custom-view-tree-node-item-resourceLabel[aria-label='${value}']`);
});

Cypress.Commands.add("getTreeHeader", (value: string) => {
  return cy.get(`div.pane-header[aria-label="${value}"]`);
});

Cypress.Commands.add("resetWiremock", () => {
  cy.request('POST', 'http://localhost:8080/__admin/scenarios/reset').its('status').should("equal", 200);
});
