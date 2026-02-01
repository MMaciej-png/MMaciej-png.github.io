### 🔒 IndoTrainer — Ruleset Konten JSON (v1.0 LOCKED + Project Overrides)

Dokumen ini adalah **aturan tunggal** yang harus dipakai setiap kali membuat, mengedit, atau mengecek `data/NewContent.json`.

---

### 1) Otoritas & Prioritas

- **Prompt “MASTER JSON CONTENT PROMPT (v1.0 LOCKED)” menang atas semua kebiasaan/insting.**
- Jika ada konflik antara “benar secara tata bahasa” vs “alami dipakai orang Indonesia”, pilih yang **paling alami**.

---

### 2) Tujuan Website (Non-Negotiable)

- Website ini **bukan** untuk mengajar dari nol.
- Tujuan:
  - **Reinforcement** materi yang sudah dipelajari
  - Melatih intuisi & recall
  - Paparan cara orang Indonesia **benar-benar bicara**
  - Mendukung percakapan nyata
- **✅ Reinforcement only**
- **❌ No teaching**
- **❌ No explanations**

---

### 3) Filosofi Bahasa (Urutan Prioritas)

Urutan prioritas:

1. **Natural** (yang orang Indonesia alami ucapkan)
2. **Common** (yang sering terdengar & dipahami)
3. **Acceptable** (masih masuk secara grammar)
4. **Formal correctness** (benar formal)

Aturan:

- **Benar tapi tidak natural → perbaiki atau hapus**
- **Formal tapi jarang dipakai → batasi ke register formal**
- **Valid tapi tidak dipakai → exclude**

---

### 4) Register: Informal / Neutral / Formal (Strict Intent)

#### 🟢 Informal

- Bahasa lisan, santai, sehari-hari
- Chat dengan teman/pasangan
- Boleh slang & kontraksi
- Contoh (tidak lengkap): `gue`, `lo`, `nggak`, `udah`, `gimana`

#### 🔵 Neutral (paling penting)

- Default yang orang Indonesia pakai di banyak situasi
- Tidak kaku, tidak “slang-heavy”
- Harus terdengar normal kalau diucapkan
- **Neutral bukan “setengah formal”. Neutral = default natural speech.**

#### 🟣 Formal

- Situasi sopan/resmi, dipakai dengan sengaja
- Tetap harus terdengar seperti orang Indonesia beneran
- **Formal ≠ unnatural**
- **Formal ≠ overcorrected**
- **Jangan akademik / textbook-heavy**

---

### 5) Aturan Variants & Pronoun (CRITICAL)

#### Multi-form itu valid

Contoh:

- `aku` / `saya`
- `kamu` / `Anda`
- `gue` / `aku`
- `nggak` / `tidak`

Rules:

- **Jangan memaksa satu opsi “paling benar”.**
- **Jangan menghapus alternatif yang valid.**
- Pilih bentuk yang **natural** untuk register & konteks.

#### Catatan spesifik (dari prompt locked)

- `aku` → neutral & informal (emosional, natural)
- `saya` → neutral & formal (lebih sopan/berjarak)
- Keduanya valid.

#### Normalization awareness (engine-level)

Anggap sistem:

- Bisa menormalisasi makna yang setara (mis. `aku`/`saya`) untuk SR/points
- Unifikasi terjadi di engine, **bukan di konten**

Karena itu:

- Konten **jangan** dipaksa merge atau menghindari variants
- Bentuk permukaan harus tetap autentik & beragam

---

### 6) JSON Structure (LOCKED)

**Struktur harus persis seperti ini (tanpa kunci tambahan):**

```json
{
  "MODULE NAME": {
    "neutral": { "words": [], "sentences": [] },
    "informal": { "words": [], "sentences": [] },
    "formal": { "words": [], "sentences": [] }
  }
}
```

Rules:

- Semua 3 kategori **harus ada**
- Array boleh kosong
- **Missing keys tidak boleh**
- **Tidak boleh extra metadata**
- **Tidak boleh reordering** (jangan rewrite seluruh file hanya untuk format)

---

### 7) Word Objects (Rules)

Format:

```json
{ "indo": "kata", "english": "arti" }
```

Rules:

- **Satu bentuk Indonesia per object** (kecuali pola variant yang memang dipakai di repo, lihat “Project Overrides”)
- English harus:
  - **Pendek**
  - **Praktis**
  - **Meaning-based**
- Bentuk spoken harus diberi label jelas: `"(spoken)"`, `"(casual)"`, dll.
- **❌ Tidak ada penjelasan grammar**
- Words boleh muncul di banyak modul (reinforcement memang repetisi)

---

### 8) Sentence Objects (Rules)

