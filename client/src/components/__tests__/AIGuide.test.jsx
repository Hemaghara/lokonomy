import { render, screen, fireEvent } from '../../utils/test-utils';
import AIGuide from '../AIGuide';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    askLocalGuide: vi.fn(),
    businessService: { getBusinesses: vi.fn() },
    storyService: { getStories: vi.fn() },
    jobService: { getJobs: vi.fn() }
  };
});
 
vi.mock('../../context/UserContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: () => ({ user: { id: 'u1', name: 'Test' } })
  };
});
 
vi.mock('../../context/LocationContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useLocation: () => ({
      state: 'State',
      district: 'District',
      taluka: 'Taluka',
      setState: vi.fn(),
      setDistrict: vi.fn(),
      setTaluka: vi.fn()
    })
  };
});

describe('AIGuide Component', () => {
  it('renders the floating button initially', () => {
    render(<AIGuide />);
    expect(screen.getByLabelText('Open chat')).toBeInTheDocument();
  });

  it('opens chat window when button is clicked', () => {
    render(<AIGuide />);
    fireEvent.click(screen.getByLabelText('Open chat'));
    expect(screen.getByText('Local Guide')).toBeInTheDocument();
  });
});
