# Page Override: Mohon (Permohonan Baru)

> Inherits from `MASTER.md`. Only deviations and composition below.

**Pattern:** iOS Settings-style grouped form + optional multi-step.
**Inspiration:** Apple Reminders new-reminder sheet — focused, no distractions.

## Layout

- `max-w-2xl mx-auto px-4 py-4 pb-24`.
- Sections grouped with `title-3` section headers + flat list of inputs (no card wrappers around each field).
- Divider between sections: 24px vertical gap + `border-t border-slate-200`.

## Composition

1. **Top bar** — back chevron left, "Permohonan Baru" center `title-3`, "Simpan Draf" right link.
2. **Section 1 — Maklumat Aset** (Asset info)
   - Nama Aset (text)
   - Jenis Aset (select — PC/Printer/Monitor/Lain-lain)
   - No. Siri / Tag (text, tabular)
   - Tahun Perolehan (year picker)
3. **Section 2 — Sebab Pelupusan** (Reason)
   - Kaedah Pelupusan (select — Hapus Kira / Jual / Pindahkan / Musnah) ← **new field per PRD gap**
   - Sebab (textarea, 120px min)
4. **Section 3 — Lampiran** (Attachments)
   - Photo upload (camera or file, max 5, thumbnails below).
   - Dropzone: `border-dashed border-slate-300 rounded-lg p-6`. Tap opens native picker.
5. **Submit bar** — Fixed bottom, safe-area padded, two buttons:
   - "Simpan Draf" (`btn-secondary`, 50% width)
   - "Hantar" (`btn-primary`, 50% width)

## Interaction

- **Auto-save draft** every 10s silently (Apple HIG `form-autosave`).
- Validation: on blur per field, `aria-live` error below.
- Photo upload: preview with delete X overlay. Tap preview = lightbox.
- On "Hantar": confirm modal — "Hantar permohonan untuk semakan?" with Batal / Hantar.
- Unsaved dismissal: if user taps back with unsaved fields, confirm modal.

## Specific overrides

- Input height 56px on mobile (not 48) — extra breathing room for tired ward staff. iOS mail-compose pattern.
- File size: warn > 5MB, block > 10MB with clear error.
- Photo EXIF stripped client-side before upload (privacy).
- Required fields marked with red asterisk `title-3` weight.

## Dark mode

- Section dividers: `border-slate-800`.
- Dropzone: `border-slate-700 bg-slate-900`.
- Camera icon in dropzone: `slate-400`.
