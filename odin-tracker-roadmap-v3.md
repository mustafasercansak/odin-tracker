# Odin Tracker - Roadmap v3 (Firestore + AI Vision Extraction + Trends)

**Tek backend: Firebase. Lab raporu görselleri vision LLM ile otomatik forma dönüşür. Yapılandırılmış lab değerleri zaman içinde grafiklenir. Tüm sıkı koşullar v2'den korundu: PWA, i18n, Zod, security rules.**

---

## 🎯 Mimari Kararlar

```
React SPA (Vite + TS + Tailwind)
│
├─ Firebase
│  ├─ Firestore        → veri
│  ├─ Auth             → email/password
│  ├─ Storage          → fotoğraf, lab raporu görselleri
│  ├─ Cloud Messaging  → push notification (PWA)
│  └─ Cloud Functions  → AI vision extraction proxy
│
├─ AI Vision (Cloud Function)
│  ├─ Provider abstraction (Anthropic varsayılan, Gemini opsiyonel)
│  ├─ Default: Claude Haiku 4.5 (vision, ucuz)
│  └─ Per-user rate limiting (50/ay)
│
├─ State
│  ├─ TanStack Query   → server state
│  └─ Zustand          → client state
│
├─ Form & Validasyon
│  ├─ React Hook Form  → form state
│  └─ Zod              → schema (function tarafında da kullanılır)
│
├─ Charts
│  └─ Recharts         → trend grafikleri, referans aralığı bantlı
│
├─ PWA
│  └─ vite-plugin-pwa
│
└─ i18n
   └─ react-i18next    → TR / EN
```

### Lab takibi yaklaşımı

| Katman | Ne tutulur | Kullanım |
|---|---|---|
| Görsel/PDF | Orijinal lab raporu | Source of truth, vet imzalı belge |
| Yapılandırılmış measurements | parametre + değer + birim + ref aralık | Trend grafikleri, otomatik flag |
| AI extraction | Görselden measurements'a dönüşüm | Manuel girişe alternatif, kullanıcı doğrular |

CKD takibi için canonical parametreler: creatinine, sdma, bun, phosphorus, potassium, urine_specific_gravity, upc_ratio. Listeyi schema'da sabit tutuyoruz, vet'in dilinden bağımsız i18n ile gösteriyoruz.

---

## 📋 Task'lar

### Task 1: Project Setup

**Prompt:**
```
Create a React + TypeScript + Vite SPA for Odin Tracker.

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
- recharts
- react-i18next i18next i18next-browser-languagedetector
- tailwindcss postcss autoprefixer
- vite-plugin-pwa workbox-window
- jspdf jspdf-autotable

Dev dependencies:
- vitest @testing-library/react @testing-library/jest-dom jsdom
- @playwright/test
- eslint-plugin-react-hooks
- prettier
- firebase-tools (global or as dev dep)

Configure:
- tsconfig.json strict mode + path alias (@/* → src/*)
- vite.config.ts with vite-plugin-pwa (registerType: 'autoUpdate')
- tailwind.config.js (darkMode: 'class')
- .env.example with VITE_FIREBASE_* + VITE_FUNCTIONS_REGION
- .gitignore

Folder structure:
src/
├─ components/
├─ screens/
├─ modals/
├─ hooks/queries/
├─ store/
├─ lib/
├─ schemas/
├─ types/
├─ i18n/locales/
├─ test/
├─ App.tsx
└─ main.tsx

functions/                    # Cloud Functions (separate package)
├─ src/
│   ├─ extractLabResults.ts
│   └─ index.ts
├─ package.json
└─ tsconfig.json

Initialize Firebase Functions:
firebase init functions (TypeScript, Node 20)
```

**Beklenen çıktı:** Vite app + Firebase Functions iskeleti. PWA-ready, test-ready.

---

### Task 2: Zod Schemas + Type Definitions

