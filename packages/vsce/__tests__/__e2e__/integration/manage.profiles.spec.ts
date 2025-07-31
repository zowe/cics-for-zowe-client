// import CommandPalette from '../pageObject/CommandPalette';

context('Manage Profiles', () => {

  beforeEach(() => {
    cy.resetWiremock();
    cy.visit('http://localhost:1234');
  });

  it('Should remove profile from CICS tree', () => {
    cy.clickZoweExplorerIcon();
    cy.toggleZoweTrees();

    cy.getTreeNode("wiremock_localhost").should("exist").should("be.visible").rightclick();
    cy.wait(100);
    cy.contains("Manage Profile").should("exist").click();
    cy.contains("Hide Profile").should("exist").click();
    cy.getTreeNode("wiremock_localhost").should("not.exist");
  });

  it('Should add profile to CICS tree', () => {

    cy.clickZoweExplorerIcon();

    cy.getTreeNode("wiremock_localhost").should("not.exist");
    cy.get("a[aria-label='Create a CICS Profile']").should("exist").click({ force: true });
    cy.wait(100);
    cy.contains("wiremock_localhost").should("exist").should("be.visible").click();
    cy.getTreeNode("wiremock_localhost").should("exist").should("be.visible");
  });

  after(() => {
    cy.toggleZoweTrees();
  });

});
