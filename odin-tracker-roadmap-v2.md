# Odin Tracker - Roadmap v2 (Firestore Only)

**Tek backend: Firebase/Firestore. Server state TanStack Query'de, client state Zustand'da. PWA ile çalışan ilaç hatırlatıcı. i18n baştan.**

---

## 🎯 Mimari Kararlar

```
React SPA (Vite + TS + Tailwind)
│
├─ Firebase
│  ├─ Firestore        → veri
│  ├─ Auth             → email/password
│  ├─ Storage          → fotoğraf, lab dosyaları
│  └─ Cloud Messaging  → push notification (PWA)
│
├─ State
│  ├─ TanStack Query   → server state (pets, records, meds)
│  └─ Zustand          → client state (selectedPetId, modallar, tema, dil)
│
├─ Form & Validasyon
│  ├─ React Hook Form  → form state
│  └─ Zod              → schema validasyon (TS type ile share edilir)
│
├─ PWA
│  ├─ vite-plugin-pwa  → service worker + manifest
│  └─ Workbox          → offline cache + background sync
│
└─ i18n
   └─ react-i18next    → TR / EN (baştan kurulur)
```

### Neden bu seçimler

| Karar | Gerekçe |
|---|---|
| Firestore tek backend | Adapter katmanı, çoklu SDK init, çoklu auth flow yükü kalkıyor. |
| TanStack Query | Cache, refetch, optimistic update, persist, mutation queue zaten built-in. Zustand'da elle yazmak 300+ satır boilerplate. |
| Zustand sadece client | Server state'i iki yerde tutmak (Zustand + Query) çift kaynak gerçeği yaratır. |
| PWA + FCM | Tab kapalıyken `setInterval` çalışmaz. Odin'in ilaç hatırlatıcısı kritik, browser Notification API tek başına yetmiyor. |
| react-hook-form + zod | Manuel validasyon her formda tekrar eden kod. Zod ile tek schema, hem form hem TS type. |
| i18n baştan | Sonradan eklemek tüm string'leri toplama çilesi. 25. task'ta i18n eklemek yerine 4. task'ta kur. |

---

## 📋 Task'lar

### Task 1: Project Setup (PWA + Tailwind + i18n hazırlığı)

**Prompt:**
```
Create a React + TypeScript + Vite SPA for Odin Tracker:

npm create vite@latest odin-tracker -- --template react-ts
cd odin-tracker
pnpm install

Add dependencies:
- firebase
- @tanstack/react-query
- @tanstack/react-query-persist-client
- @tanstack/query-sync-storage-persister
- zustand
- react-router-dom
- react-hook-form
- zod
- @hookform/resolvers
- date-fns
- react-hot-toast
- react-i18next i18next i18next-browser-languagedetector
- tailwindcss postcss autoprefixer
- vite-plugin-pwa workbox-window

Dev dependencies:
- vitest @testing-library/react @testing-library/jest-dom jsdom
- @playwright/test
- eslint-plugin-react-hooks
- prettier

Configure:
- tsconfig.json strict mode + path alias (@/* → src/*)
- vite.config.ts with vite-plugin-pwa (registerType: 'autoUpdate')
- tailwind.config.js (darkMode: 'class', content paths)
- .env.example with VITE_FIREBASE_* variables
- .gitignore (node_modules, dist, .env.local)

Folder structure:
src/
├─ components/        # shared UI
├─ screens/           # route-level pages
├─ modals/            # modal forms
├─ hooks/             # useXxx hooks (Query hooks here)
├─ store/             # Zustand stores
├─ lib/               # firebase init, helpers, reminders
├─ schemas/           # Zod schemas
├─ types/             # TS types (re-exported from schemas)
├─ i18n/              # locales + i18n config
├─ test/              # Vitest setup
├─ App.tsx
└─ main.tsx
```

**Beklenen çıktı:** Boş ama PWA-ready, test-ready Vite projesi.

---

### Task 2: Zod Schemas + Type Definitions

