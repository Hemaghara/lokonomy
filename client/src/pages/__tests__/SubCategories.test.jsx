import React from 'react';
import { render, screen, fireEvent } from '../../utils/test-utils';
import SubCategories from '../SubCategories';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categories } from '../../data/categories';

// Mock react-router-dom
const mockParams = { categoryName: 'Daily Needs' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockParams,
    useNavigate: () => vi.fn(),
  };
});

describe('SubCategories Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.categoryName = 'Daily Needs';
  });

  it('renders category and its subcategories', () => {
    const category = categories.find(c => c.name === 'Daily Needs');
    render(<SubCategories />);
    
    expect(screen.getByText(category.name)).toBeDefined();
    expect(screen.getByText(new RegExp(`${category.subcategories.length}\\s+sub-categories`, 'i'))).toBeDefined();
    
    // Check first subcategory
    expect(screen.getByText(category.subcategories[0].name)).toBeDefined();
  });

  it('filters subcategories by search', () => {
    const category = categories.find(c => c.name === 'Daily Needs');
    render(<SubCategories />);
    
    const searchInput = screen.getByPlaceholderText(/Search sub-categories/i);
    fireEvent.change(searchInput, { target: { value: category.subcategories[0].name } });

    expect(screen.getByText(category.subcategories[0].name)).toBeDefined();
    if (category.subcategories.length > 1) {
      expect(screen.queryByText(category.subcategories[1].name)).toBeNull();
    }
  });

  it('handles subcategory selection', () => {
    render(<SubCategories />);
    const category = categories.find(c => c.name === 'Daily Needs');
    const subCard = screen.getByText(category.subcategories[0].name);
    fireEvent.click(subCard);
    // Selection handled by Link/Navigate
  });

  it('shows error state when category not found', () => {
    mockParams.categoryName = 'Unknown';
    render(<SubCategories />);
    expect(screen.getByText(/Category Not Found/i)).toBeDefined();
  });
});

