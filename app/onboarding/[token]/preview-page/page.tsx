"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLocalStorageForm } from "../hooks/localStorage";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";
import { Button } from "@/app/components/onboarding/ButtonComponents";

/* ===================== TYPES ===================== */

interface PersonalDetails {
  user_uuid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_number?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  blood_group?: string;
  nationality_country_uuid?: string;
  residence_country_uuid?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation_uuid?: string;
}

interface Address {
  address_type: "permanent" | "current";
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district_or_ward?: string;
  state_or_region?: string;
  postal_code?: string;
  country_uuid?: string;
}

interface Country {
  country_uuid: string;
  country_name: string;
  is_active: boolean;
}

interface Relation {
  relation_uuid: string;
  relation_name: string;
}

interface Education {
  education_name: string;
  institution_name?: string;
  institute_location?: string;
  education_mode?: string;
  start_year?: number | string;
  specialization?: string;
  year_of_passing?: number | string;
  percentage_cgpa?: number | string;
  delay_reason?: string;
  documents?: {
    document_name: string;
    file_path?: string;
  }[];
}

interface ExperienceDocument {
  document_name?: string;
  doc_type?: string;
  file?: File;
  file_path?: string;
}

interface Experience {
  experience_uuid: string;
  file_path?: string;
  company_name?: string;
  start_date?: string;
  end_date?: string | null;
  role_title?: string;
  employment_type?: string;
  is_current?: boolean | number;
  notice_period_days?: number;
  documents?: ExperienceDocument[];
}

interface IdentityDraft {
  country_uuid: string;
  documents: IdentityDocument[];
}

interface IdentityDocument {
  mapping_uuid: string;
  identity_type_uuid: string;
  identity_type_name: string;
  identity_file_number: string;
  file?: File;
  file_path?: string;
}

interface BankDetails {
  bank: {
    account_holder_name: string;
    bank_name: string;
    branch_name: string;
    account_number: string;
    confirm_account_number: string;
    ifsc_code: string;
    account_type: string;
  }
  pf: {
      pf_member: boolean,
      uan_number?: string
  }
}


/* ===================== COMPONENT ===================== */

const DOCUMENT_LABELS: Record<string, string> = {
  exp_certificate_path: "Experience Certificate",
  payslip_path: "Payslip",
  internship_certificate_path: "Internship Certificate",
  contract_aggrement_path: "Contract Agreement",
};