**Prompt:**
```
Create Zod schemas in src/schemas/ and re-export types.

Schemas split per file:

src/schemas/measurement.ts:
- canonicalParameterSchema: z.enum([
    'creatinine', 'sdma', 'bun', 'phosphorus', 'potassium',
    'calcium', 'sodium', 'chloride', 'albumin', 'total_protein',
    'urine_specific_gravity', 'upc_ratio', 'urine_ph',
    'hematocrit', 'hemoglobin', 'wbc', 'platelets',
    'alt', 'ast', 'alkp', 'glucose', 't4'
  ])
- measurementSchema: {
    parameter: canonicalParameterSchema OR string (for non-canonical),
    originalLabel: string,        // exact text from lab report
    value: number,
    unit: string,
    referenceMin: number | null,
    referenceMax: number | null,
    flag: 'high' | 'low' | 'normal' | null,
    confidence: 'high' | 'medium' | 'low' | null,  // for AI-extracted
    aiExtracted: boolean
  }

src/schemas/healthRecord.ts:
- recordTypeSchema: z.enum(['medication', 'vet_visit', 'symptom', 'lab_test', 'weight'])
- healthRecordSchema: {
    id, petId, recordDate, recordType, description, notes?, fileUrl?,
    measurements?: Measurement[]    // present when recordType === 'lab_test'
    weightKg?: number,              // present when recordType === 'weight'
    labName?: string,               // present when lab_test
    extractionMetadata?: {
      provider: 'anthropic' | 'google',
      model: string,
      extractedAt: timestamp,
      userVerified: boolean
    },
    createdAt, updatedAt
  }
- Use z.discriminatedUnion on recordType for stricter typing per variant

src/schemas/pet.ts, src/schemas/medication.ts, src/schemas/sharedAccess.ts, src/schemas/user.ts:
- As in v2 roadmap

src/schemas/extraction.ts (used by both client and Cloud Function):
- extractionResultSchema: {
    testDate: string | null,
    labName: string | null,
    patientName: string | null,
    measurements: Measurement[] (without id, aiExtracted=true),
    notes: string | null
  }

src/types/index.ts:
- Re-export via z.infer<>

Make functions/src/schemas/ a copy or symlink of these (or use a shared package). Important that Cloud Function validates AI output with the same Zod schema before returning to client.
```

**Beklenen çıktı:** Tüm entity'ler için Zod schema. `measurement` ayrı bir nesne. Lab test record'lar measurements array taşır.

---

### Task 3: Firebase Init + Security Rules + Functions Bootstrap

**Prompt:**
```
src/lib/firebase.ts:
- Initialize app, auth, db, storage, messaging, functions
- Set functions region from VITE_FUNCTIONS_REGION (e.g. 'europe-west1' for low latency from Turkey)
- Enable Firestore offline persistence
- Auth persistence: local

firestore.rules:
- pets: read if owner OR has sharedAccess doc; create if authed; update/delete if owner OR shared admin
- health_records: read/write follows parent pet permissions
- medications: same
- shared_access: read if pet owner OR sharedWithUserId == auth.uid; write only by pet owner
- users/{userId}: read if authed, write only by self
- users/{userId}/usage/{doc}: read/write by self only (extraction quota tracking)

storage.rules:
- pet_photos/{petId}/* : read/write follows pet permissions
- health_files/{petId}/{recordId}/* : read/write follows pet permissions

Composite indexes (firestore.indexes.json):
- health_records: petId ASC, recordDate DESC
- health_records: petId ASC, recordType ASC, recordDate DESC
- medications: petId ASC, nextDoseDue ASC
- shared_access: sharedWithUserId ASC, createdAt DESC

functions/src/index.ts:
- Empty entry point that exports extractLabResults from ./extractLabResults
- Set Node 20, region matching client

functions/package.json deps:
- firebase-admin
- firebase-functions
- @anthropic-ai/sdk
- @google/generative-ai (optional, for provider switch)
- zod

Configure Functions secrets (not .env):
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set GOOGLE_API_KEY  # optional

Document setup steps in README.
```

**Beklenen çıktı:** `src/lib/firebase.ts`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, Functions iskeleti, secret kurulum dokümanı.

---

### Task 4: i18n Setup (TR/EN) [COMPLETED]

**Prompt:**
```
Setup react-i18next as in v2.

Add namespace for lab parameters - canonical labels in both languages:

src/i18n/locales/tr.json:
{
  "lab": {
    "parameters": {
      "creatinine": "Kreatinin",
      "sdma": "SDMA",
      "bun": "BUN (Üre)",
      "phosphorus": "Fosfor",
      "potassium": "Potasyum",
      "urine_specific_gravity": "İdrar Yoğunluğu (USG)",
      "upc_ratio": "UPC Oranı",
      ...
    },
    "flags": {
      "high": "Yüksek",
      "low": "Düşük",
      "normal": "Normal"
    },
    "confidence": {
      "high": "Yüksek güven",
      "medium": "Orta güven",
      "low": "Düşük güven, lütfen doğrulayın"
    }
  }
}

src/i18n/locales/en.json: equivalent EN translations.

Helper function getParameterLabel(parameter: string, t): string
- Looks up t(`lab.parameters.${parameter}`) for canonical params
- Falls back to humanized originalLabel for non-canonical
```

