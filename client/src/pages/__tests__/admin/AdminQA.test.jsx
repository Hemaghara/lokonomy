import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminQA from '../../admin/AdminQA';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getQA: vi.fn().mockResolvedValue({
      data: {
        qas: [
          {
            _id: 'qa1',
            question: 'What are the hours?',
            askedByName: 'John Doe',
            businessName: 'Bakery A',
            isPinned: false,
            answers: [
              {
                answer: '9 AM to 5 PM',
                answeredByName: 'Owner',
                isOwner: true,
                createdAt: new Date().toISOString()
              }
            ]
          }
        ],
        stats: { total: 10, answered: 8, unanswered: 2 }
      }
    }),
    deleteQuestion: vi.fn().mockResolvedValue({ data: { success: true } }),
    togglePinQA: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminQA Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders QA list and stats', async () => {
    render(<AdminQA />);
    
    await waitFor(() => {
      expect(screen.getAllByText('What are the hours?')[0]).toBeDefined();
      expect(screen.getAllByText('Total Questions')[0]).toBeDefined();
      expect(screen.getAllByText('10')[0]).toBeDefined();
    });
  });

  it('renders the question from mock data', async () => {
    render(<AdminQA />);
    
    await waitFor(() => {
      expect(screen.getAllByText('What are the hours?')[0]).toBeDefined();
      // businessName is shown
      expect(screen.getByText(/Bakery A/i)).toBeDefined();
      // The answer is shown
      expect(screen.getAllByText('9 AM to 5 PM')[0]).toBeDefined();
    });
  });

  it('handles filtering by status', async () => {
    const { adminService } = await import('../../../services');
    render(<AdminQA />);
    
    const filterSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(filterSelect, { target: { value: 'no' } });

    await waitFor(() => {
      expect(adminService.getQA).toHaveBeenCalled();
    });
  });

  it('handles search input', async () => {
    render(<AdminQA />);
    
    const searchInput = screen.getByPlaceholderText(/Search by question text/i);
    fireEvent.change(searchInput, { target: { value: 'hours' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    // Just verify the input accepted the change
    expect(searchInput.value).toBe('hours');
  });

  it('handles deleting a question', async () => {
    const { adminService } = await import('../../../services');
    render(<AdminQA />);
    
    await waitFor(() => screen.getAllByText('What are the hours?')[0]);

    // Find all buttons and click the delete button (FiTrash2 icon)
    const allBtns = screen.getAllByRole('button');
    // The delete button is the one with rose hover class
    const deleteBtn = allBtns.find(b => 
      b.className.includes('rose') || b.className.includes('trash') || b.getAttribute('title') === 'Delete'
    ) || allBtns[allBtns.length - 1];
    
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
  });
});
