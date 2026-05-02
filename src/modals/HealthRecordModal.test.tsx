import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthRecordModal } from './HealthRecordModal';
import { useAppStore } from '@/store/useAppStore';
import { useHealthRecords } from '@/hooks/queries/useHealthRecords';
import { useExtractWithAnthropic, extractWithGemini } from '@/hooks/queries/useExtraction';
import { useExtractionUsage } from '@/hooks/queries/useUsage';
import { uploadFile } from '@/lib/storage';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'healthRecords.recordTypes' && options?.returnObjects) {
        return { vet_visit: 'Vet Visit', lab_test: 'Lab Test', weight: 'Weight' };
      }
      return key;
    },
  }),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('@/hooks/queries/useHealthRecords', () => ({
  useHealthRecords: vi.fn(),
}));

vi.mock('@/hooks/queries/useExtraction', () => ({
  useExtractWithAnthropic: vi.fn(),
  extractWithGemini: vi.fn(),
  mapExtractionErrorToMessage: vi.fn(() => 'error'),
}));

vi.mock('@/hooks/queries/useUsage', () => ({
  useExtractionUsage: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
  },
}));

describe('HealthRecordModal Component', () => {
  const mockSetActiveModal = vi.fn();
  const mockAddRecord = { mutateAsync: vi.fn() };
  const mockUpdateRecord = { mutateAsync: vi.fn() };
  const mockExtractMutation = { mutateAsync: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();

    (useAppStore as any).mockReturnValue({
      activeModal: 'record_add',
      setActiveModal: mockSetActiveModal,
      modalData: { petId: 'pet-123' },
    });

    (useHealthRecords as any).mockReturnValue({
      addRecord: mockAddRecord,
      updateRecord: mockUpdateRecord,
    });

    (useExtractWithAnthropic as any).mockReturnValue(mockExtractMutation);
    (useExtractionUsage as any).mockReturnValue({ data: { count: 5, limit: 10 } });

    (uploadFile as any).mockResolvedValue('http://example.com/file.jpg');
    (extractWithGemini as any).mockResolvedValue({
      testDate: '2026-04-20',
      labName: 'Odin Clinic',
      measurements: [{ parameter: 'creatinine', value: 1.5, unit: 'mg/dL', flag: 'high', confidence: 'high' }],
    });
    mockAddRecord.mutateAsync.mockResolvedValue({});
    mockExtractMutation.mutateAsync.mockResolvedValue({
      testDate: '2026-04-20',
      labName: 'Odin Clinic',
      measurements: [{ parameter: 'creatinine', value: 1.5, unit: 'mg/dL', flag: 'high', confidence: 'high' }],
    });
  });

  it('renders correctly', () => {
    render(<HealthRecordModal />);
    expect(screen.getByText('healthRecords.addRecord')).toBeInTheDocument();
  });

  it('submits weight records correctly', async () => {
    render(<HealthRecordModal />);

    // Switch to weight record type via segmented button
    fireEvent.click(screen.getByText('healthRecords.recordTypes.weight'));

    // Fill required description
    fireEvent.change(screen.getByPlaceholderText('healthRecords.description'), {
      target: { value: 'Weekly weight check' },
    });

    // Wait for weight input to appear
    const weightInput = await screen.findByPlaceholderText('0.00');
    fireEvent.change(weightInput, { target: { value: '5.2' } });

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockAddRecord.mutateAsync).toHaveBeenCalled();
    });

    const lastCall = mockAddRecord.mutateAsync.mock.calls[0][0];
    expect(lastCall.weightKg).toBe(5.2);
    expect(lastCall.recordType).toBe('weight');
    expect(lastCall.description).toBe('Weekly weight check');
  });

  it('handles AI extraction flow', async () => {
    const { container } = render(<HealthRecordModal />);

    // Switch to lab_test type via segmented button
    fireEvent.click(screen.getByText('healthRecords.recordTypes.lab_test'));

    const file = new File(['test'], 'lab.jpg', { type: 'image/jpeg' });
    // The hidden multi-file input is inside the lab_test drop zone
    const fileInput = container.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('healthRecords.extractWithAI')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('healthRecords.extractWithAI'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. VetLab')).toHaveValue('Odin Clinic');
    }, { timeout: 8000 });
  });
});
