# Requirements Document

## Introduction

TITAN X-Ray adalah landing page (Next.js + Tailwind v4) untuk wallet health scanner. Saat ini pengguna menilai tampilan kartu/box terlihat datar ("jelek") dan kesan keseluruhan kurang kuat ("kurang powerful"). Fitur ini merancang ulang sisi visual landing page agar terasa premium dan berdampak tinggi — terutama komponen kartu/box (Feature cards, How It Works steps, Hero panel + address input, FAQ items), kedalaman (depth), hierarki visual, spasi, dan daya tarik ("wow factor") — sambil mempertahankan brand keamanan bertema gelap, warna aksen teal, serta stack Tailwind/Next.js yang ada.

Lingkup pekerjaan ini hanya pada penyajian visual (presentational): struktur token desain di `globals.css` dan styling komponen landing (`HeroSection`, `FeaturesSection`, `HowItWorksSection`, `FAQSection`, `Navbar`, `Footer`). Logika aplikasi, alur scan (detecting/selecting/scanning/results), pemanggilan API, dan kontrak data TIDAK berubah perilakunya.

## Glossary

- **XRay_Landing_Page**: Halaman utama (view `home`) yang menampung Hero, Features, How It Works, dan FAQ, beserta Navbar dan Footer.
- **Design_Token_System**: Kumpulan CSS custom properties di `globals.css` (mis. `--xray-surface`, `--xray-border`, `--xray-shadow-md`, `--xray-glow`) dan utility class (`.text-gradient-accent`, `.xray-glass`) yang mendefinisikan warna, bayangan, gradien, dan efek.
- **Feature_Card**: Kartu individual pada `FeaturesSection` yang menampilkan ikon, judul, dan deskripsi sebuah fitur.
- **Step_Card**: Kartu langkah pada `HowItWorksSection` yang menampilkan nomor urut, ikon, judul, dan deskripsi.
- **Hero_Panel**: Blok atas `XRay_Landing_Page` berisi badge status, headline, subheadline, address input, baris trust, dan baris statistik.
- **Address_Input**: Komponen form input alamat wallet beserta tombol "Detect" pada `Hero_Panel`.
- **FAQ_Item**: Baris accordion pada `FAQSection` yang berisi pertanyaan dan jawaban yang dapat dibuka/tutup.
- **Navigation_Bar**: Bar navigasi tetap (fixed) di bagian atas (`Navbar`).
- **Footer_Section**: Bagian kaki halaman (`Footer`).
- **Theme_System**: Mekanisme tema terang/gelap/sistem yang menukar nilai token desain melalui atribut `data-theme`.
- **Accent_Color**: Warna brand utama teal `#4ECDC4` (`--xray-accent`) beserta turunannya.
- **Reduced_Motion_Preference**: Preferensi sistem pengguna `prefers-reduced-motion: reduce`.
- **Interactive_Card**: Istilah kolektif untuk `Feature_Card`, `Step_Card`, dan `FAQ_Item` yang merespons hover/focus.
- **Contrast_Ratio**: Rasio kontras warna teks terhadap latar menurut perhitungan WCAG 2.1.

## Requirements

### Requirement 1: Sistem Token Visual yang Diperkaya (Depth & Elevation)

**User Story:** Sebagai pengunjung, saya ingin elemen-elemen di halaman terasa berdimensi dan berlapis, sehingga halaman terlihat premium dan tidak datar.

#### Acceptance Criteria

1. THE Design_Token_System SHALL mendefinisikan minimal tiga tingkat elevation bayangan yang berbeda secara visual (setara peran `sm`, `md`, `lg`) untuk Theme_System terang dan gelap.
2. THE Design_Token_System SHALL menyediakan token gradien permukaan kartu (card surface gradient) yang berbeda dari warna latar halaman (`--xray-bg`) pada Theme_System gelap.
3. THE Design_Token_System SHALL menyediakan token efek glow Accent_Color minimal dua intensitas (lemah dan kuat) untuk digunakan pada elemen yang ditonjolkan.
4. WHERE Theme_System dalam mode gelap, THE Design_Token_System SHALL menggunakan nilai bayangan dengan opacity yang menghasilkan Contrast_Ratio tepi kartu terhadap latar minimal terlihat (bayangan tidak hilang sepenuhnya).
5. THE Design_Token_System SHALL mempertahankan seluruh nama token yang sudah dipakai komponen (mis. `--xray-surface`, `--xray-border`, `--xray-text`, `--xray-subtext`, `--xray-accent`) tanpa menghapusnya.

