import { render, screen } from '@testing-library/react';
import TicketCard from './TicketCard';
import { describe, it, expect, vi } from 'vitest';
import type { DisposalTicket } from '@/lib/supabase/types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockTicket: DisposalTicket = {
  id: '1',
  ticket_no: 'SM-001',
  asset_condition: "rosak",
  category: "harta_modal",
  sub_category: "alat_perubatan",
  serial_no: "SN123",
  asset_type: "Kerusi Roda",
  radicare_asset_no: null,
  purchase_date: "2024-01-01",
  purchase_price: 1000,
  status: "menunggu_semakan",
  disposal_method: null,
  rejection_reason: null,
  image_url: null,
  cert_url: null,
  borang_ca_url: null,
  created_by: 'user-1',
  reviewed_by: null,
  completed_by: null,
  location: 'Wad 1',
  created_at: new Date().toISOString(),
  reviewed_at: null,
  completed_at: null,
  updated_at: new Date().toISOString(),
};

describe('TicketCard', () => {
  it('should have high-visibility feedback and institutional styling', () => {
    render(<TicketCard ticket={mockTicket} />);
    
    // Check for ticket number with brand primary color
    const ticketNo = screen.getByText('SM-001');
    expect(ticketNo).toHaveClass('text-[var(--primary)]');
    
    // Check for tactile active state from ListItem
    const button = screen.getByRole('button');
    expect(button.firstChild).toHaveClass('active:bg-[var(--primary-tint)]');
  });
});
