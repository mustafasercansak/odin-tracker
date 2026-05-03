import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Locale = 'tr' | 'en' | 'de' | 'es' | 'fr' | 'it' | 'ru' | 'pt' | 'nl' | 'ja' | 'zh';
export type TrendsTimeRange = '3m' | '6m' | '1y' | 'all';

interface AppState {
  // Persisted state
  theme: Theme;
  locale: Locale;
  selectedPetId: string | null;
  trendsTimeRange: TrendsTimeRange;
  trendsSelectedParams: string[];
  trendsSelectedLabs: string[];
  recordsSelectedLabs: string[];
  notificationsEnabled: boolean;
  aiKeys: {
    google?: string;
    openai?: string;
    anthropic?: string;
    groq?: string;
  };
  preferredAIProvider: 'auto' | 'google' | 'openai' | 'anthropic' | 'groq';

  // Non-persisted state
  isOnline: boolean;
  searchQuery: string;
  activeModal: string | null;
  modalData: any;

  // Actions
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setSelectedPetId: (id: string | null) => void;
  setTrendsTimeRange: (range: TrendsTimeRange) => void;
  setTrendsSelectedParams: (params: string[]) => void;
  setTrendsSelectedLabs: (labs: string[]) => void;
  setRecordsSelectedLabs: (labs: string[]) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAIKeys: (keys: Partial<AppState['aiKeys']>) => void;
  setPreferredAIProvider: (provider: AppState['preferredAIProvider']) => void;
  setIsOnline: (status: boolean) => void;
  setSearchQuery: (query: string) => void;
  setActiveModal: (modalName: string | null, data?: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial persisted state
      theme: 'system',
      locale: 'tr',
      selectedPetId: null,
      trendsTimeRange: '6m',
      trendsSelectedParams: ['creatinine', 'sdma', 'phosphorus'],
      trendsSelectedLabs: [],
      recordsSelectedLabs: [],
      notificationsEnabled: false,
      aiKeys: {},
      preferredAIProvider: 'auto',

      // Initial non-persisted state
      isOnline: navigator.onLine,
      searchQuery: '',
      activeModal: null,
      modalData: null,

      // Actions
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setSelectedPetId: (selectedPetId) => set({ selectedPetId }),
      setTrendsTimeRange: (trendsTimeRange) => set({ trendsTimeRange }),
      setTrendsSelectedParams: (trendsSelectedParams) => set({ trendsSelectedParams }),
      setTrendsSelectedLabs: (trendsSelectedLabs) => set({ trendsSelectedLabs }),
      setRecordsSelectedLabs: (recordsSelectedLabs) => set({ recordsSelectedLabs }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setAIKeys: (newKeys) => set((state) => ({ aiKeys: { ...state.aiKeys, ...newKeys } })),
      setPreferredAIProvider: (preferredAIProvider) => set({ preferredAIProvider }),
      setIsOnline: (isOnline) => set({ isOnline }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setActiveModal: (activeModal, modalData = null) => set({ activeModal, modalData }),
    }),
    {
      name: 'odin-tracker-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        selectedPetId: state.selectedPetId,
        trendsTimeRange: state.trendsTimeRange,
        trendsSelectedParams: state.trendsSelectedParams,
        trendsSelectedLabs: state.trendsSelectedLabs,
        recordsSelectedLabs: state.recordsSelectedLabs,
        notificationsEnabled: state.notificationsEnabled,
        aiKeys: state.aiKeys,
        preferredAIProvider: state.preferredAIProvider,
      }),
    }
  )
);
