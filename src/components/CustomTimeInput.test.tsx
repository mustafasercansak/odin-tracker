import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CustomTimeInput } from './CustomTimeInput';
import { beforeEach } from 'vitest';

describe('CustomTimeInput Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with label and value correctly formatted', () => {
    render(<CustomTimeInput label="Test Time" value="14:30" onChange={mockOnChange} />);
    expect(screen.getByLabelText('Test Time')).toBeInTheDocument();
    expect(screen.getByDisplayValue('14.30')).toBeInTheDocument();
  });

  it('calls onChange with HH:mm format when a valid time is typed', () => {
    render(<CustomTimeInput label="Test Time" value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('HH.mm');
    
    // Type a full time using the dot separator as expected by Turkish standards
    fireEvent.change(input, { target: { value: '09.45' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('09:45');
  });

  it('does not call onChange for invalid hours or minutes', () => {
    render(<CustomTimeInput label="Test Time" value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('HH.mm');
    
    // Invalid hour
    fireEvent.change(input, { target: { value: '25.00' } });
    expect(mockOnChange).not.toHaveBeenCalled();
    
    // Invalid minute
    fireEvent.change(input, { target: { value: '12.61' } });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('shows error message when provided', () => {
    render(<CustomTimeInput label="Test Time" value="" onChange={mockOnChange} error="Invalid time" />);
    expect(screen.getByText('Invalid time')).toBeInTheDocument();
  });
});
