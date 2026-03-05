# 📚 NotenPortal – Digitales Klassenbuch

Moderne Webanwendung zur digitalen Notenverwaltung für Lehrerinnen und Lehrer in **Österreich**, **Deutschland** und der **Schweiz**.

---

## 🚀 Schnellstart

### Voraussetzungen
- **Node.js** v18 oder höher → https://nodejs.org
- **npm** (wird mit Node.js mitgeliefert)

---

### 1. Backend starten

```bash
cd backend
npm install
npm run dev
```
Backend läuft dann auf: **http://localhost:3001**

---

### 2. Frontend starten (neues Terminal-Fenster)

```bash
cd frontend
npm install
npm run dev
```
Frontend läuft dann auf: **http://localhost:5173**

---

### 3. Browser öffnen

→ **http://localhost:5173**

---

## ✨ Features

| Feature | Beschreibung |
|---|---|
| 🔐 Login / Registrierung | Sichere JWT-Authentifizierung |
| 📋 Vorlagen | AT/DE/CH spezifische Notenvorlagen |
| ✏️ Editor | Interaktiver Noteneditor mit Auto-Save |
| 👥 Schüler verwalten | Hinzufügen, Bearbeiten, Löschen |
| 📚 Fächer verwalten | Hinzufügen, Bearbeiten, Löschen |
| 📥 CSV-Import | Schüler & Fächer aus .csv Dateien importieren |
| 📄 Notendruck (PDF) | Export als professionelles PDF |
| 🌙 Dark Mode | Helles und dunkles Design |
| 🌍 Mehrsprachig | Deutsch & Englisch |
| 💾 Auto-Save | Automatisches Speichern beim Bearbeiten |

---

## 📥 CSV-Import Format

### Schüler importieren (`schüler.csv`)
```
Mustermann;Max
Schmidt;Anna
Gruber;Felix
```
Format: `Nachname;Vorname` (Trennzeichen: `,` `;` `|` oder Tab)

### Fächer importieren (`fächer.csv`)
```
Informatik;INF
Mathematik;M
Englisch;E
```
Format: `Fachname;Kürzel`

---

## 🗂 Projektstruktur

```
notenportal/
├── backend/          # TypeScript Express Backend
│   ├── src/
│   │   ├── index.ts           # Server-Einstiegspunkt
│   │   ├── database.ts        # In-Memory Datenbank + Vorlagen
│   │   ├── types.ts           # TypeScript Types
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT Authentifizierung
│   │   └── routes/
│   │       ├── auth.ts        # Login/Register/Profil
│   │       └── tables.ts      # Notentabellen CRUD
│   └── package.json
│
└── frontend/         # React + Vite + TypeScript
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css          # Design System
    │   ├── types.ts
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── AuthPage.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Editor.tsx
    │   │   ├── TemplatesPage.tsx
    │   │   └── SettingsPage.tsx
    │   ├── components/
    │   │   └── Header.tsx
    │   └── utils/
    │       └── pdfExport.ts   # PDF-Export mit jsPDF
    └── package.json
```

---

## ⚠️ Hinweise

- Das Backend speichert Daten **im Arbeitsspeicher** (In-Memory). Beim Neustart des Backends gehen alle Daten verloren.
- Für Produktionseinsatz empfiehlt sich eine echte Datenbank (z.B. PostgreSQL, SQLite).
- Das JWT-Secret sollte in der Produktion als Umgebungsvariable gesetzt werden: `JWT_SECRET=dein-geheimes-secret`

---

## 🧑‍💻 Entwickelt mit
- **React 18** + **TypeScript** + **Vite**
- **Express.js** + **TypeScript**
- **jsPDF** + **jspdf-autotable** für PDF-Export
- **react-router-dom** für Navigation
- **react-hot-toast** für Benachrichtigungen
