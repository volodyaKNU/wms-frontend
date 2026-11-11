const prometheusUrl = Cypress.env('prometheusUrl');
const describeMonitoring = prometheusUrl ? describe : describe.skip;

describeMonitoring('Prometheus monitoring', () => {

  it('scrapes the WMS backend successfully', () => {
    cy.request(`${prometheusUrl}/api/v1/query?query=up%7Bjob%3D%22wms-backend%22%7D`)
      .its('body.data.result.0.value.1')
      .should('equal', '1');

    cy.visit(`${prometheusUrl}/query?g0.expr=up%7Bjob%3D%22wms-backend%22%7D&g0.tab=1`);
    cy.contains('wms-backend', { timeout: 10000 }).should('be.visible');
    cy.screenshot('stage5-prometheus-up', { capture: 'fullPage' });
  });
});