**Prompt:**
```
Create Zod schemas in src/schemas/ and re-export types in src/types/index.ts.

Schemas (one file per entity):

src/schemas/pet.ts:
- petSchema: { id, name (1-50), species (enum: cat|dog|rabbit|bird|other), birthdate (date, not future), photoUrl?, ownerId, createdAt, updatedAt }
- petInputSchema: omit id, ownerId, timestamps (used in forms)

src/schemas/healthRecord.ts:
- healthRecordSchema: { id, petId, recordDate (not future), recordType (enum: medication|vet_visit|symptom|lab_test|weight), description (1-500), notes?, fileUrl?, weightKg? (only when type=weight), testName? (only when type=lab_test), createdAt, updatedAt }
- healthRecordInputSchema for forms

src/schemas/medication.ts:
- medicationSchema: { id, petId, name (1-100), dosage (1-50), frequency (enum: once_daily|twice_daily|three_times_daily|as_needed), startDate, endDate? (>startDate), nextDoseDue, notes?, createdAt, updatedAt }
- Use .refine() for endDate > startDate

src/schemas/sharedAccess.ts:
- sharedAccessSchema: { id, petId, sharedWithUserId, sharedWithEmail, permissionLevel (enum: view|edit|admin), createdAt }

src/schemas/user.ts:
- userSchema: { id, email, name, phone?, locale (tr|en), darkMode, createdAt, updatedAt }

src/types/index.ts:
- Use z.infer<typeof xxxSchema> to derive TS types
- Export all types: User, Pet, HealthRecord, Medication, SharedAccess
- Export input types separately

Use Firestore Timestamp type from firebase/firestore for createdAt/updatedAt where stored, but Date in app code (convert at boundaries).
```

**Beklenen çıktı:** Tüm entity'ler için Zod schema, derive edilmiş TS type'lar.

---

### Task 3: Firebase Initialization + Security Rules Draft

**Prompt:**
```
Setup Firebase in src/lib/firebase.ts:

- Read VITE_FIREBASE_* from import.meta.env
- Initialize app, auth, db (Firestore), storage, messaging
- Export: app, auth, db, storage, messaging
- Enable Firestore offline persistence: enableIndexedDbPersistence(db)
- Configure auth persistence to local

Also create firestore.rules in project root with:

- pets: read if owner OR has sharedAccess doc with view/edit/admin permission
- pets: write (create) if authenticated and ownerId == request.auth.uid
- pets: write (update/delete) if owner OR shared with admin
- health_records: read if user can read parent pet
- health_records: write if owner OR shared with edit/admin
- medications: same as health_records
- shared_access: read if owner of pet OR sharedWithUserId == auth.uid
- shared_access: write if owner of pet only
- users/{userId}: read by anyone authenticated, write by self only

Storage rules in storage.rules:
- pet_photos/{petId}/*: read if can read pet, write if can edit pet
- health_files/{petId}/{recordId}/*: same

Provide firebase.json with hosting config (build dir = dist).

Document required Firestore composite indexes in README:
- health_records: petId ASC, recordDate DESC
- medications: petId ASC, nextDoseDue ASC
- shared_access: sharedWithUserId ASC, createdAt DESC
```

**Beklenen çıktı:** `src/lib/firebase.ts`, `firestore.rules`, `storage.rules`, `firebase.json`.

---

### Task 4: i18n Setup (TR/EN)

**Prompt:**
```
Setup react-i18next in src/i18n/index.ts:

- Default language: tr
- Fallback: en
- Detection order: localStorage → navigator
- Cache in localStorage (key: 'odin-locale')

Create locale files:
- src/i18n/locales/tr.json
- src/i18n/locales/en.json

Namespace structure:
{
  "common": { "save", "cancel", "delete", "edit", "loading", "error", "success" },
  "auth": { "login", "signup", "email", "password", ... },
  "pets": { "title", "addPet", "species.cat", "species.dog", ... },
  "health": { "title", "addRecord", "type.medication", "type.vetVisit", ... },
  "medications": { ... },
  "settings": { ... },
  "validation": { "required", "minLength", "invalidEmail", ... }
}

Initialize i18n in main.tsx before React renders.

Create useT() helper hook that wraps useTranslation('common').

In all subsequent screens/components, NEVER hardcode strings. Always use t('namespace.key').

Add language switcher component for settings screen.
```

**Beklenen çıktı:** Çalışan TR/EN i18n setup, locale dosyaları taslağı.

---

### Task 5: Zustand Store (Sadece Client State)

