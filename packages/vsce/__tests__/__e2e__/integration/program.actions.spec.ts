// import CommandPalette from '../pageObject/CommandPalette';

context('Program Actions', () => {

  beforeEach(() => {
    cy.resetWiremock();
    cy.visit('http://localhost:1234');
  });

  it('Should expand trees to reveal program', () => {

    cy.clickZoweExplorerIcon();
    cy.toggleZoweTrees();

    // Clicks through tree to expand programs
    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
    cy.getTreeNode('CICSEX61').should("exist").should("be.visible").click();
    cy.getTreeNode('Regions').should("exist").should("be.visible").click();
    cy.getTreeNode('IYCWENK1').should("exist").should("be.visible").click();
    cy.getTreeNode('Programs').should("exist").should("be.visible").click();
    cy.getTreeNode('IBMRLIB1').should("exist").should("be.visible").click();
    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();

    cy.wait(1000);
  });

  it('Should disable and enable a program', () => {

    cy.clickZoweExplorerIcon();

    // Clicks through tree to expand programs
    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
    cy.getTreeNode('CICSEX61').should("exist").should("be.visible").click();
    cy.getTreeNode('IYCWENK1').should("exist").should("be.visible").click();
    cy.getTreeNode('Programs').should("exist").should("be.visible").click();
    cy.getTreeNode('C128N').should("exist").should("be.visible").click().rightclick();

    cy.wait(100);
    cy.contains("Disable Program").should("exist").click();
    cy.contains("C128N (Disabled)").should("exist");

    cy.wait(100);
    cy.getTreeNode('C128N (Disabled)').should("exist").should("be.visible").rightclick();
    cy.wait(100);
    cy.contains("Enable Program").should("exist").click();
    cy.getTreeNode('C128N').should("exist");

    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
  });

  it('Should new copy a program', () => {

    cy.clickZoweExplorerIcon();

    // Clicks through tree to expand programs
    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
    cy.getTreeNode('CICSEX61').should("exist").should("be.visible").click();
    cy.getTreeNode('IYCWENK1').should("exist").should("be.visible").click();
    cy.getTreeNode('Programs').should("exist").should("be.visible").click();
    cy.getTreeNode('DSNCUEXT').should("exist").should("be.visible").click().rightclick();

    cy.wait(100);
    cy.contains("New Copy").should("exist").click();
    cy.getTreeNode("DSNCUEXT (New copy count: 1)").should("exist");

    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
  });

  after(() => {
    cy.toggleZoweTrees();
  });

});