export default function OnboardingPreviewPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setLoading: setGlobalLoading } = useGlobalLoading();
  const [countries, setCountries] = useState<Country[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [mounted, setMounted] = useState(false);

  const isSubmittedRef = React.useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) =>
        setCountries((Array.isArray(data) ? data : []).filter((c) => c.is_active))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/relations`)
      .then((res) => res.json())
      .then((data: Relation[]) => setRelations(data))
      .catch(() => {});
  }, []);

  /* ===================== LOCAL STORAGE ===================== */

  const [personalDetails, , clearPersonal] = useLocalStorageForm<PersonalDetails | null>(
    `personal-details-${token}`,
    null
  );

  const [addressData, , clearAddress] = useLocalStorageForm<Record<string, Address>>(
    `address-details-${token}`,
    {}
  );

  const [educationDetails, setEducationDetails, clearEducation] = useLocalStorageForm<Education[]>(
    `education-details-${token}`,
    []
  );

  const [experienceDetails, setExperienceDetails, clearExperience] = useLocalStorageForm<Experience[]>(
    `experience-details-${token}`,
    []
  );

  const [identityDraft, setIdentityDraft, clearIdentity] = useLocalStorageForm<IdentityDraft>(
    `identity-details-${token}`,
    {
      country_uuid: "",
      documents: [],
    }
  );

  const [bankDetails] = useLocalStorageForm<BankDetails | null>(
    `bank-pf-details-${token}`,
    null
  );

  const user_uuid = personalDetails?.user_uuid;

  useEffect(() => {
    if (!mounted || !token) return;
    if (isSubmittedRef.current) return;

    let cancelled = false;

    const backfillEducation = async () => {
      if (isSubmittedRef.current) return;
      if (educationDetails.length === 0) return;
      const hasMissing = educationDetails.some((edu) =>
        edu.documents?.some((doc) => !doc.file_path)
      );
      if (!hasMissing) return;

      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const countryUuid = "019a8135-42fc-17ed-4825-f5a4634898fb";

        const [mappingRes, docsRes] = await Promise.all([
          fetch(`${base}/education/country-mapping/${countryUuid}`),
          fetch(`${base}/education/employee-education-document?token=${token}`),
        ]);
        if (!mappingRes.ok || !docsRes.ok) return;

        const mappingData = await mappingRes.json();
        const docsData = await docsRes.json();
        const mappings = Array.isArray(mappingData) ? mappingData : [];
        const uploads = Array.isArray(docsData) ? docsData : [];

        const mapByUuid = new Map(
          mappings.map(
            (m: { mapping_uuid: string; document_name: string; education_name: string }) => [
              m.mapping_uuid,
              {
                document_name: m.document_name,
                education_name: m.education_name,
              },
            ]
          )
        );

        const uploadByEduAndDoc = new Map<string, string>();
        uploads.forEach((u: { mapping_uuid?: string; file_path?: string }) => {
          if (!u.mapping_uuid || !u.file_path) return;
          const mapped = mapByUuid.get(u.mapping_uuid);
          if (!mapped) return;
          const key = `${mapped.education_name}::${mapped.document_name}`;
          uploadByEduAndDoc.set(key, u.file_path);
        });

        if (uploadByEduAndDoc.size === 0) return;

        if (!cancelled) {
          setEducationDetails((prev) =>
            prev.map((edu) => ({
              ...edu,
              documents: (edu.documents || []).map((doc) => {
                if (doc.file_path) return doc;
                const key = `${edu.education_name}::${doc.document_name}`;
                const file_path = uploadByEduAndDoc.get(key);
                return file_path ? { ...doc, file_path } : doc;
              }),
            }))
          );
        }
      } catch {}
    };

    const backfillExperience = async () => {
      const hasMissing = experienceDetails.some((exp) =>
        exp.documents?.some((doc) => !doc.file_path)
      );
      if (!hasMissing) return;
      if (!user_uuid) return;

      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const endpoints = [
          `${base}/experience/employee-experience?token=${token}`,
          `${base}/experience/employee/${user_uuid}`,
        ];

        let uploads: Array<{
          documents?: { doc_type?: string; file_path?: string }[];
          experience_uuid?: string;
        }> = [];

        for (const url of endpoints) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            uploads = Array.isArray(data) ? data : [];
            if (uploads.length > 0) break;
          } catch {}
        }

        if (uploads.length === 0) return;

        if (!cancelled) {
          setExperienceDetails((prev) =>
            prev.map((exp) => {
              const match = uploads.find(
                (u) => u.experience_uuid && u.experience_uuid === exp.experience_uuid
              );
              if (!match?.documents) return exp;
              return {
                ...exp,
                documents: (exp.documents || []).map((doc) => {
                  if (doc.file_path) return doc;
                  const found = match.documents?.find(
                    (d) => d.doc_type && d.doc_type === doc.doc_type
                  );
                  return found?.file_path ? { ...doc, file_path: found.file_path } : doc;
                }),
              };
            })
          );
        }
      } catch {}
    };

    void backfillEducation();
    void backfillExperience();

    return () => {
      cancelled = true;
    };
  }, [
    mounted,
    token,
    educationDetails,
    experienceDetails,
    identityDraft,
    user_uuid,
    setEducationDetails,
    setExperienceDetails,
    setIdentityDraft,
  ]);

  /* ===================== HELPERS ===================== */

  const addresses = useMemo<Address[]>(() => Object.values(addressData), [addressData]);

  const permanentAddress = addresses.find((a) => a.address_type === "permanent");
  const temporaryAddress = addresses.find((a) => a.address_type === "current");

  const hasAddressData = (addr?: Address) =>
    !!(
      addr?.address_line1?.trim() ||
      addr?.address_line2?.trim() ||
      addr?.city?.trim() ||
      addr?.district_or_ward?.trim() ||
      addr?.state_or_region?.trim() ||
      addr?.postal_code?.trim()
    );

  const areAddressesSame =
    permanentAddress &&
    temporaryAddress &&
    permanentAddress.address_line1 === temporaryAddress.address_line1 &&
    permanentAddress.city === temporaryAddress.city &&
    permanentAddress.postal_code === temporaryAddress.postal_code;

  const showCombined = permanentAddress && (!hasAddressData(temporaryAddress) || areAddressesSame);

  const identityList = useMemo<IdentityDocument[]>(
    () => (Array.isArray(identityDraft?.documents) ? identityDraft.documents : []),
    [identityDraft]
  );

  const educationList = useMemo<Education[]>(
    () => (Array.isArray(educationDetails) ? educationDetails : []),
    [educationDetails]
  );

  const isDataComplete = useMemo(() => {
    return Boolean(
      user_uuid &&
        personalDetails &&
        addresses.length > 0 &&
        educationList.length > 0 &&
        identityList.length > 0
    );
  }, [user_uuid, personalDetails, addresses, educationList, identityList]);

  const isSubmitDisabled = !confirmed || !isDataComplete || loading;

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error("Please confirm the details before submitting");
      return;
    }
    if (!isDataComplete || !personalDetails) {
      toast.error("Please complete all onboarding sections");
      return;
    }

    try {
      setLoading(true);
      setGlobalLoading(true);

      const payload = { user_uuid };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hr/candidate/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      isSubmittedRef.current = true;
      clearPersonal();
      clearAddress();
      clearEducation();
      clearExperience();
      clearIdentity();

      toast.success("Onboarding submitted successfully ✅");
      router.push(`/onboarding/${token}/success`);
    } catch {
      toast.error("Submission failed ❌ Your draft is safe.");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-5xl rounded-2xl bg-white/95 backdrop-blur-lg p-8 shadow-xl border border-indigo-100">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-900 mb-2">Review Your Onboarding</h1>
          <p className="text-indigo-600 font-medium">Please verify all information before final submission</p>
          {!isDataComplete && (
            <p className="mt-4 text-red-500 font-medium flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Some sections are incomplete
            </p>
          )}
        </div>

        <div className="space-y-12">
          {/* PERSONAL DETAILS */}
          <Section
            title="Personal Information"
            onEdit={() => router.push(`/onboarding/${token}/personal-details?edit=true`)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
              <PreviewRow label="Full Name" value={`${personalDetails?.first_name} ${personalDetails?.last_name}`} />
              <PreviewRow label="Email Address" value={personalDetails?.email} />
              <PreviewRow label="Contact Number" value={personalDetails?.contact_number} />
              <PreviewRow label="Date of Birth" value={personalDetails?.date_of_birth} />
              <PreviewRow label="Gender" value={personalDetails?.gender} />
              <PreviewRow label="Marital Status" value={personalDetails?.marital_status} />
              <PreviewRow label="Blood Group" value={personalDetails?.blood_group} />
              <PreviewRow label="Nationality" value={getCountryName(countries, personalDetails?.nationality_country_uuid)} />
              <PreviewRow label="Residence" value={getCountryName(countries, personalDetails?.residence_country_uuid)} />
              <PreviewRow label="Emergency Contact" value={`${personalDetails?.emergency_contact_name} (${getRelationName(relations, personalDetails?.emergency_contact_relation_uuid)})`} />
              <PreviewRow label="Emergency Phone" value={personalDetails?.emergency_contact_phone} />
            </div>
          </Section>

          {/* ADDRESS DETAILS */}
          <Section
            title="Residential Address"
            onEdit={() => router.push(`/onboarding/${token}/address-details?edit=true`)}
          >
            {showCombined ? (
              <AddressBlock title="Permanent & Current Address" address={permanentAddress} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {permanentAddress && hasAddressData(permanentAddress) && (
                  <AddressBlock title="Permanent Address" address={permanentAddress} />
                )}
                {temporaryAddress && hasAddressData(temporaryAddress) && (
                  <AddressBlock title="Current Address" address={temporaryAddress} />
                )}
              </div>
            )}
          </Section>

          {/* IDENTITY DOCUMENTS */}
          <Section
            title="Identity Verification"
            onEdit={() => router.push(`/onboarding/${token}/identity-documents?edit=true`)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {identityList.map((doc, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm mb-1">{doc.identity_type_name}</h4>
                    <p className="text-sm text-indigo-600 font-medium mb-2">{doc.identity_file_number}</p>
                    <span className="text-xs px-2 py-1 bg-white text-indigo-500 rounded-md border border-indigo-100 shadow-sm">
                      {doc.file_path ? doc.file_path.split("/").pop() : doc.file?.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* EDUCATION DETAILS */}
          <Section
            title="Educational Background"
            onEdit={() => router.push(`/onboarding/${token}/education-details?edit=true`)}
          >
            <div className="space-y-6">
              {educationList.map((edu, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-indigo-100 bg-white shadow-sm">
                  <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    {edu.education_name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                    <PreviewRow label="Institution" value={edu.institution_name} />
                    <PreviewRow label="Specialization" value={edu.specialization} />
                    <PreviewRow label="Location" value={edu.institute_location} />
                    <PreviewRow label="Mode" value={edu.education_mode} />
                    <PreviewRow label="Duration" value={`${edu.start_year} - ${edu.year_of_passing}`} />
                    <PreviewRow label="Result" value={`${edu.percentage_cgpa}% / CGPA`} />
                  </div>
                  {edu.documents && edu.documents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-indigo-50 flex gap-3 flex-wrap">
                      {edu.documents.map((d, i) => (
                        <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-medium">
                          📄 {d.document_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* EXPERIENCE DETAILS */}
          {experienceDetails.length > 0 && (
            <Section
              title="Work Experience"
              onEdit={() => router.push(`/onboarding/${token}/experience-details?edit=true`)}
            >
              <div className="space-y-6">
                {experienceDetails.map((exp, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-indigo-100 bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-indigo-900">{exp.company_name}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${exp.is_current ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {exp.is_current ? "Current Employer" : "Previous Employer"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                      <PreviewRow label="Role" value={exp.role_title} />
                      <PreviewRow label="Type" value={exp.employment_type} />
                      <PreviewRow label="Duration" value={`${exp.start_date} to ${exp.is_current ? "Present" : exp.end_date}`} />
                      {exp.is_current && <PreviewRow label="Notice Period" value={`${exp.notice_period_days} Days`} />}
                    </div>
                    {exp.documents && exp.documents.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-indigo-50 flex gap-3 flex-wrap">
                        {exp.documents.map((d, i) => (
                          <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-medium">
                            📄 {DOCUMENT_LABELS[d.doc_type || ""] || d.doc_type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
          {/* BANK & PF DETAILS */}
          <Section
            title="Bank & PF Details"
            onEdit={() => router.push(`/onboarding/${token}/bank-pf-details?edit=true`)}>
            <div className="p-6 rounded-xl border border-indigo-100 bg-white shadow-sm">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">

                <PreviewRow
                  label="Account Holder Name"
                  value={bankDetails?.bank?.account_holder_name}
                />

                <PreviewRow
                  label="Bank Name"
                  value={bankDetails?.bank?.bank_name}
                />

                <PreviewRow
                  label="Branch Name"
                  value={bankDetails?.bank?.branch_name}
                />

                <PreviewRow
                  label="Account Type"
                  value={bankDetails?.bank?.account_type}
                />

                <PreviewRow
                  label="Account Number"
                  value={
                    bankDetails?.bank?.account_number
                      ? `**** **** **** ${bankDetails.bank.account_number.slice(-4)}`
                      : "-"
                  }
                />

                <PreviewRow
                  label="IFSC Code"
                  value={bankDetails?.bank?.ifsc_code}
                />

                <PreviewRow
                  label="PF Member"
                  value={bankDetails?.pf?.pf_member ? "Yes" : "No"}
                />

                {bankDetails?.pf?.pf_member && (
                  <PreviewRow
                    label="UAN Number"
                    value={bankDetails?.pf?.uan_number}
                  />
                )}

              </div>

            </div>
          </Section>

          {/* SUBMISSION ACTION */}
          <div className="mt-12 space-y-8">
            <div className={`p-6 rounded-2xl border-2 transition-all ${confirmed ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-indigo-100 bg-white"}`}>
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <div className="w-8 h-8 md:w-6 md:h-6 border-2 border-indigo-300 rounded peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                    <svg className={`w-4 h-4 text-white ${confirmed ? "scale-100" : "scale-0"} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-indigo-900 font-bold">Declare Information Accuracy</p>
                  <p className="text-sm text-indigo-600">I confirm that all details provided are true to the best of my knowledge.</p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between gap-6">
              <p className="hidden md:block text-sm text-indigo-400 font-medium">
                Step 6 of 6: Final Review
              </p>
              <div className="flex-1 md:flex-none flex gap-4">
                <Button variant="secondary" onClick={() => router.back()} disabled={loading}>
                  Go Back
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 md:flex-none px-12"
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  loading={loading}
                >
                  Submit Onboarding 🚀
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== SUB-COMPONENTS ===================== */

function Section({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-indigo-600 rounded-full group-hover:bg-indigo-400 transition-colors"></span>
          {title}
        </h2>
        <button
          onClick={onEdit}
          className="px-4 py-1.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
        >
          Modify
        </button>
      </div>
      <div className="pl-4 md:pl-5">{children}</div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value?: string | number | null }) {
  const display = value && String(value).trim() !== "" && value !== "undefined undefined" ? String(value) : "-";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{label}</span>
      <span className="text-indigo-900 font-medium text-lg leading-tight">{display}</span>
    </div>
  );
}

function AddressBlock({ title, address }: { title: string; address?: Address }) {
  return (
    <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">{title}</h4>
      <div className="text-indigo-900 font-medium leading-relaxed">
        <p className="text-lg">{address?.address_line1}</p>
        <p>{address?.address_line2}</p>
        <p className="mt-2 text-indigo-700">
          {address?.city}, {address?.district_or_ward}
        </p>
        <p>
          {address?.state_or_region} - {address?.postal_code}
        </p>
      </div>
    </div>
  );
}

function getCountryName(countries: Country[], uuid?: string) {
  if (!uuid) return "-";
  return countries.find((c) => c.country_uuid === uuid)?.country_name || uuid;
}

function getRelationName(relations: Relation[], uuid?: string) {
  if (!uuid) return "-";
  return relations.find((r) => r.relation_uuid === uuid)?.relation_name || uuid;
}


