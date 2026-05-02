import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicationModal } from './MedicationModal';
import { useAppStore } from '@/store/useAppStore';
import { useMedications } from '@/hooks/queries/useMedications';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
        if (key === 'medications.frequencies' && options?.returnObjects) {
            return { daily: 'Daily', weekly: 'Weekly' };
        }
        return key;
    },
  }),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('@/hooks/queries/useMedications', () => ({
  useMedications: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MedicationModal Component', () => {
  const mockSetActiveModal = vi.fn();
  const mockAddMedication = { mutateAsync: vi.fn() };
  const mockUpdateMedication = { mutateAsync: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (useAppStore as any).mockReturnValue({
      activeModal: 'medication_add',
      setActiveModal: mockSetActiveModal,
      modalData: { petId: 'pet-123' },
    });

    (useMedications as any).mockReturnValue({
      addMedication: mockAddMedication,
      updateMedication: mockUpdateMedication,
    });
  });

  it('renders the add medication modal when activeModal is medication_add', () => {
    render(<MedicationModal />);
    expect(screen.getByText('medications.addMedication')).toBeInTheDocument();
  });

  it('submits the form correctly for a new medication', async () => {
    render(<MedicationModal />);
    
    fireEvent.change(screen.getByPlaceholderText('medications.name'), {
      target: { value: 'Insulin' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('e.g. 5mg, 1 tablet'), {
      target: { value: '2 units' },
    });
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAddMedication.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Insulin',
        dosage: '2 units',
        petId: 'pet-123',
        nextDoseDue: expect.stringContaining('T09:00:00')
      }));
    });
    
    expect(mockSetActiveModal).toHaveBeenCalledWith(null);
  });

  it('renders the edit medication modal with existing data', () => {
    const existingMed = {
      id: 'med-1',
      petId: 'pet-123',
      name: 'Vitamins',
      dosage: '1 pill',
      frequency: 'daily',
      startDate: '2026-05-01T00:00:00',
      nextDoseDue: '2026-05-02T09:00:00',
    };

    (useAppStore as any).mockReturnValue({
      activeModal: 'medication_edit',
      setActiveModal: mockSetActiveModal,
      modalData: existingMed,
    });

    render(<MedicationModal />);
    
    expect(screen.getByText('medications.editMedication')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vitamins')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1 pill')).toBeInTheDocument();
  });

  it('submits updates for an existing medication', async () => {
    const existingMed = {
      id: 'med-1',
      petId: 'pet-123',
      name: 'Vitamins',
      dosage: '1 pill',
      frequency: 'daily',
      startDate: '2026-05-01',
    };

    (useAppStore as any).mockReturnValue({
      activeModal: 'medication_edit',
      setActiveModal: mockSetActiveModal,
      modalData: existingMed,
    });

    render(<MedicationModal />);
    
    fireEvent.change(screen.getByDisplayValue('Vitamins'), {
      target: { value: 'Vitamins Updated' },
    });
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateMedication.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
        id: 'med-1',
        name: 'Vitamins Updated',
      }));
    });
  });
});