**Beklenen çıktı:** TR/EN i18n + lab parametre sözlüğü.

---

### Task 5: Zustand Store (Client State Only) [COMPLETED]

**Prompt:**
```
src/store/useAppStore.ts as in v2.

Add fields for trends screen:
- trendsTimeRange: '3m' | '6m' | '1y' | 'all'
- trendsSelectedParams: string[]   // canonical parameter names

Persist (localStorage): theme, locale, selectedPetId, trendsTimeRange, trendsSelectedParams.
Do NOT persist: modal state, search, filters, online status.
```

**Beklenen çıktı:** Zustand store, ~100 satır.

---

### Task 6: Auth + AuthGuard [COMPLETED]

Same as v2. Firebase Auth, react-hook-form + Zod, AuthGuard wrapping protected routes, error code → i18n key mapping.

---

### Task 7: TanStack Query + Firestore Hooks [COMPLETED]

**Prompt:**
```
As in v2 roadmap.

Add to useHealthRecords.ts:
- useLabRecords(petId): useQuery filtered to recordType === 'lab_test' AND has measurements

Add new file src/hooks/queries/useTrendData.ts:
- useMeasurementSeries(petId, parameter, timeRange):
  Reads from useLabRecords cache (no extra fetch)
  Filters records in time range
  Flattens measurements matching the parameter
  Returns sorted array: [{ date, value, unit, flag }]
  Memoized

src/hooks/queries/useExtraction.ts:
- useExtractLabResults(): useMutation
  - Input: { fileUrl: string, petId: string }
  - Calls Cloud Function via httpsCallable
  - Returns parsed extractionResultSchema
  - Errors mapped to i18n keys (quota_exceeded, extraction_failed, invalid_image)

src/hooks/queries/useUsage.ts:
- useExtractionUsage(): useQuery for users/{uid}/usage/extractions doc
  - Returns { count, monthStart, limit }
  - Used to show "X / 50 ekstraksiyon kaldı" in UI
```

**Beklenen çıktı:** Tüm Firestore + Function çağrıları hook'larda. Component'lerde direkt SDK yok.

---

### Task 8: App Layout + Routing [COMPLETED]

Same as v2.

---

### Task 9: Pets List Screen [COMPLETED]

Same as v2.

---

### Task 10: Pet Add/Edit Modal [COMPLETED]

Same as v2.

---

### Task 11: Pet Detail Screen [COMPLETED]

**Prompt:**
```
src/screens/PetDetail.tsx as in v2 with one extra tab.

Tabs:
1. Health Records (general list, all types)
2. Medications
3. Trends                ← NEW (only shown if at least one lab_test record exists)
4. Shared Access (owner only)

Health Records tab unchanged from v2.

Trends tab implemented in Task 15 (separate component, just placeholder here).

When opening Health Records and recordType filter is 'lab_test', show extra column:
- Number of measurements (e.g. "8 değer")
- Click row → expand shows table of measurements with flags color-coded
```

---

### Task 12: Health Record Modal (basic, all types) [COMPLETED]

**Prompt:**
```
src/modals/HealthRecordModal.tsx.

react-hook-form + zodResolver(healthRecordInputSchema).

Common fields (all types):
- recordDate
- recordType (select)
- description
- notes
- file upload (optional, max 10MB, PDF or image)

Conditional sections (rendered based on selected recordType):

If 'weight':
- weightKg number input

If 'lab_test':
- labName text input
- Below: section that says "Lab değerleri" with two options:
  a) "Yapay zekayla doldur" button (only if file uploaded)  → Task 14 takes over
  b) "Manuel ekle" button → opens MeasurementEditor

If 'medication':
- Just description (medication name)
- Note: actual scheduled medications use MedicationModal (Task 13), this is for a quick "gave a dose" log

This task implements the BASE form including manual MeasurementEditor. Task 14 adds the AI extraction flow.

src/components/MeasurementEditor.tsx:
- Table of measurement rows: parameter (select with canonical + custom), value, unit, refMin, refMax
- Add row / remove row buttons
- Auto-flag calculation: if value < refMin → 'low', > refMax → 'high', else 'normal'
- Auto-fill unit when canonical parameter selected (e.g. creatinine → mg/dL default)
- Reusable: same component used in Task 14 to display extracted results

On submit, save healthRecord doc with measurements array.
File uploaded to Storage, fileUrl saved.
```

