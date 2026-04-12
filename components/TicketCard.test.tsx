import { render, screen } from '@testing-library/react';
import TicketCard from './TicketCard';
import { describe, it, expect } from 'vitest';

const mockTicket = {
  id: '1',
  ticket_no: 'SM-001',
  asset_name: 'Stethoscope',
  status: 'BARU',
  location: 'Wad 1',
  created_at: new Date().toISOString()
};

describe('TicketCard', () => {
  it('should have high-visibility feedback and readable text', () => {
    render(<TicketCard ticket={mockTicket} />);
    const card = screen.getByRole('link');
    
    // Check for high-contrast secondary info
    const location = screen.getByText('Wad 1');
    expect(location).toHaveClass('text-slate-500'); // Fails if slate-400
    
    // Check for tactile hover state
    expect(card.firstChild).toHaveClass('hover:bg-blue-50'); // Fails if blue-50/30
  });
});
