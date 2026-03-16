"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";
import { FormField, TextInput, SelectInput } from "@/app/components/onboarding/FormComponents";
import { Button } from "@/app/components/onboarding/ButtonComponents";
import { ErrorAlert } from "@/app/components/onboarding/AlertsComponents";
import { useFormValidation } from "@/app/hooks/useFormValidation";

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

interface ExistingBank {
  bank_uuid: string;
  user_uuid: string;
  account_holder_name: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
}

interface ExistingPf {
  pf_uuid: string;
  user_uuid: string;
  pf_member: boolean;
  uan_number?: string;
}

/* ================= VALIDATION RULES ================= */

const bankValidationRules = {
  account_holder_name: [
    { validate: (v: unknown) => !!String(v || "").trim(), errorMessage: "Account holder name is required" }
  ],
  bank_name: [
    { validate: (v: unknown) => !!String(v || "").trim(), errorMessage: "Bank name is required" }
  ],
  branch_name: [
    { validate: (v: unknown) => !!String(v || "").trim(), errorMessage: "Branch name is required" }
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

  const { setLoading: setGlobalLoading } = useGlobalLoading();

  const [existingBank, setExistingBank] = useState<ExistingBank | null>(null);
  const [existingPf, setExistingPf] = useState<ExistingPf | null>(null);

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    account_holder_name: "",
    bank_name: "",
    branch_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    account_type: ""
  });

  const [pfDetails, setPfDetails] = useState<PfDetails>({
    pf_member: false,
    uan_number: ""
  });

  const {
    fieldErrors,
    handleFieldChange,
    validateAllFields
  } = useFormValidation();

  const [userUuid, setUserUuid] = useState<string | null>(null);

  /* ================= LOAD EXISTING BANK + PF ================= */

  useEffect(() => {

    if (!token) return;

    const loadData = async () => {

      try {

        /* STEP 1 — Verify token only once */

        const tokenRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
        );


        if (!tokenRes.ok) {
          // setDataLoaded(true);
          return;
        }

        const uuid: string = await tokenRes.json();
        setUserUuid(uuid);

        /* STEP 2 — Load Bank & PF in parallel (FAST) */

        const [bankRes, pfRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bank/user/${uuid}`),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pf/user/${uuid}`)
        ]);
        /* BANK DATA */
        if (bankRes.ok) {
          const bankData: ExistingBank = await bankRes.json();
          setExistingBank(bankData);
          setBankDetails({
            account_holder_name: bankData.account_holder_name || "",
            bank_name: bankData.bank_name || "",
            branch_name: bankData.branch_name || "",
            account_number: bankData.account_number || "",
            confirm_account_number: bankData.account_number || "",
            ifsc_code: bankData.ifsc_code || "",
            account_type: bankData.account_type || ""
          });
        }
        /* PF DATA */
        if (pfRes.ok) {
          const pfData: ExistingPf = await pfRes.json();
          setExistingPf(pfData);
          setPfDetails({
            pf_member: pfData.pf_member,
            uan_number: pfData.uan_number || ""
          });
        }
      } catch (err) {
        console.log("No bank/pf data found");
      } 
    };
    loadData();
  }, [token]);

  /* ================= CHANGE DETECTION ================= */

  const bankChanged = () => {

    if (!existingBank) return true;

    return (
      existingBank.account_holder_name !== bankDetails.account_holder_name ||
      existingBank.bank_name !== bankDetails.bank_name ||
      existingBank.branch_name !== bankDetails.branch_name ||
      existingBank.account_number !== bankDetails.account_number ||
      existingBank.ifsc_code !== bankDetails.ifsc_code ||
      existingBank.account_type !== bankDetails.account_type
    );
  };

  const pfChanged = () => {
    if (!existingPf) return true;
    return (
      existingPf.pf_member !== pfDetails.pf_member ||
      (existingPf.uan_number || "") !== (pfDetails.uan_number || "")
    );
  };

  /* ================= SAVE ================= */

  const handleSaveAndContinue = async () => {
    if (loading) return;
    const isValid = validateAllFields(
      { ...bankDetails },
      bankValidationRules
    );
    if (!isValid) return;
    if (bankDetails.account_number !== bankDetails.confirm_account_number) {
      toast.error("Account numbers do not match");
      return;
    }
    if (pfDetails.pf_member && !/^\d{12}$/.test(pfDetails.uan_number || "")) {
      toast.error("UAN must be a 12 digit number");
      return;
    }
    setLoading(true);
    setGlobalLoading(true);
    try {
      // const tokenRes = await fetch(
      //   `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
      // );
      // const user_uuid: string = await tokenRes.json();
      const user_uuid = userUuid;
      if (!user_uuid) {
        toast.error("User not found");
        return;
      }
      if (!bankChanged() && !pfChanged()) {
        toast("No changes detected",{ icon: "ℹ️" });
        router.push(`/onboarding/${token}/preview-page`);
        return;
      }

      /* ================= BANK ================= */

      if (!existingBank) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bank`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_uuid,
            account_holder_name: bankDetails.account_holder_name,
            bank_name: bankDetails.bank_name,
            branch_name: bankDetails.branch_name,
            account_number: bankDetails.account_number,
            ifsc_code: bankDetails.ifsc_code,
            account_type: bankDetails.account_type
          })
        });

        const data = await res.json();
        setExistingBank({ bank_uuid: data.bank_uuid, user_uuid, ...bankDetails });

      } else if (bankChanged()) {

        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bank/${existingBank.bank_uuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_uuid,
            account_holder_name: bankDetails.account_holder_name,
            bank_name: bankDetails.bank_name,
            branch_name: bankDetails.branch_name,
            account_number: bankDetails.account_number,
            ifsc_code: bankDetails.ifsc_code,
            account_type: bankDetails.account_type
          })
        });

      }

      /* ================= PF ================= */

      if (pfDetails.pf_member) {

        if (!existingPf) {

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_uuid,
              pf_member: true,
              uan_number: pfDetails.uan_number
            })
          });

          const data = await res.json();
          setExistingPf({ pf_uuid: data.pf_uuid, user_uuid, pf_member: true, uan_number: pfDetails.uan_number });

        } else if (pfChanged()) {

          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pf/${existingPf.pf_uuid}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_uuid,
              pf_member: true,
              uan_number: pfDetails.uan_number
            })
          });

        } else if (existingPf) {

          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pf/${existingPf.pf_uuid}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_uuid,
              pf_member: false,
              uan_number: null
            })
          });
        }

      }

      toast.success("Bank & PF details processed successfully");

      router.push(`/onboarding/${token}/preview-page`);

    } catch (err) {

      toast.error("Failed to save bank & PF details");
      setError("An error occurred while saving bank or PF details.");

    } finally {

      setLoading(false);
      setGlobalLoading(false);

    }

  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8 px-4">

      <div className="relative mx-auto max-w-5xl rounded-2xl bg-white/95 backdrop-blur-lg p-8 shadow-xl border border-indigo-100">

        <h2 className="mb-6 text-3xl font-bold text-indigo-900">
          🏦 Bank & PF Details
        </h2>

        {error && <ErrorAlert message={error} onClose={() => setError("")} />}

        <div className="space-y-8">

          {/* BANK DETAILS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <FormField label="Account Holder Name" required error={fieldErrors.account_holder_name}>
              <TextInput
                value={bankDetails.account_holder_name}
                onChange={(e) => {
                  setBankDetails({ ...bankDetails, account_holder_name: e.target.value });
                  handleFieldChange("account_holder_name", e.target.value, bankValidationRules.account_holder_name);
                }}
              />
            </FormField>

            <FormField label="Bank Name" required error={fieldErrors.bank_name}>
              <TextInput
                value={bankDetails.bank_name}
                onChange={(e) => {
                  setBankDetails({ ...bankDetails, bank_name: e.target.value });
                  handleFieldChange("bank_name", e.target.value, bankValidationRules.bank_name);
                }}
              />
            </FormField>

            <FormField label="Branch Name">
              <TextInput
                value={bankDetails.branch_name}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, branch_name: e.target.value })
                }
              />
            </FormField>

            <FormField label="Account Number" required error={fieldErrors.account_number}>
              <TextInput
                value={bankDetails.account_number}
                onChange={(e) => {
                  setBankDetails({ ...bankDetails, account_number: e.target.value });
                  handleFieldChange("account_number", e.target.value, bankValidationRules.account_number);
                }}
              />
            </FormField>

            <FormField label="Confirm Account Number" required>
              <TextInput
                value={bankDetails.confirm_account_number}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, confirm_account_number: e.target.value })
                }
              />
            </FormField>

            <FormField label="IFSC Code" required error={fieldErrors.ifsc_code}>
              <TextInput
                maxLength={11}
                value={bankDetails.ifsc_code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setBankDetails({ ...bankDetails, ifsc_code: val });
                  handleFieldChange("ifsc_code", val, bankValidationRules.ifsc_code);
                }}
              />
            </FormField>

            <FormField label="Account Type" required error={fieldErrors.account_type}>
              <SelectInput
                value={bankDetails.account_type}
                onChange={(e) => {
                  setBankDetails({ ...bankDetails, account_type: e.target.value });
                  handleFieldChange("account_type", e.target.value, bankValidationRules.account_type);
                }}
              >
                {/* <option value="">Select</option> */}
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
              </SelectInput>
            </FormField>

          </div>

          {/* PF DETAILS */}

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
                    setPfDetails({ ...pfDetails, pf_member: true })
                  }
                />
                Yes
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={pfDetails.pf_member === false}
                  onChange={() =>
                    setPfDetails({ pf_member: false, uan_number: "" })
                  }
                />
                No
              </label>

            </div>

            {pfDetails.pf_member && (
              <FormField label="UAN Number" required>
                <TextInput
                  placeholder="Enter 12 digit UAN"
                  value={pfDetails.uan_number}
                  onChange={(e) =>
                    setPfDetails({ ...pfDetails, uan_number: e.target.value })
                  }
                />
              </FormField>
            )}

          </div>

          {/* BUTTONS */}

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