**Beklenen çıktı:** Tüm record type'lar için form, manuel measurement girişi çalışıyor. AI tarafı henüz yok.

---

### Task 13: Medication Modal [COMPLETED]

Same as v2.

---

### Task 14: Lab Test AI Extraction (Cloud Function + UX) [COMPLETED]

**Prompt:**
```
This is a two-part task: Cloud Function backend + frontend extraction flow.

PART A: Cloud Function

functions/src/extractLabResults.ts:

Authenticated callable function (onCall, requires Firebase Auth).

Input:
- { fileUrl: string, petId: string }

Steps:
1. Verify auth: throw HttpsError('unauthenticated') if no context.auth
2. Verify pet ownership: read pets/{petId}, check ownerId === uid OR shared with edit/admin
3. Check rate limit:
   - Read users/{uid}/usage/extractions
   - If current month count >= 50, throw HttpsError('resource-exhausted', 'quota_exceeded')
4. Download image from Storage:
   - Use Storage URL
   - Convert to base64
   - Detect MIME type (only allow image/jpeg, image/png, image/webp, application/pdf)
   - For PDF: convert first page to image (use pdf-lib or pdfjs-dist)
5. Call AI provider:
   - Read provider from functions config (default 'anthropic')
   - For anthropic:
     anthropic.messages.create({
       model: 'claude-haiku-4-5-20251001',
       max_tokens: 2048,
       messages: [{
         role: 'user',
         content: [
           { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } },
           { type: 'text', text: EXTRACTION_PROMPT }
         ]
       }]
     })
   - Strip ```json code fences if present
   - Parse JSON
6. Validate with extractionResultSchema (Zod)
   - If validation fails, log raw output and throw HttpsError('internal', 'extraction_failed')
7. Increment usage counter in Firestore (transaction)
8. Return parsed result + extractionMetadata { provider, model, extractedAt }

EXTRACTION_PROMPT (constant in the function file):
```
You are a veterinary lab report parser. Extract test results from the image.

Return ONLY valid JSON, no prose, no markdown fences, in this exact schema:
{
  "testDate": "YYYY-MM-DD or null",
  "labName": "string or null",
  "patientName": "string or null",
  "measurements": [
    {
      "parameter": "canonical name from list below, or snake_case of original if not in list",
      "originalLabel": "exact text from image",
      "value": number,
      "unit": "string",
      "referenceMin": number or null,
      "referenceMax": number or null,
      "flag": "high|low|normal|null",
      "confidence": "high|medium|low"
    }
  ],
  "notes": "any handwritten notes or warnings"
}

Canonical parameter names (use these when matching):
creatinine, sdma, bun, phosphorus, potassium, calcium, sodium,
chloride, albumin, total_protein, urine_specific_gravity, upc_ratio,
urine_ph, hematocrit, hemoglobin, wbc, platelets, alt, ast, alkp,
glucose, t4

Common Turkish/English aliases:
- Kreatinin / Creatinine / CREA → creatinine
- Üre / Urea / BUN → bun
- Fosfor / Phosphorus / PHOS → phosphorus
- Potasyum / Potassium / K → potassium
- İdrar yoğunluğu / USG / Specific Gravity → urine_specific_gravity
- İdrar protein/kreatinin / UPC → upc_ratio

Confidence rules:
- "low" if digit unclear, smudged, partially cut off, or your reading uncertain
- "medium" if legible but slight ambiguity
- "high" if clear

If a value is not in the canonical list, still extract it with snake_case parameter name.
Never invent values. If you cannot read it, omit the row.
```

PART B: Frontend Extraction UX

When user opens HealthRecordModal in 'lab_test' mode and uploads a file:

1. Upload file to Storage immediately (not on form submit) so we have a fileUrl
2. Show "Yapay zekayla doldur" button below the file input
3. On click:
   - Show loading state with progress messages: "Görsel yükleniyor...", "Yapay zeka okuyor...", "Sonuçlar hazırlanıyor..." (rotate)
   - Call useExtractLabResults() mutation
   - Show usage counter: "Bu ay kalan: 47 / 50"
