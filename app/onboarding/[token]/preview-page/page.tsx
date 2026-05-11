"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLocalStorageForm } from "../hooks/localStorage";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";
import { Button } from "@/app/components/onboarding/ButtonComponents";
import { API_CONFIG } from "@/app/utils/apiConfig";


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
    fetch(`${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) =>
        setCountries((Array.isArray(data) ? data : []).filter((c) => c.is_active))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/employee-upload/relations`)
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

  const [hasExperience] = useLocalStorageForm<boolean>(
    `has-experience-${token}`,
    false
  );

  const [experienceDetails, setExperienceDetails, clearExperience] = useLocalStorageForm<Experience[]>(
    `experience-details-${token}`,
    []
  );

  const [identityDraft, , clearIdentity] = useLocalStorageForm<IdentityDraft>(
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
    if (educationDetails.length === 0) return;
    const hasMissing = educationDetails.some((edu) =>
      edu.documents?.some((doc) => !doc.file_path)
    );
    if (!hasMissing) return;

    let cancelled = false;

    const backfillEducation = async () => {
      if (isSubmittedRef.current) return;
      try {
        const base = API_CONFIG.EMPLOYEE_ONBOARDING_URL;
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

    void backfillEducation();
    return () => { cancelled = true; };
  }, [mounted, token, educationDetails, setEducationDetails]);

  useEffect(() => {
    if (!mounted || !token) return;
    if (isSubmittedRef.current) return;
    // if (!hasExperience) return;
    if (!hasExperience || experienceDetails.length === 0) {
  return;
}
    if (!user_uuid) return;
    const hasMissing = experienceDetails.some((exp) =>
      exp.documents?.some((doc) => !doc.file_path)
    );
    if (!hasMissing) return;

    let cancelled = false;

    const backfillExperience = async () => {
      if (!experienceDetails.length) return;
      try {
        const base = API_CONFIG.EMPLOYEE_ONBOARDING_URL;
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

    void backfillExperience();
    return () => { cancelled = true; };
  }, [mounted, token, hasExperience, experienceDetails, user_uuid, setExperienceDetails]);

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

  // const isDataComplete = useMemo(() => {
  //   const hasBankDetails = Boolean(
  //     bankDetails?.bank?.account_holder_name?.trim() &&
  //       bankDetails.bank.bank_name?.trim() &&
  //       bankDetails.bank.account_number?.trim() &&
  //       bankDetails.bank.ifsc_code?.trim() &&
  //       bankDetails.bank.account_type?.trim()
  //   );
  //   const hasValidExperience =
  //   !hasExperience || experienceDetails.length > 0;

  //   return Boolean(
  //     user_uuid &&
  //       personalDetails &&
  //       hasAddressData(permanentAddress) &&
  //       educationList.length > 0 &&
  //       identityList.length > 0 &&
        
  //       hasBankDetails
  //   );
  // }, [user_uuid, personalDetails, permanentAddress, educationList, identityList, bankDetails]);

  // const isSubmitDisabled = !confirmed || loading;

  const isDataComplete = useMemo(() => {
  const hasBankDetails = Boolean(
    bankDetails?.bank?.account_holder_name?.trim() &&
      bankDetails.bank.bank_name?.trim() &&
      bankDetails.bank.account_number?.trim() &&
      bankDetails.bank.ifsc_code?.trim() &&
      bankDetails.bank.account_type?.trim()
  );

  const hasValidExperience =
    !hasExperience || experienceDetails.length > 0;

  return Boolean(
    user_uuid &&
      personalDetails &&
      hasAddressData(permanentAddress) &&
      educationList.length > 0 &&
      identityList.length > 0 &&
      hasBankDetails &&
      hasValidExperience
  );
}, [
  user_uuid,
  personalDetails,
  permanentAddress,
  educationList,
  identityList,
  bankDetails,
  hasExperience,
  experienceDetails,
]);
const isSubmitDisabled =
  !confirmed ||
  loading ||
  !isDataComplete;
  const handleSubmitOnboarding = async () => {
    if (loading) return;

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
      const res = await fetch(`${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/hr/candidate/submit`, {
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
      router.replace(`/onboarding/${token}/success`);
    } catch {
      toast.error("Submission failed ❌ Your draft is safe.");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="py-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        {/* Page Header */}
        <div className="mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Review Your Onboarding</h1>
              <p className="text-sm text-slate-500 mt-1">Please verify all information before final submission</p>
            </div>
            {!isDataComplete && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg shrink-0">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-red-600">Sections incomplete</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* PERSONAL DETAILS */}
          <Section
            title="Personal Information"
            onEdit={() => router.push(`/onboarding/${token}/personal-details?edit=true`)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
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
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shrink-0">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm mb-0.5">{doc.identity_type_name}</h4>
                    <p className="text-sm text-slate-600 font-medium mb-2">{doc.identity_file_number}</p>
                    <span className="text-[11px] px-2 py-1 bg-white text-slate-500 rounded-md border border-slate-200">
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
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    <h3 className="text-sm font-semibold text-slate-800">{edu.education_name}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <PreviewRow label="Institution" value={edu.institution_name} />
                    <PreviewRow label="Specialization" value={edu.specialization} />
                    <PreviewRow label="Location" value={edu.institute_location} />
                    <PreviewRow label="Mode" value={edu.education_mode} />
                    <PreviewRow label="Duration" value={`${edu.start_year} - ${edu.year_of_passing}`} />
                    <PreviewRow label="Result" value={`${edu.percentage_cgpa}% / CGPA`} />
                  </div>
                  {edu.documents && edu.documents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
                      {edu.documents.map((d, i) => (
                        <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
                          {d.document_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* EXPERIENCE DETAILS */}
          <Section
            title="Work Experience"
            onEdit={() => router.push(`/onboarding/${token}/experience-details?edit=true`)}
          >
            {!hasExperience ? (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shrink-0">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Fresher – No Prior Work Experience</p>
                  <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
                    Candidate has indicated they are a fresher with no prior work experience.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {experienceDetails.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-sm font-semibold text-slate-800">{exp.company_name}</h3>
                      <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold ${exp.is_current ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {exp.is_current ? "Current" : "Previous"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      <PreviewRow label="Role" value={exp.role_title} />
                      <PreviewRow label="Type" value={exp.employment_type} />
                      <PreviewRow label="Duration" value={`${exp.start_date} to ${exp.is_current ? "Present" : exp.end_date}`} />
                      {exp.is_current && <PreviewRow label="Notice Period" value={`${exp.notice_period_days} Days`} />}
                    </div>
                    {exp.documents && exp.documents.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
                        {exp.documents.map((d, i) => (
                          <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
                            {DOCUMENT_LABELS[d.doc_type || ""] || d.doc_type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
          {/* BANK & PF DETAILS */}
          <Section
            title="Bank & PF Details"
            onEdit={() => router.push(`/onboarding/${token}/bank-pf-details?edit=true`)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <PreviewRow label="Account Holder Name" value={bankDetails?.bank?.account_holder_name} />
              <PreviewRow label="Bank Name" value={bankDetails?.bank?.bank_name} />
              <PreviewRow label="Branch Name" value={bankDetails?.bank?.branch_name} />
              <PreviewRow label="Account Type" value={bankDetails?.bank?.account_type} />
              <PreviewRow
                label="Account Number"
                value={
                  bankDetails?.bank?.account_number
                    ? `**** **** **** ${bankDetails.bank.account_number.slice(-4)}`
                    : "-"
                }
              />
              <PreviewRow label="IFSC Code" value={bankDetails?.bank?.ifsc_code} />
              <PreviewRow label="PF Member" value={bankDetails?.pf?.pf_member ? "Yes" : "No"} />
              {bankDetails?.pf?.pf_member && (
                <PreviewRow label="UAN Number" value={bankDetails?.pf?.uan_number} />
              )}
            </div>
          </Section>

          {/* SUBMISSION ACTION */}
          <div>
            <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
              confirmed ? "border-indigo-200" : "border-slate-200"
            }`}>

              {/* Declaration */}
              <div
                role="checkbox"
                aria-checked={confirmed}
                aria-describedby="declaration-copy"
                tabIndex={loading ? -1 : 0}
                onClick={() => { if (!loading) setConfirmed((prev) => !prev); }}
                onKeyDown={(e) => {
                  if ((e.key === " " || e.key === "Enter") && !loading) {
                    e.preventDefault();
                    setConfirmed((prev) => !prev);
                  }
                }}
                className={`flex items-start gap-4 p-6 cursor-pointer transition-colors duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-inset ${
                  confirmed ? "bg-indigo-50/40" : "bg-white hover:bg-slate-50/60"
                } ${loading ? "pointer-events-none opacity-60" : ""}`}
              >
                <div className="mt-0.5 shrink-0">
                  <div aria-hidden="true" className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                    confirmed ? "bg-indigo-600 border-indigo-600" : "border-slate-300 bg-white"
                  }`}>
                    {confirmed && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M1.5 5.5l3 3 5-5" stroke="#fff" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Declaration of Accuracy</p>
                  <p id="declaration-copy" className="text-xs text-slate-500 mt-1 leading-relaxed">
                    I hereby declare that all information provided above is accurate and complete to the best of my knowledge. I understand that any misrepresentation may result in action by my employer.
                  </p>
                </div>
                {confirmed && (
                  <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg self-start mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-semibold text-emerald-700">Agreed</span>
                  </div>
                )}
              </div>

              {/* Footer action row */}
              <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  {!isDataComplete && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                      <span className="text-xs text-amber-700 font-medium">
                        Complete all sections before submitting
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
                    Go Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmitOnboarding}
                    disabled={isSubmitDisabled}
                    loading={loading}
                  >
                    Submit Onboarding
                  </Button>
                </div>
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
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <h2 className="text-[13px] font-semibold text-slate-800 tracking-tight">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all duration-150"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.5 2.5a2.121 2.121 0 013 3L5 15H2v-3L11.5 2.5z" />
          </svg>
          Edit
        </button>
      </div>
      {/* Section body */}
      <div className="p-6">{children}</div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value?: string | number | null }) {
  const display = value && String(value).trim() !== "" && value !== "undefined undefined" ? String(value) : "-";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-slate-800 leading-snug">{display}</span>
    </div>
  );
}

function AddressBlock({ title, address }: { title: string; address?: Address }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
      <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
      <div className="text-slate-700 text-sm leading-relaxed space-y-0.5">
        <p className="font-medium text-slate-800">{address?.address_line1}</p>
        {address?.address_line2 && <p>{address.address_line2}</p>}
        <p>{address?.city}{address?.district_or_ward ? `, ${address.district_or_ward}` : ""}</p>
        <p>{address?.state_or_region}{address?.postal_code ? ` - ${address.postal_code}` : ""}</p>
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


