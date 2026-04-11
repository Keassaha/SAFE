"use client";

import { T } from "@/lib/onboarding/translations";
import { PROVINCES } from "@/lib/onboarding/taxes";
import type { StepProps } from "@/lib/onboarding/types";

export default function Step1FirmInfo({ data, setData, lang, errors }: StepProps) {
  const label = (key: Parameters<typeof T>[0]) => T(key, lang);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[var(--safe-darkest)] mb-6">
        {label("step1Title")}
      </h2>

      {/* Nom du cabinet */}
      <Field label={label("firmName")} error={errors.firmName} required>
        <input
          type="text"
          value={data.firmName}
          onChange={(e) => setData({ firmName: e.target.value })}
          className={inputClass(errors.firmName)}
        />
      </Field>

      {/* Nom avocat principal */}
      <Field label={label("leadName")} error={errors.leadName} required>
        <input
          type="text"
          value={data.leadName}
          onChange={(e) => setData({ leadName: e.target.value })}
          className={inputClass(errors.leadName)}
        />
      </Field>

      {/* Courriel */}
      <Field label={label("email")} error={errors.email} required>
        <input
          type="email"
          value={data.email}
          onChange={(e) => setData({ email: e.target.value })}
          className={inputClass(errors.email)}
        />
      </Field>

      {/* Numéro Barreau */}
      <Field label={label("barNumber")} error={errors.barNumber} required>
        <input
          type="text"
          value={data.barNumber}
          onChange={(e) => setData({ barNumber: e.target.value })}
          className={inputClass(errors.barNumber)}
        />
      </Field>

      {/* Province */}
      <Field label={label("province")} error={errors.province} required>
        <select
          value={data.province}
          onChange={(e) => setData({ province: e.target.value })}
          className={inputClass(errors.province)}
        >
          <option value="">{lang === "fr" ? "Sélectionnez..." : "Select..."}</option>
          {PROVINCES.map((p) => (
            <option key={p.code} value={p.code}>
              {p[lang]}
            </option>
          ))}
        </select>
      </Field>

      {/* Adresse */}
      <Field label={label("address")} error={errors.address} required>
        <input
          type="text"
          value={data.address}
          onChange={(e) => setData({ address: e.target.value })}
          className={inputClass(errors.address)}
        />
      </Field>

      {/* Téléphone */}
      <Field label={label("phone")} error={errors.phone} required>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => setData({ phone: e.target.value })}
          className={inputClass(errors.phone)}
        />
      </Field>

      {/* Site web */}
      <Field label={`${label("website")} ${label("optional")}`}>
        <input
          type="url"
          value={data.website}
          onChange={(e) => setData({ website: e.target.value })}
          className={inputClass()}
          placeholder="https://"
        />
      </Field>

      {/* Couleurs */}
      <Field label={`${label("firmColors")} ${label("optional")}`}>
        <input
          type="text"
          value={data.firmColors}
          onChange={(e) => setData({ firmColors: e.target.value })}
          className={inputClass()}
          placeholder={T("firmColorsPlaceholder", lang)}
        />
      </Field>
    </div>
  );
}

/* ── Sous-composants réutilisables ── */

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function inputClass(error?: string) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm bg-white
    transition-colors duration-200 outline-none
    ${
      error
        ? "border-red-400 focus:ring-2 focus:ring-red-200"
        : "border-[var(--safe-neutral-border)] focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
    }`;
}
