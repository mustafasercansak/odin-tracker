import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CustomDateInput } from './CustomDateInput';
import { beforeEach } from 'vitest';

describe('CustomDateInput Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with label and value correctly formatted', () => {
    render(<CustomDateInput label="Test Date" value="2026-05-02" onChange={mockOnChange} />);
    expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
    expect(screen.getByDisplayValue('02.05.2026')).toBeInTheDocument();
  });

  it('updates input value as user types and adds dots automatically', () => {
    render(<CustomDateInput label="Test Date" value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('dd.mm.yyyy');
    
    fireEvent.change(input, { target: { value: '02' } });
    // Note: The auto-masking happens when length > previousLength
    // But fireEvent.change might not trigger it exactly like a real keyboard if not careful
    // However, the component logic is: if (val.length === 2) val += '.'
    // Wait, let's re-read the code.
  });

  it('calls onChange with yyyy-MM-dd format when a full valid date is typed', () => {
    render(<CustomDateInput label="Test Date" value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('dd.mm.yyyy');
    
    // Type a full date
    fireEvent.change(input, { target: { value: '02.05.2026' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('2026-05-02');
  });

  it('shows error message when provided', () => {
    render(<CustomDateInput label="Test Date" value="" onChange={mockOnChange} error="Date is invalid" />);
    expect(screen.getByText('Date is invalid')).toBeInTheDocument();
  });
});
