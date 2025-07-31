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
    cy.clickZoweExplorerIcon();
    cy.toggleZoweTrees();
  });

  after(() => {
    cy.toggleZoweTrees();
  });

});
