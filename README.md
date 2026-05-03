# 🐾 Odin Tracker

![Odin Tracker Hero Banner](public/assets/hero-banner.png)

### The Ultimate AI-Powered Pet Health Companion

Odin Tracker is a professional-grade, privacy-first pet health management dashboard. It combines cutting-edge AI extraction for lab reports with a robust, personal data-sovereignty model.

---

## ✨ Key Features

*   **🧠 Multi-Provider AI Extraction**: Upload lab reports (PDF/Photo) and let Gemini, Groq, or Claude automatically extract medical values (Creatinine, BUN, SDMA, etc.).
*   **🛡️ Privacy-First (BYOK)**: "Bring Your Own Key" model ensures your data never touches our servers. Your medical analysis happens via your own API keys.
*   **📂 Data Sovereignty**: Built on Firestore, allowing you to use your own personal database to protect your sensitive information.
*   **📈 Smart Trends**: Visualize your pet's health history with high-contrast, interactive charts.
*   **💊 Medication & Vaccine Alerts**: Never miss a dose with integrated scheduling and automated logging.
*   **📜 Professional Reports**: Generate and download comprehensive health summaries to share with your veterinarian.

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
