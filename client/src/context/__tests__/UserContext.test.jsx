import { render, screen, act, fireEvent } from '@testing-library/react';
import { UserProvider, useUser } from '../UserContext';
import { LocationProvider } from '../LocationContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services';

// Mock services
vi.mock('../../services', () => ({
  authService: {
    getMe: vi.fn(),
  },
}));

vi.mock('../../services/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

const TestComponent = () => {
  const { user, login, logout } = useUser();
  return (
    <div>
      <div data-testid="user-email">{user ? user.email : 'No User'}</div>
      <button onClick={() => login({ email: 'test@test.com', token: '123' })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('UserContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides initial null user', () => {
    render(
      <LocationProvider>
        <UserProvider>
          <TestComponent />
        </UserProvider>
      </LocationProvider>
    );
    expect(screen.getByTestId('user-email').textContent).toBe('No User');
  });

  it('updates state on login', async () => {
    render(
      <LocationProvider>
        <UserProvider>
          <TestComponent />
        </UserProvider>
      </LocationProvider>
    );
    
    const loginBtn = screen.getByText('Login');
    fireEvent.click(loginBtn);
    
    expect(screen.getByTestId('user-email').textContent).toBe('test@test.com');
    expect(localStorage.getItem('lokonomy_user')).toContain('test@test.com');
  });

  it('clears state on logout', () => {
    localStorage.setItem('lokonomy_user', JSON.stringify({ email: 'saved@test.com' }));
    
    render(
      <LocationProvider>
        <UserProvider>
          <TestComponent />
        </UserProvider>
      </LocationProvider>
    );
    
    expect(screen.getByTestId('user-email').textContent).toBe('saved@test.com');
    
    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);
    
    expect(screen.getByTestId('user-email').textContent).toBe('No User');
    expect(localStorage.getItem('lokonomy_user')).toBeNull();
  });
});
