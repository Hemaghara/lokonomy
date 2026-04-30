# Lokonomy Testing Guide

This document explains how to run and write tests for the Lokonomy frontend.

## 1. Getting Started

### Prerequisites
Ensure you have installed the testing dependencies:
```bash
npm install
```

### Running Tests
- **Unit & Integration Tests (Vitest)**:
  ```bash
  npm run test
  ```
  This will start Vitest in watch mode.
- **E2E Tests (Playwright)**:
  ```bash
  npx playwright test
  ```

---

## 2. Test Types & Locations

### Unit & Integration Tests
- **Location**: `src/pages/__tests__/` or `src/components/__tests__/`
- **Extension**: `.test.jsx`
- **Tool**: Vitest + React Testing Library
- **Purpose**: Testing component rendering, user interactions, and state changes.

### End-to-End (E2E) Tests
- **Location**: `tests/e2e/`
- **Extension**: `.spec.js`
- **Tool**: Playwright
- **Purpose**: Testing real user flows across multiple pages.

---

## 3. Best Practices

1.  **Mocking APIs**: Use `msw` (Mock Service Worker) for integration tests to avoid making real network requests.
2.  **Context Providers**: Always wrap components with necessary providers (e.g., `UserProvider`, `BrowserRouter`) in your tests.
3.  **Data-Test-Id**: Use `data-testid` attributes on elements that are hard to select by role or text.
4.  **Priority**: Focus on testing critical paths first (Authentication, Business Registration, Checkout).

---

## 4. Example: Adding a New Test

To test a new page `MyPage.jsx`:
1. Create `src/pages/__tests__/MyPage.test.jsx`.
2. Add the following boilerplate:
```javascript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyPage from '../MyPage';

test('renders MyPage', () => {
  render(
    <BrowserRouter>
      <MyPage />
    </BrowserRouter>
  );
  expect(screen.getByText(/Welcome/i)).toBeDefined();
});
```