4. On success:
   - Pre-fill testDate field with extracted testDate (if not null)
   - Pre-fill labName field
   - Replace MeasurementEditor rows with extracted measurements
   - Each row gets:
     - Checkbox (default checked, except confidence='low' which is unchecked)
     - Confidence indicator (badge: green/yellow/red)
     - Edit-in-place capability
   - Show summary banner: "8 değer çıkarıldı, 2'sinin güveni düşük, lütfen doğrulayın"
5. On error:
   - quota_exceeded: "Aylık ekstraksiyon kotanız doldu. Manuel girebilirsiniz."
   - extraction_failed: "Görselden değer çıkarılamadı. Manuel girmeyi deneyin."
   - invalid_image: "Görsel formatı desteklenmiyor."

User then reviews, edits, unchecks any wrong values, and submits the form.
On submit, save healthRecord with:
- measurements: only checked rows
- extractionMetadata: { provider, model, extractedAt, userVerified: true }

Save the original file as fileUrl regardless. Source of truth always preserved.

Cost guard: If user uploads a file >5MB, show warning and offer to compress before extraction.
```

**Beklenen çıktı:** Çalışan AI extraction. Cloud Function deploy edilir, frontend butonu çalışır, kota gösterilir, kullanıcı doğrular ve kaydeder.

---

### Task 15: Trends / Charts Tab [COMPLETED]

**Prompt:**
```
src/screens/PetDetailTrends.tsx (or as a sub-component of PetDetail).

Goal: Visualize lab measurements over time with reference range bands.

Layout:
- Top controls:
  - Time range selector: 3 ay | 6 ay | 1 yıl | Hepsi (Zustand trendsTimeRange)
  - Parameter multi-select: shows only parameters that have at least 2 measurements in the time range
  - Default selected: creatinine, sdma, phosphorus (CKD-relevant) if data exists
- Empty state: "Henüz lab verisi yok. İlk lab kaydını ekleyin."

For each selected parameter, render a card with:
- Parameter name (i18n)
- Latest value with flag color
- Mini trend chart (Recharts):
  - LineChart with dots
  - X-axis: date (date-fns formatted, smart spacing)
  - Y-axis: value, with auto-scaling
  - ReferenceArea: shaded band between referenceMin and referenceMax (use the most recent ref range from data, since labs sometimes change ranges)
  - Dots colored by flag: red (high), blue (low), green (normal)
  - Tooltip on hover: full date, value, lab name (if available)
- Below chart: small table with last 3 values

Cards arranged in 1 col mobile, 2 col tablet, 3 col desktop.

Use src/hooks/queries/useTrendData.ts (Task 7) for data.

Performance:
- Memoize per-parameter series
- Lazy-load Recharts (React.lazy)

If a parameter has measurements with inconsistent units (e.g. mg/dL and μmol/L for creatinine), display a warning and offer unit conversion (or just show both series). For MVP, just show warning.

All strings via t().
```

**Beklenen çıktı:** Tab açılınca seçilen parametreler için zaman serisi grafikleri, referans aralığı bantlı.

---

### Task 16: PWA Reminders (Service Worker + FCM) [COMPLETED]

Same as v2 Task 14. Service worker + IndexedDB based local notifications, FCM for server-side push when app fully closed. Cloud Function for FCM scheduling can share the Functions package set up in Task 3.

---

### Task 17: Share Modal [COMPLETED]

Same as v2.

---

### Task 18: Settings Screen [COMPLETED]

**Prompt:**
```
As in v2.

Add new section: "AI Extraction"
- Provider display (read-only): "Anthropic Claude" or "Google Gemini"
- This month usage: "X / 50 ekstraksiyon kullanıldı"
- Reset date display
- (Future) Provider switch for users with own keys (out of MVP scope)

Add toggle: "Lab değerlerini paylaş anonim olarak" (opt-in for future analytics, default off, out of MVP scope but reserve the toggle).
```

---

### Task 19: Search & Filter [COMPLETED]

Same as v2.

Additional filter for lab records:
- Filter by parameter (e.g. "show only records with creatinine measurements")

---

### Task 20: PDF Report Generation (with Trend Charts) [COMPLETED]

**Prompt:**
```
src/lib/reportGenerator.ts.

Extends v2 spec.

