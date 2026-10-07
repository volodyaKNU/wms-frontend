import { useEffect, useMemo, useState } from 'react';
import {
  addIncome,
  createProduct,
  deleteProduct,
  getMovements,
  getProducts,
  updateProduct,
  writeOff,
} from './api.js';

const emptyForm = {
  sku: '',
  name: '',
  unit: 'шт.',
  quantity: 0,
  min_quantity: 0,
};

function App() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  async function loadData(nextSearch = search) {
    const [productsData, movementsData] = await Promise.all([
      getProducts(nextSearch),
      getMovements(),
    ]);
    setProducts(productsData);
    setMovements(movementsData);
  }

  useEffect(() => {
    loadData().catch((loadError) => setError(loadError.message));
  }, []);

  async function handleSearchChange(event) {
    const value = event.target.value;
    setSearch(value);
    await loadData(value);
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      min_quantity: Number(form.min_quantity),
    };

    try {
      if (isEditing) {
        await updateProduct(editingId, payload);
        setMessage('Товар оновлено');
      } else {
        await createProduct(payload);
        setMessage('Товар додано');
      }

      resetForm();
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      quantity: product.quantity,
      min_quantity: product.min_quantity,
    });
  }

  async function handleDelete(product) {
    setError('');
    setMessage('');

    try {
      await deleteProduct(product.id);
      setMessage('Товар видалено');
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleMovement(product, type) {
    const rawValue = window.prompt(
      type === 'income' ? 'Кількість надходження' : 'Кількість списання',
      '1'
    );

    if (rawValue === null) {
      return;
    }

    setError('');
    setMessage('');

    try {
      if (type === 'income') {
        await addIncome(product.id, Number(rawValue));
        setMessage('Надходження виконано');
      } else {
        await writeOff(product.id, Number(rawValue));
        setMessage('Списання виконано');
      }

      await loadData();
    } catch (movementError) {
      setError(movementError.message);
    }
  }

  return (
    <main className="app">
      <header className="header">
        <h1>WMS — Облік товарів</h1>
      </header>

      <section className="toolbar">
        <input
          aria-label="Пошук за назвою або SKU"
          className="search"
          data-testid="search-input"
          placeholder="Пошук за назвою або SKU"
          value={search}
          onChange={handleSearchChange}
        />
      </section>

      <section className="form-section">
        <h2>{isEditing ? 'Редагувати товар' : 'Додати товар'}</h2>
        <form className="product-form" onSubmit={handleSubmit}>
          <input
            data-testid="sku-input"
            name="sku"
            placeholder="SKU"
            required
            value={form.sku}
            onChange={handleFieldChange}
          />
          <input
            data-testid="name-input"
            name="name"
            placeholder="Назва"
            required
            value={form.name}
            onChange={handleFieldChange}
          />
          <input
            data-testid="unit-input"
            name="unit"
            placeholder="Од."
            required
            value={form.unit}
            onChange={handleFieldChange}
          />
          <input
            data-testid="quantity-input"
            min="0"
            name="quantity"
            placeholder="Кількість"
            type="number"
            value={form.quantity}
            onChange={handleFieldChange}
          />
          <input
            data-testid="min-quantity-input"
            min="0"
            name="min_quantity"
            placeholder="Мін."
            type="number"
            value={form.min_quantity}
            onChange={handleFieldChange}
          />
          <button data-testid="submit-product" type="submit">
            {isEditing ? 'Зберегти' : '+ Додати товар'}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm}>
              Скасувати
            </button>
          )}
        </form>
      </section>

      {message && <p className="message">{message}</p>}
      {error && (
        <p className="error" data-testid="error-message">
          {error}
        </p>
      )}

      <section className="table-section">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Назва</th>
              <th>Од.</th>
              <th>Кількість</th>
              <th>Мін.</th>
              <th>Статус</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const lowStock = product.quantity <= product.min_quantity;

              return (
                <tr
                  className={lowStock ? 'low-stock' : ''}
                  data-testid="product-row"
                  key={product.id}
                >
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.unit}</td>
                  <td>{product.quantity}</td>
                  <td>{product.min_quantity}</td>
                  <td>{lowStock ? 'Низький залишок' : 'OK'}</td>
                  <td className="actions">
                    <button type="button" onClick={() => startEdit(product)}>
                      Редагувати
                    </button>
                    <button type="button" onClick={() => handleDelete(product)}>
                      Видалити
                    </button>
                    <button type="button" onClick={() => handleMovement(product, 'income')}>
                      Надходження
                    </button>
                    <button type="button" onClick={() => handleMovement(product, 'writeoff')}>
                      Списання
                    </button>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan="7">Товарів не знайдено</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="movements">
        <h2>Історія операцій</h2>
        <ul>
          {movements.slice(0, 10).map((movement) => (
            <li key={movement.id}>
              {movement.created_at}: {movement.type} {movement.quantity} —{' '}
              {movement.sku} {movement.product_name}
            </li>
          ))}
          {movements.length === 0 && <li>Операцій ще немає</li>}
        </ul>
      </section>
    </main>
  );
}

export default App;
