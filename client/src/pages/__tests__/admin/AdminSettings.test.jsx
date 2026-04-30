import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminSettings from '../../admin/AdminSettings';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getPlatformSettings: vi.fn().mockResolvedValue({
      data: {
        maintenanceMode: false,
        seo: { homeTitle: 'Lokonomy Home', homeMetaDescription: 'Local Economy' },
        socialLinks: { facebook: 'fb.com' },
        platformFees: { orderCommissionPercentage: 5, listingFee: 100 },
        moderation: { autoFlagThreshold: 5, autoNotifyAdmins: true }
      }
    }),
    updatePlatformSettings: vi.fn().mockResolvedValue({ data: { success: true } }),
    toggleMaintenanceMode: vi.fn().mockResolvedValue({
      data: { settings: { maintenanceMode: true } }
    }),
  }
}));

describe('AdminSettings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders platform settings correctly', async () => {
    render(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Platform Settings')[0]).toBeDefined();
      expect(screen.getByDisplayValue('support@lokonomy.com')).toBeDefined();
    });
  });

  it('switches tabs and updates settings', async () => {
    render(<AdminSettings />);
    
    await waitFor(() => screen.getAllByText('Platform Settings')[0]);

    const seoTab = screen.getAllByRole('button', { name: /SEO & Meta/i })[0];
    fireEvent.click(seoTab);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Lokonomy Home')).toBeDefined();
    });

    const titleInput = screen.getByDisplayValue('Lokonomy Home');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    
    expect(screen.getByDisplayValue('New Title')).toBeDefined();
  });

  it('handles settings save', async () => {
    render(<AdminSettings />);
    
    await waitFor(() => screen.getAllByText('Platform Settings')[0]);

    const saveBtn = screen.getAllByRole('button', { name: /Save Configuration/i })[0];
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminService.updatePlatformSettings).toHaveBeenCalled();
    });
  });

  it('toggles maintenance mode', async () => {
    render(<AdminSettings />);
    
    await waitFor(() => screen.getAllByText('Platform Settings')[0]);

    const maintenanceBtn = screen.getByText(/Maintenance:/i);
    fireEvent.click(maintenanceBtn);

    await waitFor(() => {
      expect(adminService.toggleMaintenanceMode).toHaveBeenCalled();
      expect(screen.getByText(/Maintenance: ON/i)).toBeDefined();
    });
  });
});