**Prompt:**
```
Create src/store/useAppStore.ts (Zustand + persist middleware).

IMPORTANT: This store ONLY holds client state. NO server data (pets, records, meds) here. Server data lives in TanStack Query cache.

State:
- theme: 'light' | 'dark' | 'system'
- locale: 'tr' | 'en'
- selectedPetId: string | null
- sidebarOpen: boolean
- activeModal: 'pet' | 'healthRecord' | 'medication' | 'share' | null
- modalContext: { id?: string; mode: 'create' | 'edit' } | null
- searchTerm: string
- recordTypeFilters: RecordType[]
- isOnline: boolean

Actions:
- setTheme(theme)
- setLocale(locale)
- selectPet(id)
- toggleSidebar()
- openModal(modal, context?)
- closeModal()
- setSearchTerm(term)
- toggleRecordTypeFilter(type)
- clearFilters()
- setOnlineStatus(online)

Persist (localStorage) ONLY: theme, locale, selectedPetId.
Do NOT persist: modal state, search, filters, online status.

Listen to window 'online'/'offline' events in a setupNetworkListener() function called once from App.tsx.
```

**Beklenen çıktı:** ~80-100 satırlık temiz Zustand store.

---

### Task 6: Auth (Firebase Auth + Context + Protected Routes)

**Prompt:**
```
Create auth flow with Firebase Auth.

src/hooks/useAuth.ts:
- Wraps onAuthStateChanged in a React hook
- Returns { user, loading, signIn, signUp, signOut, updateProfile }
- signUp also creates user doc in Firestore (users/{uid}) with name, email, locale, darkMode

src/components/AuthGuard.tsx:
- Wraps protected routes
- Shows loading spinner while auth state loading
- Redirects to /login if not authenticated

src/screens/LoginScreen.tsx:
- react-hook-form + zod resolver
- Schema: { email, password (min 6) }
- Tabs: Login | Signup
- Signup adds: name, confirmPassword (with refine for match)
- Submit calls signIn / signUp from useAuth
- Show toast on error (translated)
- Redirect to / on success

Use Firebase error codes mapped to i18n keys:
- auth/user-not-found → t('auth.errors.userNotFound')
- auth/wrong-password → t('auth.errors.wrongPassword')
- auth/email-already-in-use → t('auth.errors.emailInUse')
- auth/weak-password → t('auth.errors.weakPassword')

All form labels and errors use t().
```

**Beklenen çıktı:** `useAuth` hook, `LoginScreen`, `AuthGuard`. Çalışan auth flow.

---

### Task 7: TanStack Query Setup + Firestore Hooks

**Prompt:**
```
This is the core data layer. Server state lives here, NOT in Zustand.

src/lib/queryClient.ts:
- Create QueryClient with default options:
  - staleTime: 30 seconds
  - cacheTime: 24 hours
  - retry: 1
  - refetchOnWindowFocus: true
- Setup persistQueryClient with localStorage persister
- Wrap App in QueryClientProvider in main.tsx

src/hooks/queries/usePets.ts:
- usePets(): useQuery returning user's pets (where ownerId == uid OR shared)
- usePet(petId): useQuery for single pet
- useCreatePet(): useMutation, invalidates ['pets']
- useUpdatePet(): useMutation, optimistic update
- useDeletePet(): useMutation, optimistic remove

src/hooks/queries/useHealthRecords.ts:
- useHealthRecords(petId): useQuery, ordered by recordDate desc
- useCreateHealthRecord(): useMutation
- useUpdateHealthRecord(): useMutation
- useDeleteHealthRecord(): useMutation

src/hooks/queries/useMedications.ts:
- useMedications(petId): useQuery, ordered by nextDoseDue asc
- useActiveMedications(petId): useQuery filtered (endDate null OR > now)
- useCreateMedication, useUpdateMedication, useDeleteMedication

src/hooks/queries/useSharedAccess.ts:
- useSharedUsers(petId)
- useShareAccess()
- useRevokeAccess()

For real-time updates (optional, advanced):
- Create useFirestoreSubscription helper that uses onSnapshot to push updates into Query cache
- Use it for pets and selected pet's records/meds

All Firestore Timestamp ↔ Date conversion happens here at the boundary.
All mutation errors trigger toast.error(t('common.error')).
```

**Beklenen çıktı:** Tüm Firestore okuma/yazma TanStack Query hook'ları içinde, component'lerde direkt Firestore SDK çağrısı yok.

---

