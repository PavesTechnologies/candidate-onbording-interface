"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";
import { FormField, TextInput, SelectInput } from "@/app/components/onboarding/FormComponents";
import { Button } from "@/app/components/onboarding/ButtonComponents";
import { ErrorAlert } from "@/app/components/onboarding/AlertsComponents";
import { useFormValidation } from "@/app/hooks/useFormValidation";
import { useLocalStorageForm } from "../hooks/localStorage";

/* ===================== TYPES ===================== */

interface BankDetails {
  account_holder_name: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  confirm_account_number: string;
  ifsc_code: string;
  account_type: string;
}

interface PfDetails {
  pf_member: boolean;
  uan_number?: string;
}

interface BankPfStorage {
  bank: BankDetails;
  pf: PfDetails;

  // ✅ ONLY UUID BASED (LIKE EXPERIENCE PAGE)
  meta?: {
    bank_uuid?: string;
    pf_uuid?: string;
  };
}

/* ================= DEFAULTS ================= */

const defaultBank: BankDetails = {
  account_holder_name: "",
  bank_name: "",
  branch_name: "",
  account_number: "",
  confirm_account_number: "",
  ifsc_code: "",
  account_type: ""
};

const defaultPf: PfDetails = {
  pf_member: false,
  uan_number: ""
};

/* ================= VALIDATION ================= */

const bankValidationRules = {
  account_holder_name: [
    { validate: (v: unknown) => !!String(v || "").trim(), errorMessage: "Account holder name is required" }
  ],
  bank_name: [
    { validate: (v: unknown) => !!String(v || "").trim(), errorMessage: "Bank name is required" }
  ],
  account_number: [
    { validate: (v: unknown) => !!String(v || "").trim(), errorMessage: "Account number is required" }
  ],
  confirm_account_number: [
    { validate: (v: unknown) => !!String(v || "").trim(), errorMessage: "Confirm account number is required" }
  ],
  ifsc_code: [
    { validate: (v: unknown) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(v || "")), errorMessage: "Invalid IFSC Code" }
  ],
  account_type: [
    { validate: (v: unknown) => !!String(v || ""), errorMessage: "Account type is required" }
  ]
};

