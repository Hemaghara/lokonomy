import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LocationProvider } from '../context/LocationContext';
import { UserProvider } from '../context/UserContext';
import { ComparisonProvider } from '../context/ComparisonContext';
import { ConfirmProvider } from '../context/ConfirmContext';
import { Toaster } from 'react-hot-toast';
import { vi } from 'vitest';

window.scrollTo = vi.fn();
window.confirm = vi.fn(() => true);

// Set default user in localStorage for tests
const mockUser = {
  id: 'mock-user-id',
  _id: 'mock-user-id',
  name: 'Test User',
  email: 'test@example.com',
  plan: 'free',
  locationName: 'Test City',
};

const mockAdmin = {
  id: 'admin-1',
  name: 'Global Admin',
  role: 'superadmin',
  email: 'admin@lokonomy.com'
};

if (typeof window !== 'undefined') {
  if (!localStorage.getItem('lokonomy_user')) {
    localStorage.setItem('lokonomy_user', JSON.stringify(mockUser));
  }
  if (!localStorage.getItem('adminInfo')) {
    localStorage.setItem('adminInfo', JSON.stringify(mockAdmin));
  }
}

const SafeToaster = (() => {
  try { return Toaster; } catch (e) { return null; }
})() || (() => null);

const SafeLocationProvider = (() => {
  try { return LocationProvider; } catch (e) { return null; }
})() || (({ children }) => <>{children}</>);

const SafeConfirmProvider = (() => {
  try { return ConfirmProvider; } catch (e) { return null; }
})() || (({ children }) => <>{children}</>);

const SafeUserProvider = (() => {
  try { return UserProvider; } catch (e) { return null; }
})() || (({ children }) => <>{children}</>);

const SafeComparisonProvider = (() => {
  try { return ComparisonProvider; } catch (e) { return null; }
})() || (({ children }) => <>{children}</>);

const AllTheProviders = ({ children, initialEntries = ['/'] }) => {
  return (
    <HelmetProvider>
      <SafeToaster />
      <SafeLocationProvider>
        <SafeConfirmProvider>
          <SafeUserProvider>
            <SafeComparisonProvider>
              <MemoryRouter initialEntries={initialEntries}>
                {children}
              </MemoryRouter>
            </SafeComparisonProvider>
          </SafeUserProvider>
        </SafeConfirmProvider>
      </SafeLocationProvider>
    </HelmetProvider>
  );
};

const customRender = (ui, { initialEntries, ...options } = {}) =>
  render(ui, { 
    wrapper: (props) => <AllTheProviders {...props} initialEntries={initialEntries} />, 
    ...options 
  });

export * from '@testing-library/react';

export { customRender as render };
