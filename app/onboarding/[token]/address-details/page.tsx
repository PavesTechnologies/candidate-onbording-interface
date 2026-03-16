"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocalStorageForm } from "../hooks/localStorage";
import toast from "react-hot-toast";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";
import { FormField, TextInput, SelectInput } from "@/app/components/onboarding/FormComponents";
import { Button } from "@/app/components/onboarding/ButtonComponents";
import { ErrorAlert } from "@/app/components/onboarding/AlertsComponents";
import { validations, errorMessages } from "@/app/utils/validations";

/* ===================== TYPES ===================== */

interface Country {
  country_uuid: string;
  country_name: string;
  is_active: boolean;
}

interface AddressForm {
  address_type: "permanent" | "current";
  address_line1: string;
  address_line2: string;
  city: string;
  district_or_ward: string;
  state_or_region: string;
  postal_code: string;
  country_uuid: string;
}

interface AddressDraft {
  permanent: AddressForm;
  current: AddressForm;
}

/* ===================== CONSTANT ===================== */

const emptyPermanentAddress: AddressForm = {
  address_type: "permanent",
  address_line1: "",
  address_line2: "",
  city: "",
  district_or_ward: "",
  state_or_region: "",
  postal_code: "",
  country_uuid: "",
};

const emptyTemporaryAddress: AddressForm = {
  address_type: "current",
  address_line1: "",
  address_line2: "",
  city: "",
  district_or_ward: "",
  state_or_region: "",
  postal_code: "",
  country_uuid: "",
};

/* ===================== COMPONENT ===================== */