### Task 8: App Layout + Routing

**Prompt:**
```
src/App.tsx with React Router v6:

Routes:
- /login → LoginScreen (no AuthGuard)
- / → AuthGuard wrapping MainLayout
  - / → redirect to /pets
  - /pets → PetsList
  - /pets/:petId → PetDetail
  - /settings → SettingsScreen
  - * → NotFound

src/components/MainLayout.tsx:
- Header (top): logo, selected pet name, language switcher, user menu (profile + logout)
- Sidebar (left, collapsible on mobile via Zustand sidebarOpen):
  - Pets icon → /pets
  - Settings icon → /settings
  - Logout button at bottom
- <Outlet /> for content

src/components/Header.tsx, src/components/Sidebar.tsx as separate files.

Mobile: sidebar overlays with backdrop, closes on route change.
Desktop: sidebar always visible.

Use Tailwind responsive classes.
All text via t().
```

**Beklenen çıktı:** Çalışan layout, routing, mobile-responsive sidebar.

---

### Task 9: Pets List Screen

**Prompt:**
```
src/screens/PetsList.tsx:

- Use usePets() hook
- Loading state: skeleton cards (3 placeholder)
- Empty state: illustration + t('pets.empty') + "Add Pet" button
- Error state: error message + retry button
- Grid: 1 col mobile, 2 col tablet, 3 col desktop
- Each card: photo (or initial), name, species, age (calculated from birthdate using date-fns differenceInYears)
- Click card → navigate to /pets/:id and selectPet(id) in Zustand
- FAB bottom-right: opens pet modal in create mode (Zustand openModal)

Pull-to-refresh: use refetch() from useQuery.

All strings via t().
```

**Beklenen çıktı:** `PetsList.tsx` (~120 satır).

---

### Task 10: Pet Add/Edit Modal

**Prompt:**
```
src/modals/PetModal.tsx:

- react-hook-form with zodResolver(petInputSchema)
- Reads activeModal and modalContext from Zustand
- If mode='edit', fetches pet via usePet(modalContext.id) and resets form

Fields (all i18n):
- Name (text)
- Species (select with translated options)
- Birthdate (date input, max=today)
- Photo (file input, optional, max 5MB image)

Photo upload flow:
- On submit, if photo file provided:
  1. Upload to Firebase Storage (pet_photos/{petId}/{filename})
  2. Get downloadURL
  3. Save URL in pet doc
- Show upload progress

Submit:
- Create mode: useCreatePet().mutateAsync()
- Edit mode: useUpdatePet().mutateAsync()
- Success: toast.success, closeModal()
- Error: toast.error with translated message

Cancel: closeModal()

Modal component: shared src/components/Modal.tsx with backdrop, close on escape, focus trap.
```

**Beklenen çıktı:** `PetModal.tsx`, paylaşılan `Modal.tsx`.

---

### Task 11: Pet Detail Screen

**Prompt:**
```
src/screens/PetDetail.tsx:

URL param: petId (useParams).
On mount: selectPet(petId) in Zustand.

Layout:
- Header section: photo, name, species, age, edit button, share button, delete button (with confirm)
- Tabs: Health Records | Medications | Shared Access (only shown if owner)

Health Records tab:
- Search input (Zustand searchTerm)
- Filter chips for recordType (Zustand recordTypeFilters)
- List of records (filtered client-side from useHealthRecords data via useMemo)
- Each row: type icon (color-coded), date (date-fns format), description (truncated)
- Click row: expand to show full description, notes, file link
- "Add Record" button → openModal('healthRecord', { mode: 'create' })

Medications tab:
- Active meds list (useActiveMedications)
- Each row: name, dosage, frequency, next dose (relative time via formatDistanceToNow)
- Highlight in red if next dose < 1 hour
- "Add Medication" button

Shared tab (owner only):
- useSharedUsers(petId) list
- Each row: email, permission, remove button
- "Share with someone" button → openModal('share')

Loading: skeleton.
All strings via t().
```

**Beklenen çıktı:** `PetDetail.tsx` ile filtreleme + arama dahil.

---

### Task 12: Health Record Modal

