import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminStoryDetails from '../../admin/AdminStoryDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock AdminLayout
vi.mock('../../../layouts/AdminLayout', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="admin-layout">{children}</div>
  };
});

// Mock adminService
vi.mock('../../../services', () => {
  const mockService = {
    getStoryDetails: vi.fn(),
    deleteStory: vi.fn(),
  };
  return {
    __esModule: true,
    adminService: mockService,
  };
});

const mockStory = {
  _id: 's1',
  title: 'Local News Headline',
  type: 'News',
  content: 'This is a local news story about our community.',
  district: 'Mehsana',
  taluka: 'Kadi',
  locationAddress: 'Main Square, Kadi',
  isHighlighted: true,
  highlightCategory: 'Top News',
  image: 'story.png',
  author: 'Bob Reporter',
  authorId: {
    _id: 'u1',
    name: 'Bob Reporter',
    email: 'bob@news.com',
    phone: '1234567890',
    profilePic: 'bob.png',
    district: 'Mehsana'
  },
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000).toISOString()
};

const renderWithRoute = () => {
  return render(
    <Routes>
      <Route path="/admin/story/:id" element={<AdminStoryDetails />} />
    </Routes>,
    { initialEntries: ['/admin/story/s1'] }
  );
};

describe('AdminStoryDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getStoryDetails.mockResolvedValue({ data: mockStory });
    adminService.deleteStory.mockResolvedValue({ data: { success: true } });
  });

  it('renders story details and author information', async () => {
    renderWithRoute();
    
    // Wait for content to render (loading finished)
    await screen.findByRole('heading', { level: 1, name: /Local News Headline/i });
    
    expect(screen.getByText(/This is a local news story about our community./i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bob Reporter/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/bob@news.com/i)).toBeInTheDocument();
  });

  it('handles story deletion via modal', async () => {
    renderWithRoute();
    
    await screen.findByRole('heading', { level: 1, name: /Local News Headline/i });

    const deleteBtn = screen.getAllByRole('button', { name: /Delete Story/i })[0];
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Delete Story\?/i)).toBeDefined();

    const confirmDeleteBtn = screen.getAllByRole('button', { name: "Delete" })[0];
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(adminService.deleteStory).toHaveBeenCalledWith('s1');
    });
  });

  it('shows not found screen on error', async () => {
    adminService.getStoryDetails.mockRejectedValueOnce(new Error('Not Found'));
    
    renderWithRoute();
    
    await screen.findByText(/Not Found/i);
  });
});
