const apiUrl = Cypress.env('apiUrl');

function uniqueSku(prefix) {
  return `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}`;
}

function createProduct(overrides = {}) {
  return cy.request('POST', `${apiUrl}/api/products`, {
    sku: uniqueSku('CY-PRODUCT'),
    name: 'Cypress Product',
    unit: 'шт.',
    quantity: 10,
    min_quantity: 2,
    ...overrides,
  });
}

describe('WMS product workflows', () => {
  it('creates a product through React and shows it in the table', () => {
    const sku = uniqueSku('CY-CREATE');

    cy.visit('/');
    cy.get('[data-testid="sku-input"]').type(sku);
    cy.get('[data-testid="name-input"]').type('Cypress Mouse');
    cy.get('[data-testid="unit-input"]').clear().type('шт.');
    cy.get('[data-testid="quantity-input"]').clear().type('10');
    cy.get('[data-testid="min-quantity-input"]').clear().type('5');
    cy.get('[data-testid="submit-product"]').click();

    cy.contains('[data-testid="product-row"]', sku)
      .should('contain', 'Cypress Mouse')
      .and('contain', 'OK');
  });

  it('edits a product quantity and marks a low-stock item', () => {
    const sku = uniqueSku('CY-EDIT');
    createProduct({ sku, name: 'Editable Product' });

    cy.visit('/');
    cy.contains('[data-testid="product-row"]', sku).within(() => {
      cy.get('[data-testid="edit-product"]').click();
    });

    cy.get('[data-testid="quantity-input"]').clear().type('1');
    cy.get('[data-testid="min-quantity-input"]').clear().type('2');
    cy.get('[data-testid="submit-product"]').click();

    cy.contains('[data-testid="product-row"]', sku)
      .should('have.class', 'low-stock')
      .within(() => {
        cy.get('[data-testid="product-quantity"]').should('have.text', '1');
        cy.get('[data-testid="product-status"]').should('have.text', 'Низький залишок');
      });
  });

  it('filters products and deletes the selected result', () => {
    const targetSku = uniqueSku('CY-DELETE');
    const otherSku = uniqueSku('CY-OTHER');
    createProduct({ sku: targetSku, name: 'Delete Target' });
    createProduct({ sku: otherSku, name: 'Keep Target' });

    cy.visit('/');
    cy.get('[data-testid="search-input"]').type(targetSku);
    cy.contains('[data-testid="product-row"]', targetSku).within(() => {
      cy.get('[data-testid="delete-product"]').click();
    });

    cy.contains('[data-testid="product-row"]', targetSku).should('not.exist');
    cy.contains(otherSku).should('not.exist');
  });

  it('registers income and writeoff and displays both movements', () => {
    const sku = uniqueSku('CY-MOVE');
    createProduct({ sku, name: 'Movement Product', quantity: 5 });

    cy.visit('/');
    cy.window().then((window) => {
      cy.stub(window, 'prompt').onFirstCall().returns('4').onSecondCall().returns('3');
    });

    cy.contains('[data-testid="product-row"]', sku).within(() => {
      cy.get('[data-testid="income-product"]').click();
      cy.get('[data-testid="product-quantity"]').should('have.text', '9');
      cy.get('[data-testid="writeoff-product"]').click();
      cy.get('[data-testid="product-quantity"]').should('have.text', '6');
    });

    cy.contains('[data-testid="movement-row"]', `writeoff 3 — ${sku}`).should(
      'contain',
      'Movement Product'
    );
    cy.contains('[data-testid="movement-row"]', `income 4 — ${sku}`).should(
      'contain',
      'Movement Product'
    );
  });
});
