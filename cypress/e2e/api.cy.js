const apiUrl = Cypress.env('apiUrl');

function uniqueSku(prefix) {
  return `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}`;
}

describe('WMS API', () => {
  it('supports CRUD, stock movements, history, and search', () => {
    const sku = uniqueSku('CY-API');
    let productId;

    cy.request('POST', `${apiUrl}/api/products`, {
      sku,
      name: 'API Product',
      unit: 'шт.',
      quantity: 8,
      min_quantity: 2,
    })
      .its('body')
      .then((product) => {
        productId = product.id;
        expect(product).to.include({ sku, quantity: 8 });

        return cy.request('GET', `${apiUrl}/api/products/${productId}`);
      })
      .then(({ body }) => {
        expect(body.name).to.eq('API Product');

        return cy.request('PUT', `${apiUrl}/api/products/${productId}`, {
          sku,
          name: 'Updated API Product',
          unit: 'кор.',
          quantity: 10,
          min_quantity: 3,
        });
      })
      .then(({ body }) => {
        expect(body).to.include({ name: 'Updated API Product', quantity: 10 });

        return cy.request('POST', `${apiUrl}/api/products/${productId}/income`, {
          quantity: 5,
        });
      })
      .then(({ body }) => {
        expect(body.quantity).to.eq(15);

        return cy.request('POST', `${apiUrl}/api/products/${productId}/writeoff`, {
          quantity: 4,
        });
      })
      .then(({ body }) => {
        expect(body.quantity).to.eq(11);

        return cy.request('GET', `${apiUrl}/api/movements`);
      })
      .then(({ body }) => {
        expect(
          body.some(
            (movement) =>
              movement.product_id === productId &&
              movement.sku === sku &&
              movement.type === 'income' &&
              movement.quantity === 5
          )
        ).to.eq(true);
        expect(
          body.some(
            (movement) =>
              movement.product_id === productId &&
              movement.sku === sku &&
              movement.type === 'writeoff' &&
              movement.quantity === 4
          )
        ).to.eq(true);

        return cy.request('GET', `${apiUrl}/api/products?search=${encodeURIComponent(sku)}`);
      })
      .then(({ body }) => {
        expect(body).to.have.length(1);
        expect(body[0].id).to.eq(productId);

        return cy.request('DELETE', `${apiUrl}/api/products/${productId}`);
      })
      .then(({ status }) => {
        expect(status).to.eq(204);

        return cy.request({
          method: 'GET',
          url: `${apiUrl}/api/products/${productId}`,
          failOnStatusCode: false,
        });
      })
      .then(({ status, body }) => {
        expect(status).to.eq(404);
        expect(body.error).to.eq('Product not found');
      });
  });

  it('rejects invalid product data', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/products`,
      failOnStatusCode: false,
      body: {
        sku: uniqueSku('CY-INVALID'),
        name: 'Invalid Product',
        unit: 'шт.',
        quantity: -1,
        min_quantity: 0,
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body.error).to.eq('quantity must be a non-negative integer');
    });
  });

  it('does not allow a writeoff greater than stock', () => {
    const sku = uniqueSku('CY-WRITEOFF');

    cy.request('POST', `${apiUrl}/api/products`, {
      sku,
      name: 'Writeoff Guard Product',
      unit: 'шт.',
      quantity: 5,
      min_quantity: 1,
    }).then(({ body: product }) => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/api/products/${product.id}/writeoff`,
        failOnStatusCode: false,
        body: { quantity: 6 },
      }).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.error).to.eq('Not enough stock for writeoff');
      });
    });
  });
});
