// import CommandPalette from '../pageObject/CommandPalette';

context('Program Actions', () => {

  beforeEach(() => {
    cy.resetWiremock();
    cy.visit('http://localhost:1234');
  });

  // it('Should expand trees to reveal program', () => {

  //   cy.clickZoweExplorerIcon();


  //   // Clicks through tree to expand programs
  //   cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
  //   cy.getTreeNode('CICSEX61').should("exist").should("be.visible").click();
  //   cy.getTreeNode('Regions').should("exist").should("be.visible").click();
  //   cy.getTreeNode('IYCWENK1').should("exist").should("be.visible").click();
  //   cy.getTreeNode('Programs').should("exist").should("be.visible").click();
  //   cy.getTreeNode('IBMRLIB1').should("exist").should("be.visible").click();
  //   cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();

  //   cy.wait(1000);
  // });

  // it('Should disable and enable a program', () => {

  //   cy.clickZoweExplorerIcon();

  //   // Clicks through tree to expand programs
  //   cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
  //   cy.getTreeNode('CICSEX61').should("exist").should("be.visible").click();
  //   cy.getTreeNode('IYCWENK1').should("exist").should("be.visible").click();
  //   cy.getTreeNode('Programs').should("exist").should("be.visible").click();
  //   cy.getTreeNode('C128N').should("exist").should("be.visible").click().rightclick();

  //   cy.wait(100);
  //   cy.contains("Disable Program").should("exist").click();
  //   cy.contains("C128N (Disabled)").should("exist");

  //   cy.wait(100);
  //   cy.getTreeNode('C128N (Disabled)').should("exist").should("be.visible").rightclick();
  //   cy.wait(100);
  //   cy.contains("Enable Program").should("exist").click();
  //   cy.getTreeNode('C128N').should("exist");

  //   cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
  // });

  // it('Should new copy a program', () => {

  //   cy.clickZoweExplorerIcon();

  //   // Clicks through tree to expand programs
  //   cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
  //   cy.getTreeNode('CICSEX61').should("exist").should("be.visible").click();
  //   cy.getTreeNode('IYCWENK1').should("exist").should("be.visible").click();
  //   cy.getTreeNode('Programs').should("exist").should("be.visible").click();
  //   cy.getTreeNode('DSNCUEXT').should("exist").should("be.visible").click().rightclick();

  //   cy.wait(100);
  //   cy.contains("New Copy").should("exist").click();
  //   cy.getTreeNode("DSNCUEXT (New copy count: 1)").should("exist");

  //   cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
  // });

  it('Should inspect program', () => {

    cy.clickZoweExplorerIcon();
    // TEMP
    cy.toggleZoweTrees();

    // Clicks through tree to expand programs
    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
    cy.getTreeNode('CICSEX61').should("exist").should("be.visible").click();
    cy.getTreeNode('IYCWENK1').should("exist").should("be.visible").click();
    cy.getTreeNode('Programs').should("exist").should("be.visible").click();
    cy.getTreeNode('C128N').should("exist").should("be.visible").click().rightclick();

    cy.wait(100);
    cy.contains("Inspect Resource").should("exist").click();
    cy.wait(100);

    cy.get("li.action-item.checked > a.action-label[aria-label='CICS Resource Inspector']").should("exist").should("be.visible");
    cy.contains("CICS Resource Inspector").should("exist").should("be.visible");




    cy
      .get('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]')
      .its('0.contentDocument.body')
      .should('not.be.empty')
      .then(cy.wrap)
      .find('iframe')
      .its('0.contentDocument.body')
      .should('not.be.empty')
      .then(cy.wrap)
      .contains("C128N")
      .should("be.visible");





    // cy.get('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').then($firstIframe => {
    //   const $secondIframeReference = $firstIframe.contents().find('iframe');

    //   cy.wrap($secondIframeReference).as('secondIframeReference'); // Saving this as a reference so we can access it again using get command

    //   // Now we are accessing the second iframe
    //   cy.get('@secondIframeReference').then($secondIframe => {

    //     const table1 = cy.wrap($secondIframe.contents()).find("#table-1");

    //     table1.find("#th-1").should("exist");

    //     // cy.wrap($secondIframe.contents()).find("#table-1").should("not.be.empty");

    //     // cy.log($secondIframe.contents().find('#webviewRoot > .maindiv > table'));
    //     // cy.wait(500);
    //     // cy.log($secondIframe.contents().find('#webviewRoot').find("table"));
    //     // cy.wait(500);
    //     // $secondIframe.contents().find('div:contains("C128N")');
    //     // $secondIframe.contents().find('div:contains("_KEYDATA")');

    //     // cy.wrap('$elementYouWant').type("It's writing some stuff"); // In case it is an input field, for example
    //   });
    // });



    // cy.frameLoaded('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]');
    // cy.iframe('iframe[src*="extensionId=Zowe.cics-extension-for-zowe"]').find("div").contains("C128N");

    // // HORRIBLE - needs tidying
    // cy.get(".monaco-workbench > div > iframe").iframeOnload().its('0').invoke('querySelector', 'iframe#active-frame').should('not.be.null')
    //   .then(iframe => cy.wrap(iframe)).its('0.contentDocument.body', { log: false }).should('not.be.empty').then(ifb => cy.wrap(ifb)).as('iframeBody').then((ifb) => {
    //     cy.wrap(ifb).find('#webviewRoot').should('not.be.empty');
    //     cy.wrap(ifb).contains("C128N").should("not.be.null");
    //   });

    cy.getTreeNode('wiremock_localhost').should("exist").should("be.visible").click();
  });

  after(() => {
    cy.toggleZoweTrees();
  });

});
