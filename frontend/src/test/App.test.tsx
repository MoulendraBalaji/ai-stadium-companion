import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App';

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
          mode: 'Electric Shuttle',
          name: 'Green Shuttle 1',
          duration_minutes: 10,
          co2_grams: 50,
          accessibility_features: ['Step-free boarding'],
          recommendation_reason: 'Zero emissions.'
        }
      ],
      sustainability_tip: 'Take the electric shuttle!'
    }),
    getRoute: vi.fn(),
    getCrowdStatus: vi.fn(),
    getOpsSummary: vi.fn()
  }
}));

describe('App Shell Layout and Interaction', () => {
  it('renders the StadiumOS brand and defaults to Fan Hub view', () => {
    render(<App />);
    expect(screen.getByText(/StadiumOS/)).toBeDefined();
    expect(screen.getByTestId('chat-assistant')).toBeDefined();
    expect(screen.getByTestId('map-view')).toBeDefined();
  });

  it('switches to Command tab on nav click', () => {
    render(<App />);
    const commandTab = screen.getByRole('button', { name: /Command/i });
    fireEvent.click(commandTab);
    expect(screen.getByTestId('ops-dashboard')).toBeDefined();
  });

  it('switches to Transit tab and displays the transit planner', async () => {
    render(<App />);
    const transitTab = screen.getByRole('button', { name: /Transit/i });
    fireEvent.click(transitTab);
    const heading = await screen.findByText(/Eco-Transit Navigator/i);
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
    const contrastButton = screen.getByRole('button', { name: /Enable high contrast/i });
    expect(contrastButton).toBeDefined();
    fireEvent.click(contrastButton);
    const updatedButton = screen.getByRole('button', { name: /Disable high contrast/i });
    expect(updatedButton).toBeDefined();
  });
});
