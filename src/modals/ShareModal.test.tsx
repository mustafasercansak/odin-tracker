import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareModal } from './ShareModal';
import { useAppStore } from '@/store/useAppStore';
import { useSharedAccess } from '@/hooks/queries/useSharedAccess';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('@/hooks/queries/useSharedAccess', () => ({
  useSharedAccess: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ShareModal Component', () => {
  const mockSetActiveModal = vi.fn();
  const mockSharePet = { mutateAsync: vi.fn() };
  const mockRevokeAccess = { mutateAsync: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAuth as any).mockReturnValue({
      user: { uid: 'owner-123' },
    });

    (useAppStore as any).mockReturnValue({
      activeModal: 'share_pet',
      setActiveModal: mockSetActiveModal,
      modalData: { petId: 'pet-123', ownerId: 'owner-123' },
    });

    (useSharedAccess as any).mockReturnValue({
      shares: [],
      sharePet: mockSharePet,
      revokeAccess: mockRevokeAccess,
      isLoading: false,
    });
  });

  it('renders the share modal', () => {
    render(<ShareModal />);
    expect(screen.getByText('shares.title')).toBeInTheDocument();
  });

  it('shows invite form only for the owner', () => {
    const { rerender } = render(<ShareModal />);
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();

    // Change user to NOT owner
    (useAuth as any).mockReturnValue({
      user: { uid: 'viewer-456' },
    });
    rerender(<ShareModal />);
    expect(screen.queryByPlaceholderText('user@example.com')).not.toBeInTheDocument();
  });

  it('submits the invite form correctly', async () => {
    render(<ShareModal />);
    
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), {
      target: { value: 'friend@example.com' },
    });
    
    const inviteButton = screen.getByText('shares.invite');
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(mockSharePet.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
        email: 'friend@example.com',
        role: 'viewer',
        ownerId: 'owner-123'
      }));
    });
  });

  it('lists existing shares and allows revoking access', async () => {
    const existingShares = [
      { id: 'share-1', sharedWithEmail: 'vet@example.com', role: 'editor' }
    ];

    (useSharedAccess as any).mockReturnValue({
      shares: existingShares,
      sharePet: mockSharePet,
      revokeAccess: mockRevokeAccess,
      isLoading: false,
    });

    render(<ShareModal />);
    
    expect(screen.getByText('vet@example.com')).toBeInTheDocument();
    
    const revokeButton = screen.getByLabelText('revoke-vet@example.com');
    fireEvent.click(revokeButton);

    await waitFor(() => {
      expect(mockRevokeAccess.mutateAsync).toHaveBeenCalledWith('share-1');
    });
  });
});
