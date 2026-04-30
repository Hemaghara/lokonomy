import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import NotificationBell from '../NotificationBell';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUser } from '../../context/UserContext';
import { notificationService } from '../../services';
import { connectSocket } from '../../services/socket';

vi.mock('../../context/UserContext', () => ({
  useUser: vi.fn(),
  UserProvider: ({ children }) => <div data-testid="user-provider">{children}</div>
}));

vi.mock('../../services', () => ({
  notificationService: {
    getUnreadCount: vi.fn(),
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn()
  }
}));

vi.mock('../../services/socket', () => ({
  connectSocket: vi.fn()
}));

describe('NotificationBell Component', () => {
  let mockSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = {
      on: vi.fn(),
      off: vi.fn()
    };
    connectSocket.mockReturnValue(mockSocket);
  });

  it('renders bell button', () => {
    useUser.mockReturnValue({ user: null });
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: /Notifications/i })).toBeInTheDocument();
  });

  it('fetches unread count and shows badge', async () => {
    useUser.mockReturnValue({ user: { id: 'u1' } });
    notificationService.getUnreadCount.mockResolvedValueOnce({ data: { success: true, count: 5 } });
    
    render(<NotificationBell />);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('opens dropdown and fetches notifications on click', async () => {
    useUser.mockReturnValue({ user: { id: 'u1' } });
    notificationService.getUnreadCount.mockResolvedValueOnce({ data: { success: true, count: 0 } });
    notificationService.getNotifications.mockResolvedValueOnce({ 
      data: { 
        success: true, 
        notifications: [{ _id: '1', title: 'Test Notif', message: 'Hello', read: false, createdAt: new Date() }] 
      } 
    });
    
    render(<NotificationBell />);
    
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Test Notif')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });
});
