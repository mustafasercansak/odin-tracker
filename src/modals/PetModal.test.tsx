import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PetModal } from './PetModal';
import { useAppStore } from '@/store/useAppStore';
import { usePets } from '@/hooks/queries/usePets';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('@/hooks/queries/usePets', () => ({
  usePets: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PetModal Component', () => {
  const mockSetActiveModal = vi.fn();
  const mockAddPet = { mutateAsync: vi.fn() };
  const mockUpdatePet = { mutateAsync: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAppStore as any).mockReturnValue({
      activeModal: 'pet_add',
      setActiveModal: mockSetActiveModal,
      modalData: null,
    });

    (usePets as any).mockReturnValue({
      addPet: mockAddPet,
      updatePet: mockUpdatePet,
    });
  });

  it('renders the add pet modal', () => {
    render(<PetModal />);
    expect(screen.getByText('pets.addPet')).toBeInTheDocument();
  });

  it('submits the form correctly for a new pet', async () => {
    render(<PetModal />);
    
    fireEvent.change(screen.getByPlaceholderText('pets.name'), {
      target: { value: 'Odin' },
    });
    
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockAddPet.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Odin',
      }));
    });
  });

  it('handles image upload correctly', async () => {
    const { uploadFile } = await import('@/lib/storage');
    (uploadFile as any).mockResolvedValue('http://example.com/photo.jpg');

    render(<PetModal />);
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText('healthRecords.uploadFile');
    fireEvent.change(input, { target: { files: [file] } });
    
    fireEvent.change(screen.getByPlaceholderText('pets.name'), {
      target: { value: 'Odin' },
    });
    
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalled();
    });
  });

  it('shows error toast when submission fails', async () => {
    mockAddPet.mutateAsync.mockRejectedValue(new Error('Failed'));
    
    render(<PetModal />);
    fireEvent.change(screen.getByPlaceholderText('pets.name'), {
      target: { value: 'Odin' },
    });
    
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