export default function BankPfDetailsPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});

  const { setLoading: setGlobalLoading } = useGlobalLoading();

  const [formData, setFormData] = useLocalStorageForm<BankPfStorage>(
    `bank-pf-details-${token}`,
    { bank: defaultBank, pf: defaultPf }
  );

  const bankDetails = useMemo(() => formData?.bank || defaultBank, [formData]);
  const pfDetails = useMemo(() => formData?.pf || defaultPf, [formData]);

  const meta = formData?.meta || {}; // ✅ UUID STORAGE

  const { fieldErrors, validateAllFields, handleFieldChange } = useFormValidation();

  /* ================= SNAPSHOT ================= */

  const snapshotDoneRef = useRef(false);
  const [originalData, setOriginalData] = useState<BankPfStorage | null>(null);

  useEffect(() => {
    if (!token) return;
    if (snapshotDoneRef.current) return;

    if (formData?.bank.account_number || formData?.pf.uan_number) {
      snapshotDoneRef.current = true;
      setOriginalData(JSON.parse(JSON.stringify(formData)));
    }
  }, [token, formData]);

  /* ================= CHANGE DETECTION ================= */

  const hasChanges = () => {
    if (!originalData) return true;

    return (
      originalData.bank.account_holder_name !== bankDetails.account_holder_name ||
      originalData.bank.bank_name !== bankDetails.bank_name ||
      originalData.bank.branch_name !== bankDetails.branch_name ||
      originalData.bank.account_number !== bankDetails.account_number ||
      originalData.bank.ifsc_code !== bankDetails.ifsc_code ||
      originalData.bank.account_type !== bankDetails.account_type ||
      originalData.pf.pf_member !== pfDetails.pf_member ||
      (originalData.pf.uan_number || "") !== (pfDetails.uan_number || "")
    );
  };

  /* ================= SAVE ================= */

  const handleSaveAndContinue = async () => {
    if (loading) return;

    const isValid = validateAllFields({ ...bankDetails }, bankValidationRules);
    if (!isValid) return;

    const newErrors: Record<string, string> = {};

    if (bankDetails.account_number !== bankDetails.confirm_account_number) {
      newErrors.confirm_account_number = "Account numbers do not match";
    }

    if (pfDetails.pf_member && !/^\d{12}$/.test(pfDetails.uan_number || "")) {
      newErrors.uan_number = "UAN must be a 12 digit number";
    }

    if (Object.keys(newErrors).length > 0) {
      setCustomErrors(newErrors);
      toast.error("Please fix errors");
      return;
    }

    setLoading(true);
    setGlobalLoading(true);

    try {
      const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`);

      if (!tokenRes.ok) {
        toast.error("Session expired");
        return;
      }

      const user_uuid: string = await tokenRes.json();

      if (!hasChanges()) {
        toast("No changes detected", { icon: "ℹ️" });
        router.push(`/onboarding/${token}/preview-page`);
        return;
      }

      /* ================= BANK ================= */

      const bankPayload = {
        user_uuid,
        account_holder_name: bankDetails.account_holder_name,
        bank_name: bankDetails.bank_name,
        branch_name: bankDetails.branch_name,
        account_number: bankDetails.account_number,
        ifsc_code: bankDetails.ifsc_code,
        account_type: bankDetails.account_type
      };

      const bankEndpoint = meta.bank_uuid
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/bank/${meta.bank_uuid}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/bank`;

      const bankMethod = meta.bank_uuid ? "PUT" : "POST";

      const bankRes = await fetch(bankEndpoint, {
        method: bankMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankPayload)
      });

      if (!bankRes.ok) throw new Error("Bank API failed");

      const bankData = await bankRes.json();

      if (!meta.bank_uuid) {
        setFormData(prev => ({
          ...prev,
          meta: {
            ...prev?.meta,
            bank_uuid: bankData.bank_uuid
          }
        }));
      }

      /* ================= PF ================= */

      const pfPayload = {
        user_uuid,
        pf_member: pfDetails.pf_member,
        uan_number: pfDetails.pf_member ? pfDetails.uan_number : null
      };

      const pfEndpoint = meta.pf_uuid
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/pf/${meta.pf_uuid}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/pf`;

      const pfMethod = meta.pf_uuid ? "PUT" : "POST";

      const pfRes = await fetch(pfEndpoint, {
        method: pfMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pfPayload)
      });

      if (!pfRes.ok) throw new Error("PF API failed");

      const pfData = await pfRes.json();

      if (!meta.pf_uuid) {
        setFormData(prev => ({
          ...prev,
          meta: {
            ...prev?.meta,
            pf_uuid: pfData.pf_uuid
          }
        }));
      }

      setOriginalData(JSON.parse(JSON.stringify(formData)));

      toast.success("Saved successfully");
      router.push(`/onboarding/${token}/preview-page`);

    } catch (err: unknown) {
      let message = "Failed to save";

      if (err instanceof Error) {
        message = err.message;
      }

      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <div className="py-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1e3a8a]">Bank & PF Details</h2>
            <p className="text-sm text-gray-500 mt-1">Please provide your salary account and PF registration info</p>
          </div>
          <div className="hidden sm:block">
            <span className="bg-blue-50 text-[#1e3a8a] text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
              Step 6 of 6
            </span>
          </div>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError("")} />}

        <div className="space-y-8">

          {/* ================= BANK DETAILS ================= */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <FormField label="Account Holder Name" required error={fieldErrors.account_holder_name}>
              <TextInput
                value={bankDetails.account_holder_name}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    bank: { ...prev.bank, account_holder_name: e.target.value }
                  }));
                  handleFieldChange("account_holder_name", e.target.value, bankValidationRules.account_holder_name);
                }}
              />
            </FormField>

            <FormField label="Bank Name" required error={fieldErrors.bank_name}>
              <TextInput
                value={bankDetails.bank_name}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    bank: { ...prev.bank, bank_name: e.target.value }
                  }));
                  handleFieldChange("bank_name", e.target.value, bankValidationRules.bank_name);
                }}
              />
            </FormField>

            <FormField label="Branch Name">
              <TextInput
                value={bankDetails.branch_name}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    bank: { ...prev.bank, branch_name: e.target.value }
                  }))
                }
              />
            </FormField>

            <FormField label="Account Number" required error={fieldErrors.account_number}>
              <TextInput
                value={bankDetails.account_number}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    bank: { ...prev.bank, account_number: e.target.value }
                  }));
                  handleFieldChange("account_number", e.target.value, bankValidationRules.account_number);
                }}
              />
            </FormField>

            <FormField label="Confirm Account Number" required error={customErrors.confirm_account_number}>
              <TextInput
                value={bankDetails.confirm_account_number}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    bank: { ...prev.bank, confirm_account_number: e.target.value }
                  }))
                }
              />
            </FormField>

            <FormField label="IFSC Code" required error={fieldErrors.ifsc_code}>
              <TextInput
                maxLength={11}
                value={bankDetails.ifsc_code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setFormData(prev => ({
                    ...prev,
                    bank: { ...prev.bank, ifsc_code: val }
                  }));
                  handleFieldChange("ifsc_code", val, bankValidationRules.ifsc_code);
                }}
              />
            </FormField>

            <FormField label="Account Type" required error={fieldErrors.account_type}>
              <SelectInput
                value={bankDetails.account_type}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    bank: { ...prev.bank, account_type: e.target.value }
                  }));
                  handleFieldChange("account_type", e.target.value, bankValidationRules.account_type);
                }}
              >
                {/* <option value="">Select</option> */}
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
              </SelectInput>
            </FormField>

          </div>

          {/* ================= PF DETAILS ================= */}

          <div className="mt-10 border-t border-indigo-100 pt-6">

            <h3 className="text-xl font-bold text-indigo-900 mb-4">
              Provident Fund (PF) Eligibility
            </h3>

            <div className="flex gap-6 mb-6">

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={pfDetails.pf_member === true}
                  onChange={() =>
                    setFormData(prev => ({
                      ...prev,
                      pf: { ...prev.pf, pf_member: true }
                    }))
                  }
                />
                Yes
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={pfDetails.pf_member === false}
                  onChange={() =>
                    setFormData(prev => ({
                      ...prev,
                      pf: { pf_member: false, uan_number: "" }
                    }))
                  }
                />
                No
              </label>

            </div>

            {pfDetails.pf_member && (
              <FormField label="UAN Number" required error={customErrors.uan_number}>
                <TextInput
                  placeholder="Enter 12 digit UAN"
                  value={pfDetails.uan_number}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      pf: { ...prev.pf, uan_number: e.target.value }
                    }))
                  }
                />
              </FormField>
            )}

          </div>

          {/* ================= BUTTONS ================= */}

          <div className="flex justify-between items-center pt-8 border-t border-indigo-100">

            <Button
              variant="secondary"
              onClick={() => {
                if (!!searchParams.get("edit")) {
                  router.push(`/onboarding/${token}/preview-page`);
                } else {
                  router.push(`/onboarding/${token}/experience-details`);
                }
              }}
            >
              Back
            </Button>

            <Button
              variant="primary"
              onClick={handleSaveAndContinue}
              loading={loading}
              disabled={loading}
            >
              Save & Continue
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
}
 