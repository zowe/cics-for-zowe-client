// import CommandPalette from '../pageObject/CommandPalette';

context('Regions and Plexes', () => {

  beforeEach(() => {
    cy.resetWiremock();
    cy.visit('http://localhost:1234');
  });

  it('Should expand trees to reveal CICSplexes', () => {

    cy.clickZoweExplorerIcon();
    cy.toggleZoweTrees();

    // Clicks through tree to expand programs
    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
    cy.getTreeNode('CICSEX61').should("exist").should("be.visible");
    cy.getTreeNode('DUMMY907').should("exist").should("be.visible");

    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
    cy.wait(1000);
  });

  it('Should list regions under a CICSplex', () => {

    cy.clickZoweExplorerIcon();

    // Clicks through tree to expand programs
    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
    cy.getTreeNode('CICSEX61').should("exist").should("be.visible").click();
    cy.getTreeNode('Regions [8/8]').should("exist").should("be.visible");

    for (const reg of ["IYCWENK1", "PROGLIB", "IYCWENL1", "IYCWENM1", "IYCWENN1", "IYCWENTH", "IYCWENW1", "IYCWENW2"]) {
      cy.getTreeNode(reg).should("exist").should("be.visible");
    }

    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
  });

  // SMSSJ Region check?

  after(() => {
    cy.toggleZoweTrees();
  });

});
