# 🏥 My Secretary - Offline Clinic & Patient Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)]()
[![Electron](https://img.shields.io/badge/Electron-33.0.0-47848F?logo=electron&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)]()
[![Offline First](https://img.shields.io/badge/Offline-100%25%20LAN%20Sync-orange.svg)]()

> **A secure, 100% offline-first desktop application for doctors, dentists, and clinic receptionists. Features multi-role workflows, real-time LAN synchronization over clinic Wi-Fi without internet, medical imagery, prescription management, and full Arabic/English/Kurdish support.**

---

## 🌟 Key Highlights

- 🔒 **100% Offline & Private**: Zero external cloud dependency. All patient data, medical histories, and X-rays remain strictly on your local clinic devices.
- 🔄 **Real-Time LAN Synchronization**: Connect the Doctor's PC and the Secretary's desk over the clinic's local Wi-Fi router. Automatic handshake and instant live sync without internet access.
- 👥 **Dual-Role Workflows**:
  - **Doctor Station**: Full diagnosis, clinical notes, treatment plans, prescriptions, dental/medical charts, X-ray uploads, and operations scheduling.
  - **Secretary Station**: Patient intake, queue management, contact info, visits logs, and payment processing.
- 💊 **Prescriptions & Drug Registry**: Built-in pharmaceutical dictionary with trade names, scientific names, dosage forms (tablets, syrups, injections, etc.), dosages, and custom instructions.
- 📷 **Medical Image Storage**: Attach and inspect X-rays, MRI scans, CT scans, and lab results directly within patient records.
- 🌍 **Multilingual & RTL Support**: Native support for **English**, **العربية (Arabic with complete RTL layout)**, and **کوردی (Kurdish)**.
- 🖥️ **Cross-Platform Desktop (.exe / .dmg / .AppImage)**: Packaged with Electron into portable and NSIS installer executables for Windows, macOS, and Linux.

---

## 📋 Features Overview

| Feature | Description |
| :--- | :--- |
| **Patient Directory** | Instant search, filtering by ID/name/phone, demographic records, and payment history. |
| **Consultation & History** | Chronological logs of visits, diagnoses, symptoms, treatments, procedures, and fees. |
| **Operations Scheduler** | Track upcoming, in-progress, and completed surgical/clinical procedures with doctor notes. |
| **Drug Database** | Fast drug lookup with dosage forms, strength suggestions, and custom clinic inventory. |
| **Local Network Sync** | Host a sync server on the primary clinic PC; client stations connect via local IP/mDNS. |
| **Report Generation** | Printable clinical summaries, consultation receipts, and patient history sheets. |
| **Theme Customization** | High-contrast Light Mode and Dark Mode for low-light consultation rooms. |

---

## 🛠️ Technology Stack

- **Desktop Framework**: [Electron 33](https://www.electronjs.org/) + `electron-builder`
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & UI**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Local Server & Database**: Express.js + WebSockets (`ws`) + SQLite
- **Network Engine**: LAN WebSocket protocol with auto-reconnect and conflict resolution

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- `npm` or `yarn`

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/my-secretary.git
cd my-secretary
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run in Development Mode

```bash
# Starts both the local clinic server and Vite dev frontend
npm run dev
```

To run with the Electron desktop shell:

```bash
npm run electron:dev
```

---

## 📦 Building Desktop Executables (.exe / Installers)

To compile and package the application into standalone desktop binaries:

```bash
# Build Windows installer (NSIS) and Portable .exe
npm run electron:build
```

The resulting executables will be generated in the `release/` directory:
- `release/My Secretary Setup 1.0.0.exe` (Standard Windows installer with desktop shortcut)
- `release/My Secretary 1.0.0.exe` (Portable zero-install executable for USB drives)

To package for all supported platforms (Windows, macOS, Linux):
```bash
npm run electron:build:all
```

---

## 🌐 Setting Up Local Network (LAN) Sync

No internet connection or cloud service is required:

1. **Host Machine (e.g., Doctor's PC)**:
   - Go to **Offline Sync** from the navigation bar.
   - Select **Host Mode (Server)** and start the sync server.
   - Note the displayed Local IP address (e.g., `192.168.1.15`).

2. **Client Machine (e.g., Secretary's Desk)**:
   - Ensure both computers are connected to the same clinic Wi-Fi or Ethernet switch.
   - Open **Offline Sync** and select **Client Mode**.
   - Enter the Host's IP address (or click Scan / Discover).
   - Press **Connect**; records will synchronize in real time as patients are added or edited.

---

## 📁 Project Structure

```text
├── electron/              # Electron main process, window creation, background server launcher
│   └── main.cjs
├── src/
│   ├── components/        # UI views (Dashboard, Patients, History, Drugs, Sync, Operations)
│   ├── db/                # Local database adapter & SQLite storage layer
│   ├── services/          # SyncClient, WebSocket protocol, and offline storage service
│   ├── types.ts           # TypeScript interfaces (Patient, Drug, History, Notes)
│   ├── translations.ts    # Multilingual strings (English, Arabic, Kurdish)
│   └── App.tsx            # Main application router and state container
├── server.ts              # Local Express + WebSocket sync hub
├── vite.config.ts         # Vite bundler configuration
└── package.json           # Scripts and build configuration for electron-builder
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
