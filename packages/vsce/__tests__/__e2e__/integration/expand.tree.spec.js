/// <reference types="cypress" />
// import CommandPalette from '../pageObject/CommandPalette';

context('CICS Extension', () => {

  beforeEach(() => {
    cy.request('POST', 'http://localhost:8080/__admin/scenarios/reset').its('status').should("equal", 200);
    cy.visit('http://localhost:1234');
  });

  it('Should load vscode', () => {
    cy.get('.explorer-viewlet').should('exist');
  });
  it('Should load Zowe Explorer', () => {
    cy.get('.explorer-viewlet').should('exist');

    // Clicks Zowe Explorer icon - ensures CICS tree is visible
    cy.get('a[aria-label="Zowe Explorer"]').click();
    cy.get('h3.title').contains("cics").should("exist");

    // Collapses ZE trees other than CICS
    cy.get('div.pane-header[aria-label="Data Sets Section"]').should("exist").click();
    cy.get('div.pane-header[aria-label="Jobs Section"]').should("exist").click();
    cy.get('div.pane-header[aria-label="Unix System Services (USS) Section"]').should("exist").click();

    cy.wait(1000);
  });

  it('Should add wiremock profile to cics tree and expand program', () => {

    // Clicks Zowe Explorer icon - ensures CICS tree is visible
    cy.get('a[aria-label="Zowe Explorer"]').click();
    cy.get('h3.title').contains("cics").should("exist");

    // Clicks through tree to expand programs
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='wiremock_localhost']", { timeout: 5000 }).should("exist").should("be.visible").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='CICSEX61']").should("exist").should("be.visible").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='IYCWENK1']").should("exist").should("be.visible").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='Programs']").should("exist").should("be.visible").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='IBMRLIB1']").should("exist").should("be.visible").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='wiremock_localhost']").should("exist").should("be.visible").click();


    cy.wait(1000);
  });

  it('Should disable and enable a program', () => {

    // Clicks Zowe Explorer icon - ensures CICS tree is visible
    cy.get('a[aria-label="Zowe Explorer"]').click();
    cy.get('h3.title').contains("cics").should("exist");

    // Clicks through tree to expand programs
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='wiremock_localhost']").should("exist").should("be.visible").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='CICSEX61']").should("exist").should("be.visible").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='IYCWENK1']").should("exist").should("be.visible").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='Programs']").should("exist").should("be.visible").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='C128N']").should("exist").should("be.visible").click().rightclick();

    cy.wait(100);
    cy.contains("Disable Program").should("exist").click();
    cy.contains("C128N (Disabled)").should("exist");

    cy.wait(100);
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='C128N (Disabled)']").should("exist").should("be.visible").rightclick();
    cy.wait(100);
    cy.contains("Enable Program").should("exist").click();
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='C128N']").should("exist");

    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='wiremock_localhost']").should("exist").should("be.visible").click();
  });

  after(() => {
    // Removes wiremock profile from tree
    cy.get("div.custom-view-tree-node-item-resourceLabel[aria-label='wiremock_localhost']").should("exist").should("be.visible").rightclick();
    cy.wait(100);
    cy.get("span[aria-label='Manage Profile']").should("exist").click();
    cy.wait(100);
    cy.get('div.monaco-list-row[aria-label="eye-closed  Hide Profile, Hide the selected Profile"]').should("exist").should("be.visible").click();
  });
});
