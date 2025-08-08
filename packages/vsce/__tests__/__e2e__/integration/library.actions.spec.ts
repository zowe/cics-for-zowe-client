// import CommandPalette from '../pageObject/CommandPalette';

context('Library Actions', () => {

  beforeEach(() => {
    cy.resetWiremock();
    cy.visit('http://localhost:1234');
  });

  it('Should expand trees to reveal libraries', () => {

    cy.clickZoweExplorerIcon();
    cy.toggleZoweTrees();

    // Clicks through tree to expand libraries
    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
    cy.getTreeNode('CICSEX61').should("exist").should("be.visible").click();
    cy.getTreeNode('Regions').should("exist").should("be.visible").click();
    cy.getTreeNode('PROGLIB').should("exist").should("be.visible").click();
    cy.getTreeNode('Libraries').should("exist").should("be.visible").click();
    cy.getTreeNode('LIB1').should("exist").should("be.visible");
    cy.getTreeNode('LIB2').should("exist").should("be.visible");
    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();

    cy.wait(1000);
  });

  after(() => {
    cy.toggleZoweTrees();
  });

});
