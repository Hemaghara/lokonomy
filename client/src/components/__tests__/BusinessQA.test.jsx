import { render, screen, waitFor } from '../../utils/test-utils';
import BusinessQA from '../BusinessQA';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { qaService } from '../../services';
import { useUser } from '../../context/UserContext';

vi.mock('../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    qaService: {
      getQuestions: vi.fn(),
      postQuestion: vi.fn(),
      postAnswer: vi.fn(),
      deleteQuestion: vi.fn(),
      upvoteQuestion: vi.fn()
    }
  };
});
 
vi.mock('../../context/UserContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: vi.fn()
  };
});

describe('BusinessQA Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    useUser.mockReturnValue({ user: null });
    qaService.getQuestions.mockReturnValue(new Promise(() => {}));
    render(<BusinessQA businessId="1" />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders questions', async () => {
    useUser.mockReturnValue({ user: null });
    qaService.getQuestions.mockResolvedValueOnce({
      data: [{ _id: 'q1', question: 'Test Q?', answers: [], upvotes: [], askedByName: 'User' }]
    });

    render(<BusinessQA businessId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Q?')).toBeInTheDocument();
    });
  });

  it('shows login button if not logged in', async () => {
    useUser.mockReturnValue({ user: null });
    qaService.getQuestions.mockResolvedValueOnce({ data: [] });
    
    render(<BusinessQA businessId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Login to Ask')).toBeInTheDocument();
    });
  });
});
