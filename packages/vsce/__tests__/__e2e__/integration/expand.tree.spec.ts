// import CommandPalette from '../pageObject/CommandPalette';

context('Verify VS Code and Zowe Explorer', () => {

  beforeEach(() => {
    cy.resetWiremock();
    cy.visit('http://localhost:1234');
  });

  it('Should load vscode', () => {
    cy.get('.explorer-viewlet').should('exist');
  });

  it('Should open Zowe Explorer view', () => {
    // cy.get('.explorer-viewlet').should('exist');

    // Clicks Zowe Explorer icon - ensures CICS tree is visible
    cy.get('a[aria-label="Zowe Explorer"]').click();
    cy.get('h3.title').contains("cics").should("exist");

    // Collapses ZE trees other than CICS
    cy.getTreeHeader("Data Sets Section").should("exist").click();
    cy.getTreeHeader("Jobs Section").should("exist").click();
    cy.getTreeHeader("Unix System Services (USS) Section").should("exist").click();

    // cy.wait(1000);
  });

  after(() => {
    cy.getTreeHeader("Data Sets Section").should("exist").click();
    cy.getTreeHeader("Jobs Section").should("exist").click();
    cy.getTreeHeader("Unix System Services (USS) Section").should("exist").click();
  });

});
