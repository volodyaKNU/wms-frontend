const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getProducts(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/api/products${params}`);
}

export function createProduct(product) {
  return request('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export function updateProduct(id, product) {
  return request(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export function deleteProduct(id) {
  return request(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

export function addIncome(id, quantity) {
  return request(`/api/products/${id}/income`, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });
}

export function writeOff(id, quantity) {
  return request(`/api/products/${id}/writeoff`, {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });
}

export function getMovements() {
  return request('/api/movements');
}
