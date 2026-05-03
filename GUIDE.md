# Odin Tracker - Comprehensive User & Developer Guide

Welcome to **Odin Tracker**, the ultimate companion for pet health management. This project is made possible thanks to the generous free-tier API opportunities provided by **Google (Gemini)**, **Anthropic (Claude)**, and **Groq**, which we use for intelligent report interpretation and data extraction.

## 🚀 Getting Started

### 1. Environment Variables & Firebase Setup
To run Odin Tracker, you need to connect it to your own **Firebase** project. This ensures you have 100% control over your data.

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Services**:
    *   **Authentication**: Enable "Email/Password" provider.
    *   **Firestore Database**: Create a database in "Production" or "Test" mode.
    *   **Storage**: Enable Firebase Storage for pet photos and lab reports.
3.  **Get Your Config**: In Project Settings, add a "Web App" and copy the configuration object.
4.  **Set Up `.env`**:
    *   Copy `.env.example` to a new file named `.env`.
    *   Fill in the `VITE_FIREBASE_...` variables with the values from your Firebase config.
    *   **VITE_DISABLE_SIGNUP**: Set to `true` if you want to prevent new users from registering after you've created your account.

### 2. Setting Up Your AI Assistant (BYOK)
Odin Tracker features a "Bring Your Own Key" (BYOK) model to ensure 100% privacy and no monthly fees.
1.  Go to **Settings** > **API Keys Configuration**.
2.  Enter your keys for:
    *   **Google Gemini**: Recommended for daily tracking and lab analysis.
    *   **Groq**: Best for lightning-fast lab report extractions.
    *   **Claude (Anthropic)**: Excellent for deep medical insights.

### 3. Data Sovereignty & Privacy (Firestore)
Odin Tracker is built on a "Privacy-First" philosophy.
*   **Your Data, Your Control**: By using your own **Google Firestore** account, you ensure that your pet's medical data is never stored on a centralized server that you don't control.
*   **Account Setup**: When you create your own Firestore project, you are the only one with access to the database. Even the developers of Odin Tracker cannot see your information.
*   **Security**: Combined with the BYOK (AI Keys) model, this makes Odin Tracker one of the most secure health platforms available.

## 🩺 Core Features

### Lab Results Extraction
Instead of typing lab values manually, you can upload a photo or PDF of a blood test.
1.  Click **Add Record** > **Lab Result**.
2.  Upload your file.
3.  Choose your AI Provider (Gemini is the default).
4.  Click **Extract with AI**. The system will automatically find values like Creatinine, BUN, etc.

### Health History & Timeline
Use the **History** tab to see a chronological timeline of every vet visit, medication dose, and symptom check-in. This is vital information to show your vet during emergencies.

### Trends & Charts
If you track lab results over time, the **Trends** tab will show you visual graphs of kidney values, blood counts, and more, helping you spot potential issues before they become serious.

If you are a professional veterinarian:
*   **License**: Please refer to `LICENSE.md`. Commercial use in a professional clinic setting is not permitted under this license.
*   **Reports**: You may use the **Download Report** feature for personal pet management to generate a professional PDF summary.

---

# Odin Tracker - Kapsamlı Kullanıcı ve Geliştirici Kılavuzu

**Odin Tracker**'a hoş geldiniz, evcil hayvan sağlık yönetiminde en iyi yardımcınız. Bu kılavuz, başlamak için bilmeniz gereken her şeyi kapsar.

## 🚀 Başlarken

### 1. Ortam Değişkenleri ve Firebase Kurulumu
Odin Tracker'ı çalıştırmak için onu kendi **Firebase** projenize bağlamanız gerekir. Bu, verileriniz üzerinde %100 kontrol sahibi olmanızı sağlar.