### Requirement 2: Redesign Feature_Card

**User Story:** Sebagai pengunjung, saya ingin kartu fitur terlihat menonjol dan menarik, sehingga saya tertarik membaca keunggulan produk.

#### Acceptance Criteria

1. THE Feature_Card SHALL menampilkan latar permukaan (`--xray-surface` atau gradien permukaan), border, dan bayangan elevation sehingga terlihat terangkat dari latar halaman.
2. WHEN kursor melakukan hover di atas Feature_Card, THE Feature_Card SHALL menampilkan perubahan visual yang terlihat (mis. peningkatan elevation, intensitas border Accent_Color, atau translasi vertikal) dalam transisi berdurasi antara 150ms dan 400ms.
3. THE Feature_Card SHALL menampilkan kontainer ikon dengan latar turunan Accent_Color dan ikon berwarna Accent_Color.
4. THE Feature_Card SHALL menjaga Contrast_Ratio teks judul terhadap latar kartu minimal 4.5:1 dan teks deskripsi minimal 4.5:1 pada Theme_System terang dan gelap.
5. THE Feature_Card SHALL menggunakan radius sudut, padding, dan spasi internal yang konsisten dengan Step_Card dan FAQ_Item.
6. WHEN halaman dimuat dan Feature_Card masuk ke viewport, THE Feature_Card SHALL tampil dengan animasi masuk bertahap (staggered) antar kartu.

### Requirement 3: Redesign Step_Card (How It Works)

**User Story:** Sebagai pengunjung, saya ingin langkah-langkah penggunaan terlihat jelas dan berurutan, sehingga saya cepat memahami cara kerja produk.

#### Acceptance Criteria

1. THE Step_Card SHALL menampilkan nomor urut langkah, ikon, judul, dan deskripsi.
2. THE Step_Card SHALL menampilkan latar permukaan, border, dan bayangan elevation yang konsisten dengan Feature_Card.
3. WHERE lebar viewport memenuhi breakpoint desktop (≥ 1024px), THE HowItWorksSection SHALL menampilkan indikator urutan antar Step_Card (mis. konektor) yang menyiratkan progres dari langkah pertama ke terakhir.
4. WHEN kursor melakukan hover di atas Step_Card, THE Step_Card SHALL menampilkan perubahan visual yang terlihat dalam transisi berdurasi antara 150ms dan 400ms.
5. THE Step_Card SHALL menjaga Contrast_Ratio teks judul dan deskripsi terhadap latar kartu minimal 4.5:1 pada Theme_System terang dan gelap.

### Requirement 4: Redesign Hero_Panel

**User Story:** Sebagai pengunjung, saya ingin bagian atas halaman langsung memberi kesan kuat dan profesional, sehingga saya percaya pada produk dalam beberapa detik pertama.

#### Acceptance Criteria

1. THE Hero_Panel SHALL menampilkan headline utama menggunakan penekanan Accent_Color (`.text-gradient-accent`) pada frasa kunci.
2. THE Hero_Panel SHALL menampilkan elemen latar dekoratif (mis. radial glow Accent_Color dan/atau pola grid halus) yang tidak menghalangi keterbacaan teks.
3. THE Hero_Panel SHALL mempertahankan badge status, subheadline, baris trust, dan baris statistik yang ada saat ini.
4. THE Hero_Panel SHALL menjaga Contrast_Ratio teks headline dan subheadline terhadap latar minimal 4.5:1 pada Theme_System terang dan gelap.
5. WHEN halaman dimuat, THE Hero_Panel SHALL menampilkan animasi masuk berurutan pada headline, subheadline, Address_Input, baris trust, dan baris statistik.

### Requirement 5: Redesign Address_Input

**User Story:** Sebagai pengunjung, saya ingin kolom input alamat terlihat sebagai aksi utama yang jelas, sehingga saya tahu apa yang harus dilakukan pertama kali.