**Prompt:**
```
src/modals/HealthRecordModal.tsx:

react-hook-form + zodResolver(healthRecordInputSchema).

Fields:
- recordDate (date, default = today, max = today)
- recordType (select)
- description (textarea)
- notes (textarea, optional)
- file (PDF or image, optional, max 10MB)

Conditional fields (based on recordType):
- weight: weightKg number input (kg, 0.1 step)
- lab_test: testName text input

File upload to Firebase Storage at health_files/{petId}/{recordId}/{filename}.

Submit via useCreateHealthRecord() or useUpdateHealthRecord().
Toast + closeModal on success.

All strings via t().
```

**Beklenen çıktı:** `HealthRecordModal.tsx`.

---

### Task 13: Medication Modal

**Prompt:**
```
src/modals/MedicationModal.tsx:

react-hook-form + zodResolver(medicationInputSchema).

Fields:
- name
- dosage (e.g., "5mg")
- frequency (select)
- startDate
- endDate (optional)
- nextDoseDue (datetime-local)
- notes (optional)

Auto-suggest nextDoseDue when frequency or startDate changes:
- once_daily → startDate at 09:00
- twice_daily → startDate at 09:00 (next will be 21:00)
- three_times_daily → startDate at 08:00
- as_needed → empty

Submit via useCreateMedication / useUpdateMedication.
On create success, also schedule local notification (Task 14).

All strings via t().
```

**Beklenen çıktı:** `MedicationModal.tsx`.

---

### Task 14: PWA Reminder System (Service Worker + FCM)

**Prompt:**
```
Critical task. Browser-tab-only setInterval is NOT acceptable for medication reminders.

Two-track approach:

TRACK A: Local notifications via service worker (works offline, on-device)
src/lib/reminders.ts:
- requestNotificationPermission(): asks user, saves grant in localStorage
- scheduleLocalReminder(medication): registers in IndexedDB
- On service worker activation, periodically (every 5 min via Periodic Background Sync where supported, fallback setInterval in active tab) check IndexedDB for due meds
- When due, sw.registration.showNotification() with action buttons (Mark taken, Snooze 1h)
- Notification click → focus app on /pets/:petId

TRACK B: Server-side via Firebase Cloud Messaging (works even when app fully closed)
- Setup VAPID key in .env
- src/lib/fcm.ts: requestFCMToken(), saves token in users/{uid}/fcmTokens
- Cloud Function (separate task or document for later): scheduled function runs every 15 min, queries medications where nextDoseDue between now and now+15min, sends FCM notification

For now, implement Track A fully. Document Track B as a follow-up task with the Cloud Function code.

Add reminder permission request flow:
- After first medication added, show modal: "Enable reminders?"
- Yes → requestNotificationPermission() + requestFCMToken()
- Track choice in user doc
```

**Beklenen çıktı:** `src/lib/reminders.ts`, service worker entegrasyonu, izin akışı. Cloud Function dokümantasyonu README'de.

---

### Task 15: Sharing Modal

**Prompt:**
```
src/modals/ShareModal.tsx:

Visible only if current user is pet owner.

Top: pet name, list of currently shared users (useSharedUsers).
Each row: email, permission badge, remove button.

Form below:
- email input (validated as email)
- permission select (view | edit | admin)
- Add button

On Add:
1. Look up user by email in Firestore (users collection where email == X)
2. If not found, show error t('share.userNotFound')
3. If found, useShareAccess().mutate({ petId, sharedWithUserId, sharedWithEmail, permissionLevel })
4. Toast success

On Remove:
- Confirm dialog
- useRevokeAccess().mutate(...)

Permission descriptions in i18n:
- view: read-only
- edit: read + add/edit records and meds
- admin: all of edit + delete pet + manage sharing

All strings via t().
```

**Beklenen çıktı:** `ShareModal.tsx`.

---

### Task 16: Settings Screen

**Prompt:**
```
src/screens/SettingsScreen.tsx:

Sections:

Profile:
- Name (editable, save on blur)
- Email (read-only)
- Phone (editable)
- Save button updates users/{uid}

Preferences:
- Theme: Light | Dark | System (Zustand setTheme)
- Language: TR | EN (Zustand setLocale + i18n.changeLanguage)
- Reminder permissions status + re-enable button

Data:
- Last sync time (from query cache)
- "Sync now" button → queryClient.invalidateQueries()
- Export data button → opens export flow (Task 19)
- Import data button → opens import flow (Task 19)

Danger Zone:
- Change password modal (Firebase updatePassword, requires recent login)
- Delete account (confirmation + reauthenticate + delete user doc + delete auth user)

About:
- Version (from package.json)
- GitHub link
- License

Logout button: signOut() + clear queryClient + navigate to /login.

All strings via t().
```

