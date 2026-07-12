import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App';

// Mock child components to keep unit test simple and focused on App shell layout and state
vi.mock('../components/ChatAssistant', () => ({
  ChatAssistant: () => <div data-testid="chat-assistant">Chat Assistant Mock</div>
}));

vi.mock('../components/MapView', () => ({
  MapView: () => <div data-testid="map-view">Map View Mock</div>
}));

vi.mock('../components/OpsDashboard', () => ({
  OpsDashboard: () => <div data-testid="ops-dashboard">Ops Dashboard Mock</div>
}));

vi.mock('../lib/api', () => ({
  api: {
    getTransitSuggestions: vi.fn().mockResolvedValue({
      origin: 'Plaza Fan Zone',
      destination: 'MetLife Stadium',
      options: [
        {
          mode: 'electric_shuttle',
          route_name: 'Green Shuttle 1',
          eta_minutes: 10,
          co2_grams: 50,
          co2_saved: 200,
          sustainability_badge: 'Eco-Hero',
          cost_dollars: 0,
          accessibility_features: ['Step-free boarding']
        }
      ],
      sustainability_tip: 'Take the electric shuttle to save CO₂!'
    }),
    getRoute: vi.fn(),
    getCrowdStatus: vi.fn(),
    getOpsSummary: vi.fn()
  }
}));

describe('App Shell Layout and Interaction', () => {
  it('renders header title and defaults to Fan View', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /AI Stadium Companion/i })).toBeDefined();
    expect(screen.getByTestId('chat-assistant')).toBeDefined();
    expect(screen.getByTestId('map-view')).toBeDefined();
  });

  it('switches tabs on header nav click', () => {
    render(<App />);
    const staffTabButton = screen.getByRole('button', { name: /Staff Ops/i });
    fireEvent.click(staffTabButton);
    expect(screen.getByTestId('ops-dashboard')).toBeDefined();
  });

  it('switches to Eco-Transit tab and displays the transit planner', async () => {
    render(<App />);
    const transitTabButton = screen.getByRole('button', { name: /Eco-Transit/i });
    fireEvent.click(transitTabButton);
    const heading = await screen.findByText(/Eco-Friendly Transit/i);
    expect(heading).toBeDefined();
  });

  it('contains the accessibility skip-link', () => {
    render(<App />);
    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });

  it('toggles high contrast mode on button click', () => {
    render(<App />);
    const contrastButton = screen.getByRole('button', { name: /Enable high contrast theme/i });
    expect(contrastButton).toBeDefined();
    fireEvent.click(contrastButton);
    // After toggle, aria-label should switch to disable
    const updatedButton = screen.getByRole('button', { name: /Disable high contrast theme/i });
    expect(updatedButton).toBeDefined();
  });
});
