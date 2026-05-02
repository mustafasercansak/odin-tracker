import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(mockOnChange.mock.calls[0][0]).toHaveLength(2);
  });

  it('calls onChange when removing a row', () => {
    render(<MeasurementEditor measurements={mockMeasurements} onChange={mockOnChange} />);
    // The trash button is hidden by opacity-0 group-hover:opacity-100, 
    // but fireEvent.click should still work if we find it.
    const removeButton = screen.getByRole('button', { name: '' }); // Trash2 icon button
    fireEvent.click(removeButton);
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('auto-fills unit when parameter changes', () => {
    render(<MeasurementEditor measurements={mockMeasurements} onChange={mockOnChange} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'bun' } });
    
    expect(mockOnChange).toHaveBeenCalled();
    const lastCall = mockOnChange.mock.calls[0][0];
    expect(lastCall[0].parameter).toBe('bun');
    expect(lastCall[0].unit).toBe('mg/dL'); // BUN default unit
  });

  it('updates unit manually', () => {
    render(<MeasurementEditor measurements={mockMeasurements} onChange={mockOnChange} />);
    const unitInput = screen.getByDisplayValue('mg/dL');
    fireEvent.change(unitInput, { target: { value: 'g/L' } });
    
    const lastCall = mockOnChange.mock.calls[0][0];
    expect(lastCall[0].unit).toBe('g/L');
  });

  it('updates reference range and recalculates flags (low)', () => {
    render(<MeasurementEditor measurements={mockMeasurements} onChange={mockOnChange} />);
    const minInput = screen.getAllByPlaceholderText('—')[0];

    // Set min to 2.0 while value is 1.2 -> should be 'low'
    fireEvent.change(minInput, { target: { value: '2.0' } });

    const lastCall = mockOnChange.mock.calls[0][0];
    expect(lastCall[0].flag).toBe('low');
  });

  it('updates reference range and recalculates flags (high)', () => {
    render(<MeasurementEditor measurements={mockMeasurements} onChange={mockOnChange} />);
    const maxInput = screen.getAllByPlaceholderText('—')[1];

    // Set max to 1.0 while value is 1.2 -> should be 'high'
    fireEvent.change(maxInput, { target: { value: '1.0' } });

    const lastCall = mockOnChange.mock.calls[0][0];
    expect(lastCall[0].flag).toBe('high');
  });

  it('clears flag when reference range is removed', () => {
    // Start with a measurement that has a flag
    const measurementsWithFlag: Measurement[] = [
      { ...mockMeasurements[0], referenceMin: 0.5, referenceMax: null, flag: 'normal' }
    ];
    render(<MeasurementEditor measurements={measurementsWithFlag} onChange={mockOnChange} />);
    const minInput = screen.getAllByPlaceholderText('—')[0];
    
    // Clear the only remaining reference value
    fireEvent.change(minInput, { target: { value: '' } });
    
    const lastCall = mockOnChange.mock.calls[0][0];
    expect(lastCall[0].flag).toBeNull();
  });

  it('shows warning when confidence is low', () => {
    const lowConfidenceMeds: Measurement[] = [
      { ...mockMeasurements[0], confidence: 'low' }
    ];
    render(<MeasurementEditor measurements={lowConfidenceMeds} onChange={mockOnChange} />);
    expect(screen.getByText(/lab\.confidence\.low/)).toBeInTheDocument();
  });

  it('handles empty value input by falling back to 0', () => {
    render(<MeasurementEditor measurements={mockMeasurements} onChange={mockOnChange} />);
    const valueInput = screen.getByDisplayValue('1.2');
    fireEvent.change(valueInput, { target: { value: '' } });
    
    const lastCall = mockOnChange.mock.calls[0][0];
    expect(lastCall[0].value).toBe(0);
  });

  it('renders empty state when no measurements', () => {
    render(<MeasurementEditor measurements={[]} onChange={mockOnChange} />);
    expect(screen.getByText('common.noData')).toBeInTheDocument();
  });
});
