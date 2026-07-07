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
});