1.  **Firebase Projesi Oluşturun**: [Firebase Konsolu](https://console.firebase.google.com/)'na gidin ve yeni bir proje oluşturun.
2.  **Servisleri Etkinleştirin**:
    *   **Authentication**: "E-posta/Şifre" sağlayıcısını etkinleştirin.
    *   **Firestore Database**: "Üretim" veya "Test" modunda bir veritabanı oluşturun.
    *   **Storage**: Evcil hayvan fotoğrafları ve laboratuvar raporları için Firebase Storage'ı etkinleştirin.
3.  **Yapılandırmanızı Alın**: Proje Ayarları'nda bir "Web Uygulaması" ekleyin ve yapılandırma nesnesini kopyalayın.
4.  **.env Dosyasını Ayarlayın**:
    *   `.env.example` dosyasını `.env` adında yeni bir dosyaya kopyalayın.
    *   `VITE_FIREBASE_...` değişkenlerini Firebase yapılandırmanızdaki değerlerle doldurun.
    *   **VITE_DISABLE_SIGNUP**: Hesabınızı oluşturduktan sonra yeni kullanıcıların kaydolmasını engellemek istiyorsanız `true` olarak ayarlayın.

### 2. Yapay Zeka Asistanını Kurma (Kendi Anahtarını Getir - BYOK)
Odin Tracker, %100 gizlilik ve aylık ücret olmaması için "Kendi Anahtarını Getir" modelini kullanır.
1.  **Ayarlar** > **API Anahtarları Yapılandırması**'na gidin.
2.  Şu servisler için anahtarlarınızı girin:
    *   **Google Gemini**: Günlük takip ve laboratuvar analizi için önerilir.
    *   **Groq**: Işık hızında laboratuvar raporu çıkarımı için en iyisidir.
    *   **Claude (Anthropic)**: Derin tıbbi içgörüler için mükemmeldir.

## 🩺 Temel Özellikler

### Laboratuvar Sonuçları Çıkarımı
Laboratuvar değerlerini manuel olarak yazmak yerine, bir kan testinin fotoğrafını veya PDF'sini yükleyebilirsiniz.
1.  **Kayıt Ekle** > **Laboratuvar Sonucu**'na tıklayın.
2.  Dosyanızı yükleyin.
3.  Yapay Zeka Sağlayıcınızı seçin (Varsayılan Gemini'dir).
4.  **Yapay Zekayla Doldur**'a tıklayın. Sistem Kreatinin, BUN vb. değerleri otomatik olarak bulacaktır.

### Sağlık Geçmişi ve Zaman Çizelgesi
Her veteriner ziyaretinin, ilaç dozunun ve semptom kontrolünün kronolojik bir zaman çizelgesini görmek için **Geçmiş** sekmesini kullanın. Bu, acil durumlarda veterinerinize göstermek için hayati bir bilgidir.

### Trendler ve Grafikler
Laboratuvar sonuçlarını zaman içinde takip ederseniz, **Trendler** sekmesi böbrek değerleri, kan sayımları ve daha fazlasının görsel grafiklerini göstererek, ciddi sorunlar oluşmadan önce potansiyel sorunları fark etmenize yardımcı olur.

## 🐾 Veteriner Hekimler İçin (Ticari Kullanım)

Kliniğiniz için bu yazılımı kullanan bir profesyonelseniz:
*   **Lisans**: Lütfen `LICENSE.md` dosyasına bakın. Ticari kullanım profesyonel bir lisans gerektirir.
*   **Raporlar**: Evcil hayvan sahipleriyle paylaşmak üzere profesyonel bir PDF özeti oluşturmak için Evcil Hayvan Detay ekranındaki **Raporu İndir** özelliğini kullanın.
### 3. Veri Egemenliği ve Gizlilik (Firestore)
Odin Tracker "Önce Gizlilik" felsefesiyle oluşturulmuştur.
*   **Sizin Veriniz, Sizin Kontrolünüz**: Kendi **Google Firestore** hesabınızı kullanarak, evcil hayvanınızın tıbbi verilerinin kontrol etmediğiniz merkezi bir sunucuda asla saklanmamasını sağlarsınız.
*   **Hesap Kurulumu**: Kendi Firestore projenizi oluşturduğunuzda, veritabanına erişimi olan tek kişi siz olursunuz. Odin Tracker geliştiricileri bile bilgilerinizi göremez.
*   **Güvenlik**: BYOK (Yapay Zeka Anahtarları) modeliyle birleştiğinde, bu Odin Tracker'ı mevcut en güvenli sağlık platformlarından biri yapar.
