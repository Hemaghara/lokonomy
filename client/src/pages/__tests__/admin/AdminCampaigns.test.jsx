import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminCampaigns from '../../admin/AdminCampaigns';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getCampaigns: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'camp1',
          name: 'Renewal Drive',
          status: 'draft',
          notification: { title: 'Renew Now!' },
          stats: { targetedCount: 100, sentCount: 0, openedCount: 0 }
        }
      ]
    }),
    previewSegment: vi.fn().mockResolvedValue({
      data: {
        count: 50,
        sample: [{ _id: 'u1', name: 'John Doe', email: 'john@test.com' }]
      }
    }),
    createCampaign: vi.fn().mockResolvedValue({ data: { success: true } }),
    sendCampaign: vi.fn().mockResolvedValue({ data: { message: 'Campaign sent!' } }),
    deleteCampaign: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminCampaigns Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders campaigns list', async () => {
    render(<AdminCampaigns />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Renewal Drive')[0]).toBeDefined();
      expect(screen.getAllByText('draft')[0]).toBeDefined();
      expect(screen.getByText(/Renew Now!/i)).toBeDefined();
    });
  });

  it('opens creation modal and handles segment preview', async () => {
    render(<AdminCampaigns />);
    
    const newBtn = screen.getAllByRole('button', { name: /New Campaign/i })[0];
    fireEvent.click(newBtn);

    expect(screen.getAllByText('Create Campaign')[0]).toBeDefined();

    const previewBtn = screen.getAllByText('Preview segment →')[0];
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(screen.getAllByText('50 users targeted')[0]).toBeDefined();
      expect(screen.getAllByText('John Doe · john@test.com')[0]).toBeDefined();
    });
  });

  it('handles campaign creation', async () => {
    render(<AdminCampaigns />);
    
    fireEvent.click(screen.getAllByRole('button', { name: /New Campaign/i })[0]);

    const nameInput = screen.getByPlaceholderText(/e.g. July Renewal Push/i);
    fireEvent.change(nameInput, { target: { value: 'New Campaign' } });

    const titleInput = screen.getByPlaceholderText(/Notification Title \*/i);
    fireEvent.change(titleInput, { target: { value: 'Hey there' } });

    const bodyInput = screen.getByPlaceholderText(/Notification body message \*/i);
    fireEvent.change(bodyInput, { target: { value: 'Check this out' } });

    const submitBtn = screen.getAllByRole('button', { name: /Create Campaign/i })[0];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminService.createCampaign).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Campaign',
        notification: expect.objectContaining({ title: 'Hey there' })
      }));
    });
  });

  it('handles campaign sending', async () => {
    render(<AdminCampaigns />);
    
    await waitFor(() => screen.getAllByText('Renewal Drive')[0]);

    const sendBtn = screen.getAllByRole('button', { name: /Send Now/i })[0];
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(adminService.sendCampaign).toHaveBeenCalledWith('camp1');
    });
  });

  it('handles campaign deletion', async () => {
    render(<AdminCampaigns />);
    
    await waitFor(() => screen.getAllByText('Renewal Drive')[0]);

    const deleteBtn = screen.getByLabelText('Delete Campaign');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(adminService.deleteCampaign).toHaveBeenCalledWith('camp1');
    });
  });

  it('handles campaign form inputs and cancel', async () => {
    render(<AdminCampaigns />);
    
    // Open modal
    fireEvent.click(screen.getAllByRole('button', { name: /New Campaign/i })[0]);

    // Toggle plans
    const freePlanBtn = screen.getByRole('button', { name: /free/i });
    fireEvent.click(freePlanBtn); // Toggle on
    expect(freePlanBtn).toHaveClass('bg-indigo-600');
    fireEvent.click(freePlanBtn); // Toggle off

    // Min Loyalty Points
    const minPointsInput = screen.getByPlaceholderText('0');
    fireEvent.change(minPointsInput, { target: { value: '100' } });
    expect(minPointsInput).toHaveValue(100);

    // Inactive Since (lastLoginBefore)
    const dateInputs = screen.getAllByRole('textbox').filter(input => input.type === 'date' || input.className.includes('scheme-dark'));
    // Actually input[type="date"] might not be returned by getByRole('textbox'), we can select by previous label
    const dateInput = minPointsInput.parentElement.nextElementSibling.querySelector('input');
    fireEvent.change(dateInput, { target: { value: '2023-01-01' } });
    expect(dateInput).toHaveValue('2023-01-01');

    // Click Cancel
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Form should close
    await waitFor(() => {
      expect(screen.queryByText('Create Campaign')).not.toBeInTheDocument();
    });
  });

  it('handles campaign type change and closing modal via X button', async () => {
    render(<AdminCampaigns />);
    
    // Open modal
    fireEvent.click(screen.getAllByRole('button', { name: /New Campaign/i })[0]);

    // Change campaign type
    const typeSelect = screen.getByRole('combobox');
    fireEvent.change(typeSelect, { target: { value: 'recurring' } });
    expect(typeSelect).toHaveValue('recurring');

    // Close modal via X button
    // The X button is a button containing an SVG, it might be found by its parent or custom test id.
    // We can select it by finding the button that is inside the header of the modal.
    const createCampaignHeading = screen.getAllByText('Create Campaign')[0];
    const xButton = createCampaignHeading.nextElementSibling;
    fireEvent.click(xButton);

    await waitFor(() => {
      expect(screen.queryByText('Create Campaign')).not.toBeInTheDocument();
    });
  });
});