Format:

```json
{ "indo": "kalimat", "english": "meaning" }
```

Rules:

- Urutan kata Indonesia harus yang **native-preferred**
- Jika ada beberapa pilihan, pilih yang **paling dipakai orang Indonesia**
- English menerjemahkan **makna**, bukan struktur
- Kalimat harus:
  - **Pendek**
  - **Realistic**
  - **Reusable**
- **❌ No teaching sentences**
- **❌ No grammar-demo constructions**
- Jika terdengar seperti dibuat “untuk mengajar”, itu salah

---

### 9) Spoken Reality Rules

- Spoken Indonesian valid & dianjurkan
- **Jangan “membetulkan”** bentuk spoken jadi textbook
- **Jangan over-formalize neutral**
- **Jangan menghindari kontraksi** hanya demi “rapi”
- Kalau orang Indonesia bilang begitu — **masuk**

---

### 10) What NOT To Do (Absolute ❌)

- ❌ Grammar explanations
- ❌ Pronunciation guides
- ❌ Affix explanations di konten
- ❌ Comments / metadata
- ❌ Kaku / textbook Indonesian
- ❌ Kalimat demo-learner
- ❌ Forced uniformity

---

### 11) Learner Context (Assumed)

- Sudah tahu grammar dasar
- Belajar lewat repetisi & exposure
- Mau intuisi, bukan rules
- Mau terdengar natural, bukan akademik

---

### 12) FINAL Validation Check (dari prompt locked)

Sebelum output JSON:

- ✔ Struktur exact
- ✔ Variants dihormati
- ✔ Indo natural saat diucapkan
- ✔ English natural
- ✔ Tidak ada yang “mengajar”
- ✔ Tidak ada yang “benar tapi aneh”

---

### 13) Project Overrides (IndoTrainer2.1 — rules tambahan yang kita pakai di repo ini)

Bagian ini adalah **aturan tambahan** yang sudah kamu minta selama pengerjaan repo ini (dipakai saat audit/repair).

#### 13.1 Neutral harus universal (override)

- **Neutral dipakai sebagai “universal bucket”.**
- Untuk konsistensi filter & equivalence, di repo ini:
  - **Kalimat/word yang memakai `saya` atau `aku` tidak boleh di `neutral`**
  - `saya` → taruh di `formal`
  - `aku` → taruh di `informal`
- Kalau makna yang sama sudah ada di register yang tepat, **hapus dari neutral**.
- Kalau kalimatnya benar-benar sama untuk formal & informal (tidak ada kata register-spesifik), simpan **hanya di neutral**.

#### 13.2 Equivalence antar register (formal ↔ informal)

- Jika sebuah kalimat memakai marker formal/informal (mis. `saya/Anda/apakah/mohon/dengan` vs `aku/kamu/nggak/udah/gimana`), maka makna itu **harus punya equivalent** di register pasangannya, kecuali:
  - Makna itu sudah ada di `neutral` dan versi register lain **tidak butuh kata khusus**
- Prinsip: **neutral cover meaning**, formal/informal hanya perlu tambahan bila memang ada kata yang mengunci register.

#### 13.3 “Words coverage” per modul (wajib saat check)

- **Setiap kata yang muncul di `sentences` sebuah modul harus ada sebagai `words` key di modul itu**, di register yang sesuai:
  - Muncul di formal saja → masuk `formal.words`
  - Muncul di informal saja → masuk `informal.words`
  - Muncul di neutral / atau muncul di formal & informal → masuk `neutral.words`
- Multi-word keys (mis. `Di sini`) dihitung sebagai 1 key dan **tidak perlu** memecah kata komponennya.
- Variant key pakai format repo (mis. `Paham / Ngerti`) harus dianggap mencakup kedua token saat audit.

#### 13.4 Diff hygiene (praktik edit)

- **Jangan reformat seluruh file** (minimize git diff noise).
- Lakukan perubahan **lokal** (patch kecil) sebisa mungkin.

---

### 14) Checklist Praktis Saat Aku “Clarity Check” / Audit

- **Valid JSON** (bisa diparse)
- **Struktur**: tiap modul punya `neutral/informal/formal` dan tiap register punya `words/sentences`
- **No teaching**: tidak ada kalimat yang terasa dibuat untuk mengajar rule
- **Register tepat**: slang ada di informal, resmi ada di formal, neutral tetap natural
- **Neutral universal (override repo)**: tidak ada `aku/saya` di neutral
- **Equivalence**: item register-spesifik punya pasangan makna (atau covered oleh neutral)
- **Words coverage**: semua token sentence tercakup oleh `words` key modul
- **English**: meaning-based, pendek, natural, tanpa catatan grammar

