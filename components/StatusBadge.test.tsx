import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

describe('StatusBadge', () => {
  it('should have a readability-compliant font size and rounded-md shape', () => {
    render(<StatusBadge status="BARU" />);
    const badge = screen.getByText('BARU');
    
    // Check for readable font size (text-xs is 12px)
    expect(badge).toHaveClass('text-xs');
    // Check for "Stamp" shape (rounded-md)
    expect(badge).toHaveClass('rounded-md');
  });
});