**Beklenen çıktı:** `SettingsScreen.tsx`.

---

### Task 17: Search & Filter (built into PetDetail in Task 11)

**Prompt:**
```
This was already covered partially in Task 11 (PetDetail). Now formalize:

src/hooks/useFilteredHealthRecords.ts:
- Input: petId
- Reads useHealthRecords(petId) data
- Reads searchTerm and recordTypeFilters from Zustand
- Reads optional dateRange from local component state
- Returns filtered + sorted list via useMemo

src/components/SearchBar.tsx:
- Controlled input bound to Zustand searchTerm
- Debounced (300ms)
- Clear button

src/components/FilterChips.tsx:
- Toggle chips for each RecordType
- Active state styled differently

src/components/DateRangePicker.tsx:
- Two date inputs (from, to)
- Or preset chips: Last 7 days, Last 30 days, This year, All time

Use these in PetDetail.

All strings via t().
```

**Beklenen çıktı:** Reusable search/filter component'leri.

---

### Task 18: PDF Report Generation

**Prompt:**
```
src/lib/reportGenerator.ts:

pnpm add jspdf jspdf-autotable

generatePetReport(pet, healthRecords, medications, locale):
- A4 portrait
- Header: app name + report date
- Pet info section: photo (if URL), name, species, birthdate, age
- Health records section: jspdf-autotable with columns Date | Type | Description
  - Sorted by date desc
  - Last 50 records max
- Medications section: another autotable with Name | Dosage | Frequency | Start | End | Next dose
  - Active meds first, then past
- Notes for vet section: empty box for handwritten notes
- Footer: page number, "Generated by Odin Tracker"

Localize all labels via i18next t() (pass locale to ensure correct lang).
Filename: {pet.name}-report-{YYYY-MM-DD}.pdf

Add "Generate Report" button to PetDetail header.
On click: show loading toast, generate, trigger download.

Make PDF readable for veterinarians (clean tables, good spacing, not too dense).
```

**Beklenen çıktı:** `src/lib/reportGenerator.ts`, PetDetail'da rapor butonu. Veteriner ziyareti için kullanışlı format.

---

### Task 19: Export / Import (JSON)

**Prompt:**
```
src/lib/dataExport.ts:

exportData(userId): Promise<Blob>
- Fetch all user's pets, health_records (for each pet), medications (for each pet)
- Build object: { version: '1.0', exported: ISO date, data: { pets, healthRecords, medications } }
- Return JSON Blob

triggerDownload(blob, filename):
- Create object URL, anchor element, click, revoke
- Filename: odin-tracker-export-{YYYY-MM-DD}.json

importData(file: File, mode: 'merge' | 'replace'): Promise<ImportSummary>
- Parse JSON
- Validate with Zod (importSchema with version check)
- For each entity: check if exists by id (merge: skip; replace: overwrite)
- Use Firestore batched writes (max 500 per batch)
- Return summary: { petsImported, recordsImported, medsImported, skipped }

UI in Settings:
- Export: button → calls exportData + triggerDownload
- Import: file input → parse → preview modal showing counts → confirm → importData
- Show progress bar for large imports
- Toast result

All strings via t().
```

**Beklenen çıktı:** Export/import çalışıyor. Veri kilitlenmesine karşı sigorta.

---

### Task 20: Dark Mode

**Prompt:**
```
Dark mode infrastructure (tailwind darkMode: 'class' already set in Task 1).

src/components/ThemeProvider.tsx:
- Reads theme from Zustand
- If 'system': listen to prefers-color-scheme media query
- Toggle 'dark' class on document.documentElement
- Mount once in App.tsx

Tailwind dark variants:
- Light backgrounds: bg-white, bg-slate-50
- Dark backgrounds: dark:bg-slate-900, dark:bg-slate-800
- Light text: text-slate-900
- Dark text: dark:text-slate-100
- Borders: border-slate-200 dark:border-slate-700

Audit every component:
- Header, Sidebar, all screens, all modals, cards, inputs, buttons
- Ensure contrast in both modes

Theme toggle in Settings (already in Task 16).
```

