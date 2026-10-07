const apiUrl = Cypress.env('apiUrl');

function uniqueSku(prefix) {
  return `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}`;
}

describe('WMS products', () => {
  it('creates a product through React and shows it in the table', () => {
    const sku = uniqueSku('CY-CREATE');

    cy.visit('/');
    cy.get('[data-testid="sku-input"]').type(sku);
    cy.get('[data-testid="name-input"]').type('Cypress Mouse');
    cy.get('[data-testid="unit-input"]').clear().type('шт.');
    cy.get('[data-testid="quantity-input"]').clear().type('10');
    cy.get('[data-testid="min-quantity-input"]').clear().type('5');
    cy.get('[data-testid="submit-product"]').click();

    cy.contains('[data-testid="product-row"]', sku).should('contain', 'Cypress Mouse');
  });

  it('filters products by search text', () => {
    const targetSku = uniqueSku('CY-SEARCH');
    const otherSku = uniqueSku('CY-OTHER');

    cy.request('POST', `${apiUrl}/api/products`, {
      sku: targetSku,
      name: 'Search Target Keyboard',
      unit: 'шт.',
      quantity: 3,
      min_quantity: 1,
    });
    cy.request('POST', `${apiUrl}/api/products`, {
      sku: otherSku,
      name: 'Other Product',
      unit: 'шт.',
      quantity: 3,
      min_quantity: 1,
    });

    cy.visit('/');
    cy.get('[data-testid="search-input"]').type(targetSku);
    cy.contains('[data-testid="product-row"]', targetSku).should('be.visible');
    cy.contains(otherSku).should('not.exist');
  });

  it('gets products from API', () => {
    cy.request(`${apiUrl}/api/products`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
    });
  });

  it('does not allow writeoff greater than stock', () => {
    const sku = uniqueSku('CY-WRITEOFF');

    cy.request('POST', `${apiUrl}/api/products`, {
      sku,
      name: 'Writeoff Guard Product',
      unit: 'шт.',
      quantity: 5,
      min_quantity: 1,
    }).then((response) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/api/products/${response.body.id}/writeoff`,
        failOnStatusCode: false,
        body: { quantity: 6 },
      }).then((writeoffResponse) => {
        expect(writeoffResponse.status).to.eq(400);
        expect(writeoffResponse.body.error).to.eq('Not enough stock for writeoff');
      });
    });
  });
});
