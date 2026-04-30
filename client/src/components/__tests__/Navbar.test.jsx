import { render, screen, fireEvent } from '../../utils/test-utils';
import Navbar from '../Navbar';
import { describe, it, expect, vi } from 'vitest';

describe('Navbar Component', () => {
  it('renders the logo correctly', () => {
    render(<Navbar />);
    expect(screen.getByText(/Loko/i)).toBeInTheDocument();
    expect(screen.getByText(/nomy/i)).toBeInTheDocument();
  });

  it('renders main navigation links', () => {
    render(<Navbar />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Market')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  it('renders user profile info when logged in', () => {
    render(<Navbar />);
    // The default mock user name is "Test User", but Navbar shows the first name "Test"
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('toggles mobile menu when clicking the menu button', () => {
    render(<Navbar />);
    // Mocking mobile view is tricky with JSDOM, but we can check if the button exists
    const menuButton = screen.getByLabelText(/Toggle menu/i);
    expect(menuButton).toBeInTheDocument();
    
    fireEvent.click(menuButton);
    // After clicking, mobile specific links like "General Hub" might appear
    expect(screen.getByText(/General Hub/i)).toBeInTheDocument();
  });
});
