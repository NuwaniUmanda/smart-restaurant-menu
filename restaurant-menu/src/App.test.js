import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock our firebase wrapper to avoid initializing Firebase SDK in tests
jest.mock('./services/firebase', () => ({
  auth: {},
  db: {},
}));

// Mock Firebase auth listener to immediately resolve
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, cb) => {
    cb(null);
    return () => {};
  },
}));

test('renders welcome page', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText(/welcome/i)).toBeInTheDocument());
});