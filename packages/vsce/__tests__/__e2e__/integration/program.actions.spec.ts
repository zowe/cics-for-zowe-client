// import CommandPalette from '../pageObject/CommandPalette';

context('Program Actions', () => {

  beforeEach(() => {
    cy.resetWiremock();
    cy.visit('http://localhost:1234');
  });

  it('Should expand trees to reveal program', () => {

    // Clicks Zowe Explorer icon - ensures CICS tree is visible
    cy.get('a[aria-label="Zowe Explorer"]').click();
    cy.get('h3.title').contains("cics").should("exist");

    cy.getTreeHeader("Data Sets Section").should("exist").click();
    cy.getTreeHeader("Jobs Section").should("exist").click();
    cy.getTreeHeader("Unix System Services (USS) Section").should("exist").click();

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

    // Clicks Zowe Explorer icon - ensures CICS tree is visible
    cy.get('a[aria-label="Zowe Explorer"]').click();
    cy.get('h3.title').contains("cics").should("exist");

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

  after(() => {
    cy.getTreeNode("wiremock_localhost").should("exist").should("be.visible").rightclick();
    cy.wait(100);
    cy.contains("Manage Profile").should("exist").click();
    cy.contains("Hide Profile").should("exist").click();
    cy.getTreeNode("wiremock_localhost").should("not.exist");

    cy.getTreeHeader("Data Sets Section").should("exist").click();
    cy.getTreeHeader("Jobs Section").should("exist").click();
    cy.getTreeHeader("Unix System Services (USS) Section").should("exist").click();
  });

});