**Beklenen çıktı:** Tüm ekranlar dark/light/system mode'da düzgün.

---

### Task 21: Offline Support (TanStack Query Persister)

**Prompt:**
```
Most offline plumbing comes free with TanStack Query persistence + Firestore offline persistence (Task 3, Task 7). This task is about polishing UX.

Already done:
- enableIndexedDbPersistence(db) in firebase.ts
- persistQueryClient with localStorage in queryClient.ts

Add:

src/components/OfflineBanner.tsx:
- Reads isOnline from Zustand
- Shows banner when offline: "You are offline. Changes will sync when reconnected."

src/hooks/useNetworkStatus.ts:
- Subscribes to online/offline events
- Updates Zustand isOnline

Mutation queue:
- Firestore SDK already queues writes when offline and replays on reconnect (offline persistence)
- TanStack Query mutations: set retry: 3, retryDelay: exponential
- Show pending mutation count in header (if > 0)

Test scenarios:
- DevTools → Network → Offline
- Add pet, add record, add medication
- Reconnect
- Verify all sync

All strings via t().
```

**Beklenen çıktı:** Offline'da çalışan, online olunca senkron olan app. Banner UX.

---

### Task 22: Toast Notifications (Standardize)

**Prompt:**
```
src/lib/toast.ts:

Wrap react-hot-toast with i18n + consistent styling:

- showSuccess(key, params?) → toast.success(t(key, params))
- showError(key, params?) → toast.error(t(key, params))
- showLoading(key) → returns toast id for dismiss
- showInfo(key)

Configure Toaster in App.tsx:
- position: top-right (top-center on mobile)
- duration: 3000 success, 5000 error
- Tailwind theme aware (dark/light)

Audit all screens:
- Replace alert(), console.log error reporting, raw toast() calls
- Use the wrapper consistently

Common toasts to define in i18n:
- common.toasts.saved
- common.toasts.deleted
- common.toasts.shared
- common.toasts.error
- common.toasts.networkError
```

**Beklenen çıktı:** Tüm app'te tutarlı toast'lar.

---

### Task 23: Testing Setup

**Prompt:**
```
Two layers of testing.

UNIT (Vitest):

src/test/setup.ts:
- @testing-library/jest-dom
- Mock firebase modules (vi.mock)
- Mock i18n (return key as translation)

Tests for:
- Zod schemas (validation pass/fail cases)
- Pure utility functions (date helpers, age calculation)
- Zustand store actions
- Custom hooks where possible (useFilteredHealthRecords)

E2E (Playwright):

playwright.config.ts: tests/ folder, Firefox + Chromium.

tests/auth.spec.ts:
- Signup flow (use Firebase emulator)
- Login flow
- Logout

tests/pets.spec.ts:
- Add pet
- Edit pet
- Delete pet (with confirm)

tests/healthRecord.spec.ts:
- Add health record
- Verify shows in list
- Filter by type

Use Firebase emulator suite for E2E (firebase init emulators).
package.json scripts:
- test: vitest
- test:e2e: playwright test
- emulators: firebase emulators:start

Document in README how to run emulators + tests.
```

**Beklenen çıktı:** Çalışan unit + E2E test setup. Firestore emulator ile E2E.

---

### Task 24: Responsive Polish

**Prompt:**
```
Audit every screen at three breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop).

Checklist:
- Touch targets >= 44px height
- Sidebar collapses on mobile, slides over content with backdrop
- Modals full-screen on mobile, centered card on desktop
- Forms: full-width inputs on mobile
- Pet cards grid: 1/2/3 cols
- Tables: horizontal scroll on mobile (overflow-x-auto)
- Date pickers: native input on mobile, library on desktop OK
- FAB bottom-right with safe-area-inset for iOS
- Headers: hamburger on mobile

Add loading skeletons (replace spinners) for:
- Pets list
- Pet detail (header + tabs)
- Settings

Animations:
- Modal: fade + scale (Tailwind transition or framer-motion)
- Sidebar: slide
- Toast: built-in

Accessibility:
- All buttons have aria-label or visible text
- Form inputs have <label>
- Modal: role="dialog", aria-modal, focus trap, escape closes
- Color contrast WCAG AA minimum
- Keyboard navigation works (tab, enter, escape)
```