export default function AddressDetailsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLoading: setGlobalLoading } = useGlobalLoading();
  const [countries, setCountries] = useState<Country[]>([]);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const [userUuid, setUserUuid] = useState<string | null>(null);

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, Record<string, string>>>({
    permanent: {},
    current: {},
  });

  const [draft, setDraft] = useLocalStorageForm<AddressDraft>(
    `address-details-${token}`,
    {
      permanent: emptyPermanentAddress,
      current: emptyTemporaryAddress,
    }
  );

  const permanent = draft?.permanent ?? emptyPermanentAddress;
  const current = draft?.current ?? emptyTemporaryAddress;

  const [originalDraft, setOriginalDraft] = useState<AddressDraft | null>(null);
  const [permanentUuid, setPermanentUuid] = useState<string | null>(null);
  const [temporaryUuid, setTemporaryUuid] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  function isEqual(a: AddressForm, b: AddressForm) {
    return (
      a.address_line1 === b.address_line1 &&
      a.address_line2 === b.address_line2 &&
      a.city === b.city &&
      a.district_or_ward === b.district_or_ward &&
      a.state_or_region === b.state_or_region &&
      a.postal_code === b.postal_code &&
      a.country_uuid === b.country_uuid
    );
  }
  function isDraftSame(original: AddressDraft | null, current: AddressDraft) {
    if (!original) return false;

    return (
      isEqual(original.permanent, current.permanent) &&
      isEqual(original.current, current.current)
    );
  }
  /* ----------- VALIDATION ----------- */
  const validateField = (fieldName: keyof AddressForm, value: string): string => {
    switch (fieldName) {
      case "address_line1":
      case "address_line2":
        if (!value.trim()) return errorMessages.REQUIRED;
        if (!validations.minLength(value, 3)) return errorMessages.MIN_LENGTH(3);
        return "";

      case "city":
      case "district_or_ward":
      case "state_or_region":
        if (!value.trim()) return errorMessages.REQUIRED;
        if (!validations.isValidName(value)) return "Must contain only letters";
        return "";

      case "postal_code":
        if (!value.trim()) return errorMessages.REQUIRED;
        if (!validations.isValidPincode(value)) return "Must be exactly 6 digits";
        return "";

      case "country_uuid":
        if (!value) return errorMessages.REQUIRED;
        return "";

      default:
        return "";
    }
  };

  const validateAddressSection = (type: "permanent" | "current"): boolean => {
    const address = type === "permanent" ? permanent : current;
    const newErrors: Record<string, string> = {};

    (Object.keys(address) as Array<keyof AddressForm>).forEach((key) => {
      if (key === "address_type") return;
      const error = validateField(key, address[key]);
      if (error) newErrors[key] = error;
    });

    setFieldErrors((prev) => ({
      ...prev,
      [type]: newErrors,
    }));

    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- FETCH COUNTRIES ---------------- */

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) => setCountries(data.filter((c) => c.is_active)))
      .catch(() => setError("Failed to load countries"));
  }, []);

  useEffect(() => {
    if (!token || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`)
      .then((res) => res.json())
      .then((uuid: string) => setUserUuid(uuid))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const perm = localStorage.getItem(`address-uuid-permanent-${token}`);
    const temp = localStorage.getItem(`address-uuid-temporary-${token}`);
    if (perm) setPermanentUuid(perm);
    if (temp) setTemporaryUuid(temp);
    
    const storedSnapshot = localStorage.getItem(`address-snapshot-${token}`);
    if (storedSnapshot) {
      try {
        setOriginalDraft(JSON.parse(storedSnapshot) as AddressDraft);
      } catch {}
    }
  }, [token]);

  /* ---------------- HANDLERS ---------------- */

  const handlePermanentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof AddressForm;

    setDraft((prev) => {
      const updatedPermanent: AddressForm = {
        ...prev.permanent,
        [fieldName]: value,
      };

      return {
        permanent: updatedPermanent,
        current: sameAsPermanent
          ? { ...updatedPermanent, address_type: "current" }
          : prev.current,
      };
    });

    if (fieldErrors.permanent[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        permanent: { ...prev.permanent, [name]: "" },
      }));
    }
    if (sameAsPermanent && fieldErrors.current[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        current: { ...prev.current, [name]: "" },
      }));
    }
  };

  const handleTemporaryChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setDraft((prev) => ({
      ...prev,
      current: { ...prev.current, [name]: value },
    }));

    if (fieldErrors.current[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        current: { ...prev.current, [name]: "" },
      }));
    }
  };

  const handleSameAsPermanent = (checked: boolean) => {
    setSameAsPermanent(checked);
    setDraft((prev) => ({
      ...prev,
      current: checked ? { ...prev.permanent, address_type: "current" } : prev.current,
    }));
    if (checked) {
      setFieldErrors((prev) => ({ ...prev, current: {} }));
    }
  };

  const handleContinue = async () => {
    if (isSubmittingRef.current) return;
    const isEditMode = !!searchParams.get("edit");

    const currentDraft: AddressDraft = {
      permanent,
      current: sameAsPermanent
        ? { ...permanent, address_type: "current" }
        : current,
    };

    if (isDraftSame(originalDraft, currentDraft)) {

      toast("No changes detected", { icon: "ℹ️" });

      if (isEditMode) {
        router.push(`/onboarding/${token}/preview-page`);
      } else {
        router.push(`/onboarding/${token}/identity-documents`);
      }

      return;
    }

    const isPermValid = validateAddressSection("permanent");
    const isCurrValid = sameAsPermanent || validateAddressSection("current");

    if (!isPermValid || !isCurrValid) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    isSubmittingRef.current = true;
    setError("");
    setLoading(true);
    setGlobalLoading(true);

    try {
      if (!userUuid) throw new Error("User UUID not found");

      const saveAddress = async (
        currentAddr: AddressForm,
        originalAddr: AddressForm | null,
        address_uuid: string | null,
        setUuid: (id: string) => void
      ) => {
        const payload = {
          user_uuid: userUuid,
          address_type: currentAddr.address_type,
          address_line1: currentAddr.address_line1,
          address_line2: currentAddr.address_line2,
          city: currentAddr.city,
          district_or_ward: currentAddr.district_or_ward,
          state_or_region: currentAddr.state_or_region,
          country_uuid: currentAddr.country_uuid,
          postal_code: currentAddr.postal_code,
        };

        if (address_uuid && originalAddr && isEqual(originalAddr, currentAddr)) return;

        if (address_uuid) {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-details/address/${address_uuid}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          if (!res.ok) throw new Error();
          toast.success(`${currentAddr.address_type} address updated`);
        } else {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/address`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          if (!res.ok) throw new Error();
          const data = await res.json();
          const newUuid = data.address_uuid;
          setUuid(newUuid);
          localStorage.setItem(`address-uuid-${currentAddr.address_type}-${token}`, newUuid);
          toast.success(`${currentAddr.address_type} address saved`);
        }
      };

      const tasks = [];
      tasks.push(saveAddress(permanent, originalDraft?.permanent || null, permanentUuid, setPermanentUuid));
      
      const currentToSave = sameAsPermanent ? { ...permanent, address_type: "current" as const } : current;
      tasks.push(saveAddress(currentToSave, originalDraft?.current || null, temporaryUuid, setTemporaryUuid));

      await Promise.all(tasks);

      const snapshot: AddressDraft = {
        permanent: { ...permanent },
        current: { ...currentToSave },
      };
      setOriginalDraft(snapshot);
      localStorage.setItem(`address-snapshot-${token}`, JSON.stringify(snapshot));
      
      if (!!searchParams.get("edit")) {
        router.push(`/onboarding/${token}/preview-page`);
      } else {
        router.push(`/onboarding/${token}/identity-documents`);
      }
    } catch {
      toast.error("Failed to save address details");
      setError("Failed to save address details");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-5xl rounded-2xl bg-white/95 backdrop-blur-lg p-8 shadow-xl border border-indigo-100">
        <h2 className="mb-6 text-3xl font-bold text-indigo-900">Address Details</h2>

        {error && <ErrorAlert message={error} onClose={() => setError("")} />}

        <div className="space-y-8">
          {/* Permanent Address Section */}
          <section>
            <h3 className="mb-4 text-xl font-semibold text-indigo-900 flex items-center gap-2">
              🏠 Permanent Address
            </h3>
            <AddressFormUI
              data={permanent}
              onChange={handlePermanentChange}
              countries={countries}
              errors={fieldErrors.permanent}
            />
          </section>

          {/* Same as Permanent Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <input
              type="checkbox"
              id="sameAsPermanent"
              className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
              checked={sameAsPermanent}
              onChange={(e) => handleSameAsPermanent(e.target.checked)}
            />
            <label htmlFor="sameAsPermanent" className="text-indigo-900 font-medium cursor-pointer">
              Current Address is same as Permanent Address
            </label>
          </div>

          {/* Current Address Section */}
          {!sameAsPermanent && (
            <section className="pt-4 border-t border-indigo-100">
              <h3 className="mb-4 text-xl font-semibold text-indigo-900 flex items-center gap-2">
                📍 Current Address
              </h3>
              <AddressFormUI
                data={current}
                onChange={handleTemporaryChange}
                countries={countries}
                errors={fieldErrors.current}
              />
            </section>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-indigo-100">
            <Button
              variant="secondary"
              onClick={() => {
                if (!!searchParams.get("edit")) {
                  router.push(`/onboarding/${token}/preview-page`);
                } else {
                  router.push(`/onboarding/${token}/personal-details`);
                }
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleContinue}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== FORM UI COMPONENT ===================== */

function AddressFormUI({
  data,
  onChange,
  countries,
  errors,
}: {
  data: AddressForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  countries: Country[];
  errors: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Address Line 1" required error={errors.address_line1} className="md:col-span-2">
        <TextInput
          name="address_line1"
          value={data.address_line1}
          onChange={onChange}
          placeholder="House / Flat No., Building Name, Street Name"
          error={errors.address_line1 ? "true" : ""}
        />
      </FormField>

      <FormField label="Address Line 2" required error={errors.address_line2} className="md:col-span-2">
        <TextInput
          name="address_line2"
          value={data.address_line2}
          onChange={onChange}
          placeholder="Area / Locality / Landmark"
          error={errors.address_line2 ? "true" : ""}
        />
      </FormField>

      <FormField label="City" required error={errors.city}>
        <TextInput
          name="city"
          value={data.city}
          onChange={onChange}
          placeholder="City / Town"
          error={errors.city ? "true" : ""}
        />
      </FormField>

      <FormField label="District / Ward" required error={errors.district_or_ward}>
        <TextInput
          name="district_or_ward"
          value={data.district_or_ward}
          onChange={onChange}
          placeholder="District"
          error={errors.district_or_ward ? "true" : ""}
        />
      </FormField>

      <FormField label="State / Region" required error={errors.state_or_region}>
        <TextInput
          name="state_or_region"
          value={data.state_or_region}
          onChange={onChange}
          placeholder="State"
          error={errors.state_or_region ? "true" : ""}
        />
      </FormField>

      <FormField label="Postal Code" required error={errors.postal_code}>
        <TextInput
          name="postal_code"
          value={data.postal_code}
          onChange={(e) => {
            if (/^\d{0,6}$/.test(e.target.value)) onChange(e);
          }}
          placeholder="6-digit PIN code"
          maxLength={6}
          error={errors.postal_code ? "true" : ""}
        />
      </FormField>

      <FormField label="Country" required error={errors.country_uuid} className="md:col-span-2">
        <SelectInput
          name="country_uuid"
          value={data.country_uuid}
          onChange={onChange}
          placeholder="Select Country"
          error={errors.country_uuid ? "true" : ""}
        >
          {countries.map((c) => (
            <option key={c.country_uuid} value={c.country_uuid}>
              {c.country_name}
            </option>
          ))}
        </SelectInput>
      </FormField>
    </div>
  );
}