#### Acceptance Criteria

1. THE Address_Input SHALL menampilkan ikon pencarian, kolom teks monospace, dan tombol "Detect" dalam satu kontainer yang menonjol.
2. WHILE kolom input menerima fokus keyboard, THE Address_Input SHALL menampilkan indikator fokus yang terlihat menggunakan Accent_Color (mis. border atau glow).
3. THE Address_Input SHALL memanggil callback `onScan` dengan nilai alamat yang sudah di-trim WHEN form dikirim dengan kolom input berisi teks bukan-kosong, tanpa perubahan perilaku dari implementasi saat ini.
4. IF kolom input kosong atau hanya berisi spasi, THEN THE tombol "Detect" SHALL berada dalam keadaan dinonaktifkan (disabled) dan tampak nonaktif secara visual.
5. THE Address_Input SHALL menjaga Contrast_Ratio teks placeholder dan teks input terhadap latar input minimal 4.5:1 pada Theme_System terang dan gelap.

### Requirement 6: Redesign FAQ_Item

**User Story:** Sebagai pengunjung, saya ingin daftar FAQ terlihat rapi dan mudah dipindai, sehingga saya cepat menemukan jawaban.

#### Acceptance Criteria

1. THE FAQ_Item SHALL menampilkan pertanyaan dan ikon indikator buka/tutup pada baris yang dapat diklik.
2. WHEN sebuah FAQ_Item diklik dalam keadaan tertutup, THE FAQSection SHALL membuka FAQ_Item tersebut dan menampilkan jawabannya dengan transisi yang halus.
3. WHEN sebuah FAQ_Item diklik dalam keadaan terbuka, THE FAQSection SHALL menutup FAQ_Item tersebut.
4. WHILE sebuah FAQ_Item terbuka, THE FAQ_Item SHALL menampilkan elevation atau border yang berbeda dari keadaan tertutup untuk menandai status aktif.
5. THE FAQ_Item SHALL menjaga Contrast_Ratio teks pertanyaan dan jawaban terhadap latar minimal 4.5:1 pada Theme_System terang dan gelap.

### Requirement 7: Konsistensi Navigation_Bar dan Footer_Section

**User Story:** Sebagai pengunjung, saya ingin navigasi dan footer terasa selaras dengan tampilan baru, sehingga halaman terasa utuh dari atas ke bawah.

#### Acceptance Criteria

1. THE Navigation_Bar SHALL mempertahankan efek glass (`.xray-glass`) dan tetap dalam posisi fixed di bagian atas viewport.
2. THE Navigation_Bar SHALL menampilkan logo, tautan navigasi (Features, How It Works, FAQ), pemilih Theme_System, dan tombol CTA TitanWallet.
3. WHEN lebar viewport berada di bawah breakpoint desktop, THE Navigation_Bar SHALL menampilkan tombol menu mobile yang membuka panel navigasi.
4. THE Footer_Section SHALL menampilkan blok brand, kolom tautan, dan baris hak cipta dengan spasi dan pemisah yang konsisten dengan gaya visual baru.
5. THE Navigation_Bar dan THE Footer_Section SHALL menjaga Contrast_Ratio seluruh teks dan tautan minimal 4.5:1 pada Theme_System terang dan gelap.

### Requirement 8: Hierarki Visual, Spasi, dan Tipografi

**User Story:** Sebagai pengunjung, saya ingin halaman memiliki ritme dan keterbacaan yang baik, sehingga terasa profesional dan tidak berantakan.

#### Acceptance Criteria

1. THE XRay_Landing_Page SHALL menerapkan skala spasi vertikal antar-section yang konsisten antara Hero, Features, How It Works, dan FAQ.
2. THE XRay_Landing_Page SHALL menampilkan setiap section heading dengan badge label, judul, dan (jika ada) subjudul dalam pola yang konsisten.
3. THE XRay_Landing_Page SHALL membatasi lebar konten teks pada kontainer max-width terpusat agar baris teks tetap nyaman dibaca.
4. THE XRay_Landing_Page SHALL menerapkan hierarki ukuran font yang jelas antara headline section, judul kartu, dan teks isi.

### Requirement 9: Konsistensi Theme_System (Terang & Gelap)

