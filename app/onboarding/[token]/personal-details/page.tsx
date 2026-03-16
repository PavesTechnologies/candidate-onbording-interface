"use client";

import React, { useEffect, useState, useRef } from "react";
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
  country_code: string;
  is_active: boolean;
}

interface OfferLetter {
  user_uuid: string;
  first_name: string;
  last_name: string;
  mail: string;
  country_code: string;
  contact_number: string;
}

interface PersonalForm {
  user_uuid?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;

  date_of_birth: string;
  gender: string;
  marital_status: string;
  blood_group: string;
  nationality_country_uuid: string;
  residence_country_uuid: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation_uuid: string;
 
}

interface Relation {
  relation_uuid: string;
  relation_name: string;
}

/* ===================== COMPONENT ===================== */

export default function PersonalDetailsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLoading: setGlobalLoading } = useGlobalLoading();

  const [countries, setCountries] = useState<Country[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [offer, setOffer] = useState<OfferLetter | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [personalUuid, setPersonalUuid] = useState<string | null>(null);
  const [originalPersonal, setOriginalPersonal] = useState<PersonalForm | null>(
    null
  );

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const hasLoadedRef = useRef(false);
  const isSubmittingRef = useRef(false);

  /* ---------------- FORM STATE ---------------- */

  const [formData, setFormData] = useLocalStorageForm<PersonalForm>(
    `personal-details-${token}`,
    {
      date_of_birth: "",
      gender: "",
      marital_status: "",
      blood_group: "",
      nationality_country_uuid: "",
      residence_country_uuid: "",
     emergency_contact_name: "",
emergency_contact_phone: "",
emergency_contact_relation_uuid: "",
    }
  );

  /* ---------------- FETCH COUNTRIES ---------------- */

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) => setCountries(data.filter((c) => c.is_active)))
      .catch(() => setError("Failed to load countries"));
  }, []);

  /* ---------------- FETCH RELATIONS ---------------- */

useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/relations`)
    .then((res) => res.json())
    .then((data: Relation[]) => setRelations(data))
    .catch(() => setError("Failed to load relations"));
}, []);

  /* ---------------- TOKEN → OFFER → PERSONAL ---------------- */

  useEffect(() => {
    if (!token || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        const tokenRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
        );
        if (!tokenRes.ok) return;

        const user_uuid: string = await tokenRes.json();

        const offerRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/offerletters/offer/${user_uuid}`
        );
        if (!offerRes.ok) return;

        const offerData = await offerRes.json();
        setOffer(offerData);

        setFormData((prev) => ({
          ...prev,
          user_uuid: offerData.user_uuid,
          first_name: offerData.first_name,
          last_name: offerData.last_name,
          email: offerData.mail,
          contact_number: offerData.contact_number,
        }));
      } catch {}
    };

    loadData();
  }, [token, setFormData]);

  useEffect(() => {
    if (!token) return;
    const storedUuid = localStorage.getItem(`personal-uuid-${token}`);
    if (storedUuid) {
      setPersonalUuid(storedUuid);
    }
    const storedSnapshot = localStorage.getItem(
      `personal-snapshot-${token}`
    );
    if (storedSnapshot) {
      try {
        setOriginalPersonal(JSON.parse(storedSnapshot) as PersonalForm);
      } catch {
        // ignore bad snapshot
      }
    }
  }, [token]);

  

  /* ---------------- HANDLERS ---------------- */

  /* ----------- VALIDATION ----------- */
  const validateField = (fieldName: string, value: unknown): string => {
    const valueStr = typeof value === "string" ? value : "";
    
    switch (fieldName) {
      case "date_of_birth":
        if (!valueStr) return errorMessages.REQUIRED;
        if (!validations.isValidDate(valueStr)) return errorMessages.INVALID_DATE;
        if (!validations.isValidDOB(valueStr)) return errorMessages.INVALID_DOB;
        if (!validations.isValidAge(valueStr, 18)) return errorMessages.INVALID_AGE(18);
        return "";

      case "gender":
      case "marital_status":
      case "blood_group":
      case "nationality_country_uuid":
      case "residence_country_uuid":
      case "emergency_contact_relation_uuid":
        if (!valueStr) return errorMessages.REQUIRED;
        return "";

      case "emergency_contact_name":
        if (!valueStr) return errorMessages.REQUIRED;
        if (!validations.minLength(valueStr, 2)) return errorMessages.MIN_LENGTH(2);
        if (!validations.maxLength(valueStr, 50)) return errorMessages.MAX_LENGTH(50);
        return "";

      case "emergency_contact_phone":
        if (!valueStr) return errorMessages.REQUIRED;
        if (!validations.isValidPhone(valueStr)) return errorMessages.INVALID_PHONE;
        return "";

      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ----------- HANDLE CHANGE ----------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field if user is typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, emergency_contact_phone: val }));
    if (fieldErrors.emergency_contact_phone) {
      setFieldErrors((prev) => ({
        ...prev,
        emergency_contact_phone: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form first
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    if (!offer) {
      toast.error("Offer details not loaded yet");
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setLoading(true);
    setGlobalLoading(true);
    setError("");
    console.log("Submitting payload:", formData);
console.log("personalUuid:", personalUuid);
    try {
      const payload = {
        user_uuid: offer.user_uuid,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        marital_status: formData.marital_status,
        blood_group: formData.blood_group,
        nationality_country_uuid: formData.nationality_country_uuid,
        residence_country_uuid: formData.residence_country_uuid,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relation_uuid: formData.emergency_contact_relation_uuid,
      };

      const isSame = (a: PersonalForm | null, b: Record<string, unknown>) => {
        if (!a) return false;
        return (
          (a.date_of_birth || "") === b.date_of_birth &&
          (a.gender || "") === b.gender &&
          (a.marital_status || "") === b.marital_status &&
          (a.blood_group || "") === b.blood_group &&
          (a.nationality_country_uuid || "") === b.nationality_country_uuid &&
          (a.residence_country_uuid || "") === b.residence_country_uuid &&
          (a.emergency_contact_name || "") === b.emergency_contact_name &&
          (a.emergency_contact_phone || "") === b.emergency_contact_phone &&
          (a.emergency_contact_relation_uuid || "") === b.emergency_contact_relation_uuid
        );
      };
      // no changes
      const isEditMode = !!searchParams.get("edit");
      if (personalUuid && isSame(originalPersonal, payload)) {
        toast(" No changes detected",{ icon: "ℹ️" });
        if (isEditMode) {
          router.push(`/onboarding/${token}/preview-page`);
        } else {
          router.push(`/onboarding/${token}/address-details`);
        }
        return;
      }
      // 🔵 FIRST TIME → POST
      if (!personalUuid) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/personal-details`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) throw new Error();

        const data = await res.json();

const uuid = data.personal_uuid;

setPersonalUuid(uuid);
localStorage.setItem(`personal-uuid-${token}`, uuid);

console.log("Saved personalUuid:", uuid);
        setOriginalPersonal({
          date_of_birth: payload.date_of_birth,
          gender: payload.gender,
          marital_status: payload.marital_status,
          blood_group: payload.blood_group,
          nationality_country_uuid: payload.nationality_country_uuid,
          residence_country_uuid: payload.residence_country_uuid,
          emergency_contact_name: payload.emergency_contact_name,
emergency_contact_phone: payload.emergency_contact_phone,
emergency_contact_relation_uuid: payload.emergency_contact_relation_uuid,
        });
        localStorage.setItem(
          `personal-snapshot-${token}`,
          JSON.stringify({
            date_of_birth: payload.date_of_birth,
            gender: payload.gender,
            marital_status: payload.marital_status,
            blood_group: payload.blood_group,
            nationality_country_uuid: payload.nationality_country_uuid,
            residence_country_uuid: payload.residence_country_uuid,
            emergency_contact_name: payload.emergency_contact_name,
emergency_contact_phone: payload.emergency_contact_phone,
emergency_contact_relation_uuid: payload.emergency_contact_relation_uuid,
          })
        );

       
        
        toast.success("Personal details saved successfully");
      }

      // 🔵 AFTER FIRST TIME → PUT
      else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-details/${personalUuid}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) throw new Error();

        setOriginalPersonal({
          date_of_birth: payload.date_of_birth,
          gender: payload.gender,
          marital_status: payload.marital_status,
          blood_group: payload.blood_group,
          nationality_country_uuid: payload.nationality_country_uuid,
          residence_country_uuid: payload.residence_country_uuid,
          emergency_contact_name: payload.emergency_contact_name,
          emergency_contact_phone: payload.emergency_contact_phone,
emergency_contact_relation_uuid: payload.emergency_contact_relation_uuid,
        });
        localStorage.setItem(
          `personal-snapshot-${token}`,
          JSON.stringify({
            date_of_birth: payload.date_of_birth,
            gender: payload.gender,
            marital_status: payload.marital_status,
            blood_group: payload.blood_group,
            nationality_country_uuid: payload.nationality_country_uuid,
            residence_country_uuid: payload.residence_country_uuid,
            emergency_contact_name: payload.emergency_contact_name,
emergency_contact_phone: payload.emergency_contact_phone,
emergency_contact_relation_uuid: payload.emergency_contact_relation_uuid,
          })
        );

        toast.success("Personal details updated successfully");
      }

      if (isEditMode) {
        router.push(`/onboarding/${token}/preview-page`);
      } else {
        router.push(`/onboarding/${token}/address-details`);
      }
    } catch {
      toast.error("Failed to save personal details");
      setError("Failed to save personal details");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
      isSubmittingRef.current = false;
    }
  };

    /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
      {/* Background accent elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-5xl rounded-2xl bg-white/95 backdrop-blur-lg p-8 shadow-xl border border-indigo-100">
        <h2 className="mb-6 text-3xl font-bold text-indigo-900">
          Personal Details
        </h2>

        {error && <ErrorAlert message={error} onClose={() => setError("")} />}

        {offer && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border border-indigo-200">
            <h3 className="font-semibold text-indigo-900 mb-4">📋 Offer Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-indigo-700 font-medium">First Name</p>
                <p className="font-semibold text-gray-900">{offer.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-indigo-700 font-medium">Last Name</p>
                <p className="font-semibold text-gray-900">{offer.last_name}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-indigo-700 font-medium">Email</p>
                <p className="font-semibold text-gray-900 break-all">{offer.mail}</p>
              </div>
              <div>
                <p className="text-sm text-indigo-700 font-medium">Country Code</p>
                <p className="font-semibold text-gray-900">+{offer.country_code}</p>
              </div>
              <div>
                <p className="text-sm text-indigo-700 font-medium">Contact Number</p>
                <p className="font-semibold text-gray-900">{offer.contact_number}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Date of Birth"
              required
              error={fieldErrors.date_of_birth}
            >
              <TextInput
                type="date"
                name="date_of_birth"
                value={formData?.date_of_birth || ""}
                onChange={handleChange}
                error={fieldErrors.date_of_birth ? "true" : ""}
              />
            </FormField>

            <FormField label="Gender" required error={fieldErrors.gender}>
              <SelectInput
                name="gender"
                value={formData?.gender || ""}
                onChange={handleChange}
                placeholder="Select Gender"
                error={fieldErrors.gender ? "true" : ""}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </SelectInput>
            </FormField>

            <FormField
              label="Marital Status"
              required
              error={fieldErrors.marital_status}
            >
              <SelectInput
                name="marital_status"
                value={formData?.marital_status || ""}
                onChange={handleChange}
                placeholder="Select Marital Status"
                error={fieldErrors.marital_status ? "true" : ""}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </SelectInput>
            </FormField>

            <FormField
              label="Blood Group"
              required
              error={fieldErrors.blood_group}
            >
              <SelectInput
                name="blood_group"
                value={formData?.blood_group || ""}
                onChange={handleChange}
                placeholder="Select Blood Group"
                error={fieldErrors.blood_group ? "true" : ""}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </SelectInput>
            </FormField>

            <FormField
              label="Nationality"
              required
              error={fieldErrors.nationality_country_uuid}
            >
              <SelectInput
                name="nationality_country_uuid"
                value={formData?.nationality_country_uuid || ""}
                onChange={handleChange}
                placeholder="Select Country"
                error={fieldErrors.nationality_country_uuid ? "true" : ""}
              >
                {countries.map((c) => (
                  <option key={c.country_uuid} value={c.country_uuid}>
                    {c.country_name}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField
              label="Residence Country"
              required
              error={fieldErrors.residence_country_uuid}
            >
              <SelectInput
                name="residence_country_uuid"
                value={formData?.residence_country_uuid || ""}
                onChange={handleChange}
                placeholder="Select Country"
                error={fieldErrors.residence_country_uuid ? "true" : ""}
              >
                {countries.map((c) => (
                  <option key={c.country_uuid} value={c.country_uuid}>
                    {c.country_name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          {/* Emergency Contact Section */}
          <div className="border-t border-indigo-200 pt-4 mt-4">
            <h3 className="mb-4 text-lg font-semibold text-indigo-900">
              🆘 Emergency Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Emergency Contact Name"
                required
                error={fieldErrors.emergency_contact_name}
              >
                <TextInput
                  name="emergency_contact_name"
                  value={formData?.emergency_contact_name || ""}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  error={fieldErrors.emergency_contact_name ? "true" : ""}
                />
              </FormField>

              <FormField
                label="Emergency Contact Phone"
                required
                error={fieldErrors.emergency_contact_phone}
              >
                <TextInput
                  name="emergency_contact_phone"
                  type="tel"
                  value={formData?.emergency_contact_phone || ""}
                  onChange={handlePhoneChange}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  error={fieldErrors.emergency_contact_phone ? "true" : ""}
                />
              </FormField>

              <FormField
                label="Emergency Contact Relation"
                required
                error={fieldErrors.emergency_contact_relation_uuid}
                className="md:col-span-2"
              >
                <SelectInput
                  name="emergency_contact_relation_uuid"
                  value={formData?.emergency_contact_relation_uuid || ""}
                  onChange={handleChange}
                  placeholder="Select Relation"
                  error={fieldErrors.emergency_contact_relation_uuid ? "true" : ""}
                >
                  {relations.map((r) => (
                    <option key={r.relation_uuid} value={r.relation_uuid}>
                      {r.relation_name}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-indigo-200">
            <Button
              variant="secondary"
              onClick={() => setFormData({
                date_of_birth: "",
                gender: "",
                marital_status: "",
                blood_group: "",
                nationality_country_uuid: "",
                residence_country_uuid: "",
                emergency_contact_name: "",
                emergency_contact_phone: "",
                emergency_contact_relation_uuid: "",
              })}
            >
              Clear Form
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