**Beklenen çıktı:** Polished, accessible, responsive UI.

---

### Task 25: Final Polish + README + Deploy

**Prompt:**
```
Final pass.

Code quality:
- Resolve all TS strict mode errors
- ESLint clean
- Prettier formatted
- No console.log in production
- Lazy-load modals via React.lazy + Suspense
- Code split routes

README.md sections:
1. Overview (what this app does, why)
2. Features (with screenshots placeholder)
3. Tech stack
4. Getting started
   - Prerequisites: Node 20+, pnpm, Firebase project
   - Firebase setup steps (create project, enable Auth/Firestore/Storage/Messaging, paste config to .env.local)
   - Composite indexes to create (list from Task 3)
   - VAPID key for FCM
   - pnpm install && pnpm dev
5. Project structure
6. Scripts (dev, build, preview, test, test:e2e, emulators, lint)
7. Deployment (Firebase Hosting: firebase deploy)
8. Firestore rules deployment: firebase deploy --only firestore:rules
9. Cloud Function for FCM reminders (code snippet, deployment instructions)
10. Roadmap / future features
11. License (MIT)

.env.example with all VITE_FIREBASE_* keys + VAPID.

GitHub Actions workflow (.github/workflows/ci.yml):
- On push: install, lint, typecheck, vitest
- On main branch: also build + deploy to Firebase Hosting (with secrets)

Lighthouse audit: aim 90+ on Performance, Accessibility, Best Practices, SEO.
PWA installable check.

Final manual QA pass through all flows.
```

**Beklenen çıktı:** Production-ready app, deploy edilebilir, dokümante edilmiş.

---

## Özet Tablo

| # | Task | Süre |
|---|------|------|
| 1 | Project Setup (PWA + Tailwind) | 30 min |
| 2 | Zod Schemas + Types | 30 min |
| 3 | Firebase Init + Security Rules | 45 min |
| 4 | i18n Setup (TR/EN) | 30 min |
| 5 | Zustand Store (client only) | 20 min |
| 6 | Auth + AuthGuard | 45 min |
| 7 | TanStack Query + Firestore Hooks | 60 min |
| 8 | App Layout + Routing | 30 min |
| 9 | Pets List | 30 min |
| 10 | Pet Modal | 30 min |
| 11 | Pet Detail (with search/filter) | 60 min |
| 12 | Health Record Modal | 30 min |
| 13 | Medication Modal | 30 min |
| 14 | PWA Reminders (SW + FCM) | 90 min |
| 15 | Share Modal | 30 min |
| 16 | Settings Screen | 45 min |
| 17 | Search/Filter Components | 30 min |
| 18 | PDF Report | 45 min |
| 19 | Export / Import | 45 min |
| 20 | Dark Mode | 30 min |
| 21 | Offline Polish | 30 min |
| 22 | Toast Wrapper | 20 min |
| 23 | Testing Setup | 60 min |
| 24 | Responsive Polish | 60 min |
| 25 | Final + README + Deploy | 60 min |
| | **TOPLAM** | **~14 saat** |

---

## v1'den Farklar

| v1 | v2 |
|---|---|
| 4 backend seçici (Firestore/Supabase/PocketBase/Custom) | Tek backend: Firestore |
| Server state Zustand'da | Server state TanStack Query'de, Zustand sadece client state |
| `setInterval` ile reminder | PWA service worker + FCM (tab kapalı çalışır) |
| Manuel form validation | react-hook-form + Zod |
| i18n son task'ta (Task 25 öncesi yok) | i18n Task 4'te kuruluyor, baştan tüm string'ler t() ile |
| Test yok | Vitest + Playwright (Task 23) |
| Firestore security rules yok | Task 3'te taslak, Task 25'te deploy |
| PDF report Task 23'te | Task 18'e alındı (vet ziyareti core use case) |
| 25 task ~11 saat | 25 task ~14 saat (multi-backend yok ama testing/PWA/i18n/security rules eklendi) |

---

## Kullanım

1. Task'ın prompt'unu kopyala
2. Yeni Claude chat aç (veya devam et)
3. Yapıştır
4. Üretilen kodu `src/` klasörüne yerleştir
5. Test et, sonraki task'a geç

Task 1-7 sırayla yapılması zorunlu (foundation).
Task 8-22 paralel olabilir (UI işleri).
Task 23-25 final.
