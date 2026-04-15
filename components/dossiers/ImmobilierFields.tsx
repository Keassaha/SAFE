"use client";

import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Home, Calendar, MapPin, Building2 } from "lucide-react";

interface ImmobilierFieldsProps {
  sousType?: string | null;
  closingDate?: string | null;
  propertyAddress?: string | null;
  condoPINParking?: string | null;
  condoPINLocker?: string | null;
  isEdit?: boolean;
}

const SOUS_TYPES = [
  { value: "achat", label: "Purchase" },
  { value: "vente", label: "Sale" },
  { value: "condo", label: "Condo" },
  { value: "hypotheque", label: "Refinance / Mortgage" },
];

export function ImmobilierFields({
  sousType,
  closingDate,
  propertyAddress,
  condoPINParking,
  condoPINLocker,
  isEdit = false,
}: ImmobilierFieldsProps) {
  const isCondo = sousType === "condo";

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-blue-700">
          <Home className="w-4 h-4" />
          <h4 className="text-sm font-semibold">Real Estate — Transaction Details</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
              Transaction Type <span className="text-status-error">*</span>
            </label>
            <select
              name="sousType"
              defaultValue={sousType ?? "achat"}
              className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none"
            >
              {SOUS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Input
              label="Closing Date"
              name="closingDate"
              type="date"
              defaultValue={closingDate ?? ""}
            />
            <Calendar className="w-4 h-4 text-blue-500 ml-2 mb-3 shrink-0" />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Property Address"
              name="propertyAddress"
              defaultValue={propertyAddress ?? ""}
              placeholder="123 Main St, Toronto, ON M5V 1A1"
            />
          </div>
          <MapPin className="w-4 h-4 text-blue-500 mb-3 shrink-0" />
        </div>

        {/* Condo-specific fields (D5) */}
        {(isCondo || isEdit) && (
          <div className={`space-y-4 ${isCondo ? "" : "hidden"}`} id="condo-fields">
            <div className="flex items-center gap-2 text-blue-600 pt-2 border-t border-blue-200">
              <Building2 className="w-4 h-4" />
              <h5 className="text-sm font-medium">Condo-Specific</h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Parking PIN"
                name="condoPINParking"
                defaultValue={condoPINParking ?? ""}
                placeholder="e.g. Level P2, #45"
              />
              <Input
                label="Locker PIN"
                name="condoPINLocker"
                defaultValue={condoPINLocker ?? ""}
                placeholder="e.g. Level 1, #12"
              />
            </div>
            <p className="text-xs text-blue-600">
              Verify PIN numbers match APS and condo plan. LAWPRO reports PIN mismatches as a recurring error.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
