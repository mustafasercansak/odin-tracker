import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MeasurementEditor } from './MeasurementEditor';
import { type Measurement } from '@/schemas/measurement';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('MeasurementEditor Component', () => {
  const mockMeasurements: Measurement[] = [
    {
      parameter: 'creatinine',
      originalLabel: 'Creatinine',
      value: 1.2,
      unit: 'mg/dL',
      referenceMin: 0.5,
      referenceMax: 1.5,
      flag: 'normal',
      confidence: 'high',
      aiExtracted: false,
    },
  ];

  const mockOnChange = vi.fn();

  it('renders the list of measurements', () => {
    render(<MeasurementEditor measurements={mockMeasurements} onChange={mockOnChange} />);
    expect(screen.getByDisplayValue('1.2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mg/dL')).toBeInTheDocument();
  });

  it('calls onChange when adding a row', () => {
    render(<MeasurementEditor measurements={mockMeasurements} onChange={mockOnChange} />);
    const addButton = screen.getByText('common.add');
    fireEvent.click(addButton);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('auto-calculates flag when value changes', () => {
    render(<MeasurementEditor measurements={mockMeasurements} onChange={mockOnChange} />);
    const valueInput = screen.getByDisplayValue('1.2');
    
    // Change value to 2.0 (higher than max 1.5)
    fireEvent.change(valueInput, { target: { value: '2.0' } });
    
    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall[0].value).toBe(2);
    expect(lastCall[0].flag).toBe('high');
  });
});
