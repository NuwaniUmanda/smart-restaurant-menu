import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Smart Restaurant heading', () => {
  render(<App />);
  const heading = screen.getByText(/smart restaurant/i);
  expect(heading).toBeInTheDocument();
});
