import '@testing-library/cypress/add-commands';
import 'cypress-iframe';

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

      /**
       * Custom command to click Zowe Explorer icon.
       * @example cy.clickZoweExplorerIcon()
       */
      clickZoweExplorerIcon(): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to toggle Zowe Data set, USS, and Job trees open and closed.
       * @example cy.toggleZoweTrees()
       */
      toggleZoweTrees(): Chainable<JQuery<HTMLElement>>;

      iframeOnload(args?: any): any;
    }
  }
}

Cypress.Commands.add('iframeOnload', { prevSubject: 'element' }, $iframe => {
  return new Cypress.Promise(resolve => {
    $iframe.on('load', () => {
      resolve($iframe.contents().find('body'));
    });
  });
});

Cypress.Commands.add("getTreeNode", (value: string) => {
  return cy.get(`div.custom-view-tree-node-item-resourceLabel[aria-label='${value}']`);
});

Cypress.Commands.add("getTreeHeader", (value: string) => {
  return cy.get(`div.pane-header[aria-label="${value}"]`);
});

Cypress.Commands.add("resetWiremock", () => {
  cy.request('POST', 'http://localhost:8080/__admin/scenarios/reset').its('status').should("equal", 200);
});

Cypress.Commands.add("clickZoweExplorerIcon", () => {
  cy.get('a[aria-label="Zowe Explorer"]').click();
  cy.get('h3.title').contains("cics").should("exist");
});

Cypress.Commands.add("toggleZoweTrees", () => {
  cy.getTreeHeader("Data Sets Section").should("exist").click();
  cy.getTreeHeader("Jobs Section").should("exist").click();
  cy.getTreeHeader("Unix System Services (USS) Section").should("exist").click();
});