**User Story:** Sebagai pengunjung, saya ingin tampilan tetap rapi baik di mode terang maupun gelap, sehingga saya bisa memakai preferensi tema saya.

#### Acceptance Criteria

1. WHEN pengguna memilih mode terang, THE XRay_Landing_Page SHALL merender seluruh komponen menggunakan nilai token Theme_System terang.
2. WHEN pengguna memilih mode gelap, THE XRay_Landing_Page SHALL merender seluruh komponen menggunakan nilai token Theme_System gelap.
3. WHEN pengguna memilih mode sistem, THE XRay_Landing_Page SHALL mengikuti preferensi `prefers-color-scheme` perangkat.
4. THE XRay_Landing_Page SHALL menjaga seluruh kartu, input, dan teks tetap memenuhi syarat Contrast_Ratio minimal 4.5:1 pada kedua mode.
5. WHEN Theme_System berubah, THE XRay_Landing_Page SHALL menerapkan perubahan warna tanpa memuat ulang halaman.

### Requirement 10: Responsivitas Lintas Perangkat

**User Story:** Sebagai pengunjung di ponsel maupun desktop, saya ingin tata letak menyesuaikan layar saya, sehingga tampilan tetap rapi di perangkat apa pun.

#### Acceptance Criteria

1. WHERE lebar viewport memenuhi breakpoint desktop (≥ 1024px), THE FeaturesSection SHALL menampilkan Feature_Card dalam grid tiga kolom.
2. WHERE lebar viewport berada pada rentang tablet (≥ 640px dan < 1024px), THE FeaturesSection SHALL menampilkan Feature_Card dalam grid dua kolom.
3. WHERE lebar viewport berada di bawah breakpoint tablet (< 640px), THE FeaturesSection SHALL menampilkan Feature_Card dalam grid satu kolom.
4. WHERE lebar viewport berada di bawah breakpoint tablet (< 640px), THE Address_Input SHALL tetap dapat digunakan dengan tombol "Detect" yang dapat ditekan tanpa terpotong.
5. THE XRay_Landing_Page SHALL menghindari overflow horizontal pada lebar viewport antara 320px dan 1920px.

### Requirement 11: Micro-interaction dan Aksesibilitas Gerak

**User Story:** Sebagai pengunjung, saya ingin animasi terasa halus namun tidak mengganggu, sehingga halaman terasa hidup tanpa membuat pusing.

#### Acceptance Criteria

1. THE Interactive_Card SHALL menampilkan transisi hover/focus menggunakan properti yang murah secara performa (transform dan opacity) jika memungkinkan.
2. WHILE Reduced_Motion_Preference aktif, THE XRay_Landing_Page SHALL mengurangi atau menonaktifkan animasi non-esensial (mis. animasi masuk, float, pulse).
3. WHEN sebuah elemen interaktif menerima fokus keyboard, THE XRay_Landing_Page SHALL menampilkan indikator fokus yang terlihat (focus-visible) menggunakan Accent_Color.
4. THE XRay_Landing_Page SHALL membatasi durasi animasi masuk setiap elemen maksimal 800ms agar konten tidak terasa lambat tampil.

### Requirement 12: Preservasi Fungsi dan Stack

**User Story:** Sebagai pemilik produk, saya ingin redesign tidak merusak fungsi yang sudah ada, sehingga scanner tetap bekerja seperti sebelumnya.

#### Acceptance Criteria

1. THE XRay_Landing_Page SHALL mempertahankan alur transisi view `home → detecting → selecting → scanning → results` tanpa perubahan perilaku.
2. THE XRay_Landing_Page SHALL mempertahankan seluruh id elemen fungsional yang ada (mis. `wallet-address-input`, `scan-button`, `nav-cta`, `theme-toggle`, `faq-{i}`).
3. THE XRay_Landing_Page SHALL tetap dibangun di atas Next.js dan Tailwind v4 tanpa menambah framework UI baru.
4. THE Accent_Color SHALL tetap berupa teal `#4ECDC4` sebagai warna brand utama setelah redesign.
5. WHEN proyek dibangun (build) setelah redesign, THE XRay_Landing_Page SHALL terkompilasi tanpa error.
