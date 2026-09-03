# eDM Helper - Daftar Tools dan Fungsi

## Overview
eDM Helper adalah kumpulan tools berguna untuk email marketing dan produktivitas sehari-hari. Semua tools gratis dan mudah digunakan.

---

## 📚 Daftar Tools

### 1. **Bookmarklet** 
- **File:** `bookmarklet.html`
- **Icon:** 📖
- **Fungsi:** Browser tools untuk aksi cepat dan shortcut
- **Fitur:**
  - Drag-and-drop bookmarklets untuk produktivitas instan
  - Tools yang dapat digunakan langsung di browser
  - Tidak perlu instalasi tambahan

### 2. **Campaign Counter**
- **File:** `campaign-counter.html`
- **Icon:** 📈
- **Fungsi:** Mengelola nomor Campaign ID dari export Monday secara lokal
- **Fitur:**
  - Import XLSX langsung di browser
  - Mode Merge / Replace untuk data XLSX
  - Ringkasan campaign, ID unik, reblast, dan baris gagal
  - Tab Regular hingga 9000 Series
  - Detail nama campaign, tanggal blast, dan reblast dengan popup klik
  - Export JSON sebagai backup lokal
  - Penyimpanan IndexedDB lokal dan Reset Local Data
  - Bookmarklet Monday memiliki database lokal terpisah

### 3. **Config eDM**
- **File:** `config.html`
- **Icon:** ⚙️
- **Fungsi:** Konfigurasi dan manage email marketing settings
- **Fitur:**
  - Advanced options
  - Template configuration
  - SMTP settings
  - Custom parameters

### 4. **WFH Tracker**
- **File:** `wfh-tracker.html`
- **Icon:** 📅
- **Fungsi:** Track dan manage work from home days
- **Fitur:**
  - Calendar integration
  - Daily logging
  - Summary reports
  - Export timesheet

### 5. **Layout Checker**
- **File:** `layout-checker.html`
- **Icon:** 📏
- **Fungsi:** Cek kompatibilitas layout email
- **Fitur:**
  - Cross-email client testing
  - Device compatibility check
  - Responsive design testing
  - Screenshot comparison

---

## 🛠️ Fitur Utama Platform

### Performance Optimized
- Flat design untuk performa optimal di laptop kentang
- Tidak ada animasi berat
- CSS minimalis dan efisien

### Design System
- Warna tema: Merah (#F18C8E) dan Putih
- Flat design yang clean dan modern
- Responsive untuk semua device

### Accessibility
- Semua tools memiliki proper ARIA labels
- Keyboard navigation support
- Screen reader friendly

---

## 📁 Struktur File

```
Beta/
├── index.html                 # Homepage
├── bookmarklet.html          # Bookmarklet tool
├── campaign-counter.html     # Campaign counter
├── config.html               # eDM configuration
├── wfh-tracker.html          # WFH tracker
├── layout-checker.html       # Layout tester
├── css/                      # Stylesheets
│   ├── base.css             # Base styles
│   ├── layout.css           # Layout components
│   ├── theme.css            # Color scheme
│   ├── pages-index.css      # Homepage styles
│   └── components/          # Component styles
├── js/                       # JavaScript files
│   ├── nav.js              # Navigation
│   ├── pages-index.js      # Homepage logic
│   └── [tool-specific].js  # Individual tool scripts
└── example of database/      # Sample database files
```

---

## 🔧 Teknologi yang Digunakan

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Icons:** Font Awesome 6.5.2
- **Design:** Custom CSS dengan flat design principle
- **Performance:** Optimized untuk low-spec devices

---

## 💡 Tips Penggunaan

1. **Bookmarklet** - Drag bookmarklet ke browser toolbar untuk akses cepat
2. **Campaign Counter** - Import XLSX Monday untuk melihat nomor terpakai dan next ID
4. **Layout Checker** - Test di berbagai email client untuk memastikan compatibility

---

## 🚀 Cara Menggunakan

1. Buka `index.html` di browser
2. Klik tool yang diinginkan
3. Follow instruksi di setiap halaman
4. Semua data tersimpan locally (tidak ada server)

---

## 📝 Catatan

- Semua tools berjalan client-side (tidak perlu internet)
- Data aman karena tidak terupload ke server
- Dapat digunakan offline setelah di-download
- Free forever, no hidden costs

---

*Last Updated: 2025*
