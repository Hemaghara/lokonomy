import { render, screen } from '../../utils/test-utils';
import ChatBox from '../ChatBox';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUser } from '../../context/UserContext';

vi.mock('../../context/UserContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: vi.fn()
  };
});
 
vi.mock('../../services/socket', () => ({
  connectSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  sendMessage: vi.fn(),
  emitTyping: vi.fn(),
  emitStopTyping: vi.fn(),
  emitMarkRead: vi.fn()
}));
 
vi.mock('../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    chatService: {
      getMessages: vi.fn().mockResolvedValue({ data: [] }),
      getBusinessMessages: vi.fn().mockResolvedValue({ data: [] })
    }
  };
});
 
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('ChatBox Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing if no user', () => {
    useUser.mockReturnValue({ user: null });
    render(<ChatBox productId="1" sellerId="2" />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders chat box if user exists', () => {
    useUser.mockReturnValue({ user: { id: 'u1' } });
    render(<ChatBox productId="1" sellerId="2" onClose={vi.fn()} />);
    expect(screen.getByText(/Loading messages|No messages/i)).toBeInTheDocument();
  });
});
