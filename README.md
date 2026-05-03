# 🐾 Odin Tracker

![Odin Tracker Hero Banner](./public/assets/hero-banner.png)

### The Ultimate AI-Powered Pet Health Companion

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> [!WARNING]
> **Medical Disclaimer**: Odin Tracker is a tracking tool and NOT a substitute for professional veterinary advice. Always consult a vet for medical decisions.

Odin Tracker is a professional-grade, privacy-first pet health management dashboard. It combines cutting-edge AI extraction for lab reports with a robust, personal data-sovereignty model.

---

## ✨ Key Features

*   **🧠 Multi-Provider AI Extraction**: Upload lab reports (PDF/Photo) and let Gemini, Groq, or Claude automatically extract medical values (Creatinine, BUN, SDMA, etc.).
*   **🛡️ Privacy-First (BYOK)**: "Bring Your Own Key" model ensures your data never touches our servers. Your medical analysis happens via your own API keys.
*   **📂 Data Sovereignty**: Built on Firestore, allowing you to use your own personal database to protect your sensitive information.
*   **📈 Smart Trends**: Visualize your pet's health history with high-contrast, interactive charts.
*   **💊 Medication & Vaccine Alerts**: Never miss a dose with integrated scheduling and automated logging.
*   **📜 Professional Reports**: Generate and download comprehensive health summaries to share with your veterinarian.
*   **🌍 Multi-Language Support**: Fully localized in 11+ languages including English, Turkish, German, Spanish, French, and more.
*   **📱 PWA Ready**: Install on your phone (iOS/Android) for a native app experience.

---

## 📚 Documentation

We provide extensive documentation for both pet owners and veterinary professionals:

*   **[Full User & Developer Guide (EN/TR)](GUIDE.md)**: Setup, AI configuration, and feature walkthroughs.
*   **[Visual Assets Gallery](ASSETS.md)**: Explore the design language and branding assets.
*   **[License Terms](LICENSE.md)**: Free for individuals/non-profits; paid for professionals.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
npm run dev
```

### 2. Configuration
*   Create a `.env` file based on `.env.example`.
*   Set up your Firebase project and add your credentials.
*   Configure your AI keys in the app settings to enable extraction features.

---

## 📱 Mobile Installation

Odin Tracker is a **Progressive Web App (PWA)**. To use it on your phone:

### iOS (Safari)
1. Open the app URL in Safari.
2. Tap the **Share** button (box with arrow).
3. Scroll down and tap **Add to Home Screen**.

### Android (Chrome)
1. Open the app URL in Chrome.
2. Tap the **three dots** (menu) in the corner.
3. Tap **Install App** or **Add to Home Screen**.

---

## 🌍 Localization & Multi-Language Support

Odin Tracker currently supports the following languages:

*   🇺🇸 **English** (en)
*   🇹🇷 **Türkçe** (tr)
*   🇩🇪 **Deutsch** (de)
*   🇪🇸 **Español** (es)
*   🇫🇷 **Français** (fr)
*   🇮🇹 **Italiano** (it)
*   🇷🇺 **Русский** (ru)
*   🇵🇹 **Português** (pt)
*   🇳🇱 **Nederlands** (nl)
*   🇯🇵 **日本語** (ja)
*   🇨🇳 **简体中文** (zh)

### Contributing New Languages
If you would like to add a new language or improve an existing translation:
1.  Navigate to `src/locales`.
2.  Create a new folder for your language code (e.g., `it` for Italian).
3.  Copy the `translation.json` from the `en` folder and translate the values.
4.  Add the new language to the `i18n.ts` configuration and the `Settings.tsx` screen.

---

## 🙏 Acknowledgments

Special thanks to the following providers for their incredible free-tier API opportunities, which power the intelligent features of Odin Tracker:
*   **Google (Gemini)**: Powers the primary data extraction and health interpretation.
*   **Anthropic (Claude)**: Provides deep medical insights and report analysis.
*   **Groq**: Enables ultra-fast lab result processing and data transfers.

We are grateful for these tools that allow us to provide professional-grade pet health tracking to everyone for free.

---

## 🤝 Connect & Support

Odin Tracker is developed by **Mustafa Sercan Sak**. 

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mustafa-sercan-sak-30190684/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mustafasercansak/odin-tracker)

For community support or contributions, please reach out via LinkedIn or GitHub.

---

## ⚖️ License

Licensed under the **PolyForm Noncommercial 1.0.0**. 
*   **Individuals & Non-profits**: Free.
*   **Professionals**: Commercial use is not permitted under this license.
See [LICENSE.md](LICENSE.md) for full details.