Page structure:
1. Header
2. Pet info
3. Health records summary table (last 50)
4. Active medications table
5. NEW: Lab trends section
   - For each canonical parameter with >=3 measurements in last 6 months:
     - Render the Recharts trend chart to canvas (use html2canvas or recharts' built-in)
     - Embed as image in PDF
     - Include reference range and last 3 values below
   - Limit to top 6 parameters by clinical relevance order:
     creatinine, sdma, bun, phosphorus, potassium, urine_specific_gravity
6. Notes for vet section

Implementation:
- Use jsPDF + jspdf-autotable for tables
- Use html2canvas to snapshot Recharts components rendered in a hidden div
- File size warning: PDF can get large with many charts. Optimize images.

Filename: {pet.name}-rapor-{YYYY-MM-DD}.pdf

Localize all labels.
```

**Beklenen çıktı:** Veteriner için kullanışlı PDF, son 6 ayın kritik parametreleri grafikli.

---

### Task 21: Export / Import (JSON) [COMPLETED]

Same as v2. measurements zaten healthRecord içinde, ekstra iş yok.

Schema validation for import:
- Reject if version mismatch
- Reject if Zod validation fails on any record
- Skip duplicates by id

---

### Task 22: Dark Mode [COMPLETED]

Same as v2. Recharts component'leri için ek olarak:
- Stroke ve grid renkleri tema değişkenlerinden gelsin (Tailwind CSS variables)
- ReferenceArea fill opacity dark mode'da daha düşük

---

### Task 23: Offline Support (TanStack Query Persister) [COMPLETED]

Same as v2.

Note: AI extraction çevrimdışı çalışmaz (Cloud Function gerekli). Offline'ken extraction butonu disabled, "İnternet gerekli" tooltip.

---

### Task 24: Toast Notifications [COMPLETED]

Same as v2.

Yeni mesajlar:
- common.toasts.extractionStarted
- common.toasts.extractionSuccess (count parametresiyle)
- common.toasts.extractionPartial (low confidence count)
- common.toasts.extractionFailed
- common.toasts.quotaExceeded

---

### Task 25: Testing Setup

**Prompt:**
```
As in v2 plus AI-specific tests.

UNIT (Vitest):

Cloud Function unit tests (functions/src/__tests__/):
- extractLabResults: mock Anthropic SDK
  - Valid extraction → returns parsed result
  - Invalid auth → throws unauthenticated
  - Quota exceeded → throws resource-exhausted
  - AI returns invalid JSON → throws internal
  - AI returns valid JSON but Zod fails → throws internal
- Use firebase-functions-test for testing

Schema tests:
- measurementSchema accepts/rejects correct fields
- healthRecordSchema discriminated union behaves per type
- extractionResultSchema validates AI output shape

Component tests:
- MeasurementEditor add/remove/edit rows
- Auto-flag calculation works

E2E (Playwright):

tests/extraction.spec.ts:
- With Firebase emulator + mocked Function response
- Upload image → click extract → verify rows populate → uncheck low-confidence → save → verify saved with measurements

tests/trends.spec.ts:
- Seed pet with multiple lab records
- Open trends tab
- Verify chart renders with correct data points
- Change time range, verify update

Cloud Function emulator: firebase emulators:start --only functions,firestore,storage,auth
```

**Beklenen çıktı:** Vision extraction dahil tüm kritik akışlar tested.

---

### Task 26: Responsive Polish [COMPLETED]

Same as v2.

Trends sekmesi için ekstra:
- Mobile'da grafik kartları tek sütun, dokunma alanı uygun
- Recharts responsive container
- Tooltip mobile'da long-press tetiklemeli

Extraction UX'i mobil için:
- Fotoğraf çekme: `<input type="file" accept="image/*" capture="environment">` ile direkt kameraya açılabilir
- Lab raporunu telefondan çekip yüklemek tek dokunuş

---

### Task 27: Final Polish + README + Deploy [COMPLETED]

**Prompt:**
```
As in v2 with extra setup steps for AI.

README sections to add:

## AI Extraction Setup

1. Get an Anthropic API key: https://console.anthropic.com
2. Set the secret:
   ```
   firebase functions:secrets:set ANTHROPIC_API_KEY
   ```
3. (Optional) For Gemini fallback:
   ```
   firebase functions:secrets:set GOOGLE_API_KEY
   ```
4. Deploy functions:
   ```
   firebase deploy --only functions
   ```
5. Set provider in Firebase Functions environment:
   ```
   firebase functions:config:set ai.provider="anthropic"
   ```

## Cost Estimate
- Claude Haiku 4.5: ~$0.005 per lab report extraction
- 50 extractions/month default cap = ~$0.25/user/month max
- Adjust EXTRACTION_QUOTA_PER_MONTH constant in functions/src/extractLabResults.ts to change

## Privacy Note
Lab report images are sent to the AI provider for OCR. Original images are stored in your own Firebase Storage and never leave your project. Image is only sent to Anthropic/Google during the extraction call and is not stored by them per their API terms (verify their current data retention policy before use).

GitHub Actions:
- On push to main: deploy hosting + functions + firestore.rules + indexes
```

**Beklenen çıktı:** Production-ready, deploy edilebilir, dokümante edilmiş.

---

## Özet Tablo

| # | Task | Süre |
|---|------|------|
| 1 | Project Setup (PWA + Functions) | 45 min |
| 2 | Zod Schemas (with measurement) | 45 min |
| 3 | Firebase Init + Rules + Functions Bootstrap | 60 min |
| 4 | i18n + lab parameter dictionary | 45 min |
| 5 | Zustand Store | 20 min |
| 6 | Auth + AuthGuard | 45 min |
| 7 | TanStack Query + hooks (with extraction + trends) | 75 min |
| 8 | App Layout + Routing | 30 min |
| 9 | Pets List | 30 min |
| 10 | Pet Modal | 30 min |
| 11 | Pet Detail (with Trends tab placeholder) | 60 min |
| 12 | Health Record Modal + MeasurementEditor | 60 min |
| 13 | Medication Modal | 30 min |
| 14 | **AI Vision Extraction (Function + UX)** | **120 min** |
| 15 | **Trends / Charts Tab** | **75 min** |
| 16 | PWA Reminders | 90 min |
| 17 | Share Modal | 30 min |
| 18 | Settings (with AI usage section) | 50 min |
| 19 | Search/Filter | 30 min |
| 20 | PDF Report (with trend charts) | 60 min |
| 21 | Export / Import | 45 min |
| 22 | Dark Mode | 30 min |
| 23 | Offline Polish | 30 min |
| 24 | Toast Wrapper | 20 min |
| 25 | Testing (with extraction + trends) | 75 min |
| 26 | Responsive Polish | 60 min |
| 27 | Final + README + Deploy | 60 min |
| | **TOPLAM** | **~21 saat** |

---

## v2'den Farklar

| v2 | v3 |
|---|---|
| Lab kayıtları sadece açıklama + dosya | Yapılandırılmış measurements array, görsel ile birlikte |
| Manuel girişe alternatif yok | AI vision extraction (Cloud Function proxy) |
| Trend grafiği yok | Trends tab + PDF rapora trend grafikleri |
| 25 task ~14 saat | 27 task ~21 saat |
| Cloud Function yok | Cloud Function (extraction + opsiyonel FCM scheduler) |

---

## Kullanım sırası önerisi

**Foundation (zorunlu sıra):** 1 → 2 → 3 → 4 → 5 → 6 → 7

**Core CRUD (sıra esnek):** 8, 9, 10, 11, 12, 13

**AI ve görselleştirme (12'den sonra):** 14 → 15

**Genişletme (paralel olabilir):** 16, 17, 18, 19, 20, 21

**Polish:** 22, 23, 24, 25, 26, 27

Task 14 (AI extraction) ve Task 15 (trends), Task 12 (HealthRecordModal + MeasurementEditor) tamamlanmadan yapılmamalı çünkü ikisi de measurement schema ve UI primitive'lerine dayanıyor.

---

## Riskler ve mitigasyon

| Risk | Mitigasyon |
|---|---|
| AI yanlış değer çıkarır | Confidence skoru + kullanıcı doğrulama zorunlu, source görsel her zaman saklanır |
| Anthropic API ücreti şişer | Per-user 50/ay kotası, function tarafında enforce |
| Vet farklı birim kullanır (mg/dL vs μmol/L) | İlk MVP: uyarı göster, ileride otomatik dönüşüm |
| Türkçe lab raporları doğru parse olmaz | Prompt'ta TR alias listesi, test ile doğrula |
| Kullanıcı API key sızar | Browser-side API key yok, sadece Cloud Function üzerinden |
| Trend grafiği yanıltıcı (az veri ile) | Minimum 3 ölçüm şartı, az veri varsa "veri yetersiz" mesajı |
