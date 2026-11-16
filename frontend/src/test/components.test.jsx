import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ProductCard from '../components/ProductCard';
import { ProgressRing, Badge } from '../components/ui';
import { money, initials, ORDER_STATUS } from '../utils/format';
import { errorMessage } from '../api/client';
import { ToastProvider } from '../context/ToastContext';
import Quiz from '../pages/lab/Quiz';
import api from '../api/client';

describe('format utils', () => {
  test('money and initials', () => {
    expect(money(1299)).toBe('$1,299.00');
    expect(initials('Alice Karimova')).toBe('AK');
    expect(Object.keys(ORDER_STATUS)).toHaveLength(5);
  });
  test('errorMessage prefers API error + details', () => {
    expect(errorMessage({ response: { data: { error: 'Xato', details: ['a', 'b'] } } })).toBe('Xato: a, b');
    expect(errorMessage({})).toBe('Serverga ulanib bo‘lmadi');
  });
});

describe('components', () => {
  const product = { id: 1, name: 'Aurora Pro', category: 'Audio', price: 249, rating: 4.7, stock: 3, description: 'ANC' };

  test('ProductCard renders and calls onAdd', () => {
    const onAdd = vi.fn();
    render(<MemoryRouter><ProductCard product={product} onAdd={onAdd} /></MemoryRouter>);
    expect(screen.getByText('Aurora Pro')).toBeInTheDocument();
    expect(screen.getByText('$249.00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /savatchaga/i }));
    expect(onAdd).toHaveBeenCalledWith(product);
  });

  test('ProductCard disables out-of-stock products', () => {
    render(<MemoryRouter><ProductCard product={{ ...product, stock: 0 }} onAdd={() => {}} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /savatchaga/i })).toBeDisabled();
  });

  test('ProgressRing and Badge', () => {
    render(<><ProgressRing value={70} label="Score" /><Badge>Zaif</Badge></>);
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('Zaif')).toBeInTheDocument();
  });

  test('Quiz submits answers to the API and shows the result', async () => {
    const spy = vi.spyOn(api, 'post').mockResolvedValue({
      data: { score: 100, passed: true, correct: 1, total: 1, results: [{ correct: true, answer: 1, explanation: 'To‘g‘ri' }], progress: {} },
    });
    const onGraded = vi.fn();
    render(<ToastProvider><Quiz labId="sqli" questions={[{ q: 'Savol?', options: ['A', 'B'] }]} onGraded={onGraded} /></ToastProvider>);
    const submit = screen.getByRole('button', { name: /yuborish/i });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByLabelText('B'));
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByText('Natija: 100%')).toBeInTheDocument());
    expect(spy).toHaveBeenCalledWith('/labs/sqli/quiz', { answers: [1] });
    expect(onGraded).toHaveBeenCalled();
  });
});
