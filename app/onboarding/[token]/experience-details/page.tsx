"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useLocalStorageForm } from "../hooks/localStorage";
import { toast } from "react-hot-toast";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";
import { FormField, TextInput, SelectInput } from "@/app/components/onboarding/FormComponents";
import { Button } from "@/app/components/onboarding/ButtonComponents";
import { ErrorAlert } from "@/app/components/onboarding/AlertsComponents";
import { validations, errorMessages } from "@/app/utils/validations";

/* ===================== TYPES ===================== */

interface ExperienceDocument {
  doc_type: string;
  file?: File;
  file_path?: string;
}

interface ExperienceDetails {
  experience_uuid?: string;
  company_name: string;
  role_title: string;
  start_date: string;
  end_date: string;
  employment_type: string;
  is_current: boolean;
  notice_period_days?: number;
  documents: ExperienceDocument[];
}

const EMPLOYMENT_DOCUMENT_RULES: Record<string, string[]> = {
  "Full-Time": ["exp_certificate_path", "payslip_path"],
  "Part-Time": ["exp_certificate_path"],
  Intern: ["internship_certificate_path"],
  Contract: ["contract_aggrement_path"],
  Freelance: ["exp_certificate_path"],
};

function calculateDuration(start: string, end: string) {
  if (!start || !end) return "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0) return `${years} year(s) ${remainingMonths} month(s)`;
  return `${remainingMonths} month(s)`;
}

const isExperienceSame = (
    original: ExperienceDetails[] | null,
    current: ExperienceDetails[]
  ) => {
    if (!original) return false;

    const clean = (list: ExperienceDetails[]) =>
      list.map((e) => ({
        company_name: e.company_name,
        role_title: e.role_title,
        start_date: e.start_date,
        end_date: e.end_date,
        employment_type: e.employment_type,
        is_current: e.is_current,
        notice_period_days: e.notice_period_days,
      }));

    return JSON.stringify(clean(original)) === JSON.stringify(clean(current));
  };

export default function ExperienceDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setLoading: setGlobalLoading } = useGlobalLoading();

  const [hasExperience, setHasExperience] = useLocalStorageForm<boolean>(
    `has-experience-${token}`,
    false
  );
  
  const [experienceList, setExperienceList] = useLocalStorageForm<ExperienceDetails[]>(
    `experience-details-${token}`,
    []
  );

  const [originalList, setOriginalList] = useState<ExperienceDetails[] | null>(null);

  useEffect(() => {
    if (originalList === null && experienceList.length > 0) {
      setOriginalList(JSON.parse(JSON.stringify(experienceList)));
    }
  }, [experienceList, originalList]);

  const addExperience = () => {
    const newExp: ExperienceDetails = {
      company_name: "",
      role_title: "",
      start_date: "",
      end_date: "",
      employment_type: "",
      is_current: false,
      notice_period_days: undefined,
      documents: [],
    };
    setExperienceList([...experienceList, newExp]);
  };

  const updateExperience = (
    index: number,
    field: keyof ExperienceDetails,
    value: string | number | boolean | ExperienceDocument[]
  ) => {
    const updated = [...experienceList];
    updated[index] = { ...updated[index], [field]: value };
    setExperienceList(updated);
  };

  const updateDocument = (index: number, doc_type: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    const updated = [...experienceList];
    const docs = updated[index].documents.filter((d) => d.doc_type !== doc_type);
    docs.push({ doc_type, file, file_path: file.name });
    updated[index].documents = docs;
    setExperienceList(updated);
  };

  const removeExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };

  const validateExperience = () => {
    if (!hasExperience) return true;

    for (let i = 0; i < experienceList.length; i++) {
      const exp = experienceList[i];
      if (!exp.company_name.trim()) {
        toast.error(`Experience ${i + 1}: Company name is required`);
        return false;
      }
      if (!exp.role_title.trim()) {
        toast.error(`Experience ${i + 1}: Role selection is required`);
        return false;
      }
      if (!exp.start_date) {
        toast.error(`Experience ${i + 1}: Start date is required`);
        return false;
      }
      const startDate = new Date(exp.start_date);
      if (startDate > new Date()) {
        toast.error(`Experience ${i + 1}: Start date cannot be in the future`);
        return false;
      }
      if (exp.end_date) {
        if (new Date(exp.end_date) < startDate) {
          toast.error(`Experience ${i + 1}: End date cannot be before start date`);
          return false;
        }
      }
      if (exp.is_current && exp.end_date) {
        toast.error(`Experience ${i + 1}: Current job cannot have an end date`);
        return false;
      }
      if (exp.is_current && !exp.notice_period_days) {
        toast.error(`Experience ${i + 1}: Notice period is required for current job`);
        return false;
      }
    }
    return true;
  };

  const handleSaveAndContinue = async () => {
    if (!validateExperience()) return;
    const isEditMode = !!searchParams.get("edit");

    if (isExperienceSame(originalList, experienceList)) {
      toast("No changes detected", { icon: "ℹ️" });

      if (isEditMode) {
        router.push(`/onboarding/${token}/preview-page`);
      } else {
        router.push(`/onboarding/${token}/bank-pf-details`);
      }

      return;
    }

    if (!hasExperience) {
      toast.success("Saved successfully");
      if (!!searchParams.get("edit")) {
        router.push(`/onboarding/${token}/preview-page`);
      } else {
        router.push(`/onboarding/${token}/bank-pf-details`);
      }
      return;
    }

    setLoading(true);
    setGlobalLoading(true);

    try {
      const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`);
      if (!tokenRes.ok) throw new Error("Failed to verify token");
      const employee_uuid: string = await tokenRes.json();

      for (let i = 0; i < experienceList.length; i++) {
        const exp = experienceList[i];
        const requiredDocs = EMPLOYMENT_DOCUMENT_RULES[exp.employment_type] || [];
        for (const docType of requiredDocs) {
          if (!exp.documents.some((d) => d.doc_type === docType)) {
            toast.error(`Please upload ${docType.replace(/_/g, " ")} for Experience ${i + 1}`);
            setLoading(false);
            setGlobalLoading(false);
            return;
          }
        }
      }

      for (let i = 0; i < experienceList.length; i++) {
        const exp = experienceList[i];
        const form = new FormData();
        form.append("employee_uuid", employee_uuid);
        form.append("company_name", exp.company_name);
        form.append("role_title", exp.role_title);
        form.append("employment_type", exp.employment_type);
        form.append("start_date", exp.start_date);
        if (exp.end_date) form.append("end_date", exp.end_date);
        form.append("is_current", String(exp.is_current));
        if (exp.notice_period_days) form.append("notice_period_days", String(exp.notice_period_days));

        exp.documents.forEach((d) => {
          form.append("doc_types", d.doc_type);
          if (d.file) form.append("files", d.file);
        });

        const endpoint = exp.experience_uuid 
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/experience/${exp.experience_uuid}`
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/experience/`;
        
        const res = await fetch(endpoint, {
          method: exp.experience_uuid ? "PUT" : "POST",
          body: form,
        });

        if (!res.ok) throw new Error("Failed to save experience details");
        const data = await res.json();
        
        // Update experience_uuid if new
        if (!exp.experience_uuid) {
          exp.experience_uuid = data.experience_uuid;
        }
      }

      toast.success("Experience details saved successfully");
      if (!!searchParams.get("edit")) {
        router.push(`/onboarding/${token}/preview-page`);
      } else {
        router.push(`/onboarding/${token}/bank-pf-details`);
      }
    } catch (err) {
      toast.error("Failed to save experience details");
      setError("An error occurred while saving your experience details.");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const openDocumentInNewTab = (file?: File, filePath?: string) => {
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else if (filePath) {
      window.open(filePath, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-5xl rounded-2xl bg-white/95 backdrop-blur-lg p-8 shadow-xl border border-indigo-100">
        <h2 className="mb-6 text-3xl font-bold text-indigo-900">Work Experience</h2>

        {error && <ErrorAlert message={error} onClose={() => setError("")} />}

        <div className="space-y-8">
          <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 shadow-sm">
            <label className="block text-lg font-semibold text-indigo-900 mb-4">
              Do you have prior work experience?
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    className="peer sr-only"
                    checked={hasExperience === true}
                    onChange={() => {
                      setHasExperience(true);
                      if (experienceList.length === 0) addExperience();
                    }}
                  />
                  <div className="w-6 h-6 border-2 border-indigo-300 rounded-full peer-checked:border-indigo-600 peer-checked:bg-indigo-600 transition-all"></div>
                  <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                </div>
                <span className="text-indigo-900 font-medium group-hover:text-indigo-700">Yes, I am experienced</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    className="peer sr-only"
                    checked={hasExperience === false}
                    onChange={() => setHasExperience(false)}
                  />
                  <div className="w-6 h-6 border-2 border-indigo-300 rounded-full peer-checked:border-indigo-600 peer-checked:bg-indigo-600 transition-all"></div>
                  <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                </div>
                <span className="text-indigo-900 font-medium group-hover:text-indigo-700">No, I am a fresher</span>
              </label>
            </div>
          </div>

          {hasExperience && (
            <div className="space-y-6">
              {experienceList.map((exp, index) => {
                const requiredDocs = EMPLOYMENT_DOCUMENT_RULES[exp.employment_type] || [];
                return (
                  <div key={index} className="relative p-6 rounded-2xl border border-indigo-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => removeExperience(index)}
                        className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                        title="Remove experience"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center">
                      <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                        {index + 1}
                      </span>
                      Experience Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Company Name" required>
                        <TextInput
                          value={exp.company_name}
                          onChange={(e) => updateExperience(index, "company_name", e.target.value)}
                          placeholder="Organization name"
                        />
                      </FormField>

                      <FormField label="Designation / Role" required>
                        <TextInput
                          value={exp.role_title}
                          onChange={(e) => updateExperience(index, "role_title", e.target.value)}
                          placeholder="e.g. Software Engineer"
                        />
                      </FormField>

                      <FormField label="Start Date" required>
                        <TextInput
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={exp.start_date}
                          onChange={(e) => updateExperience(index, "start_date", e.target.value)}
                        />
                      </FormField>

                      <FormField label="End Date">
                        <TextInput
                          type="date"
                          disabled={exp.is_current}
                          value={exp.end_date}
                          onChange={(e) => updateExperience(index, "end_date", e.target.value)}
                        />
                        {exp.start_date && exp.end_date && !exp.is_current && (
                          <p className="mt-1 text-xs text-indigo-600 font-medium">
                            Duration: {calculateDuration(exp.start_date, exp.end_date)}
                          </p>
                        )}
                      </FormField>

                      <FormField label="Employment Type" required>
                        <SelectInput
                          value={exp.employment_type}
                          onChange={(e) => updateExperience(index, "employment_type", e.target.value)}
                          placeholder="Select type"
                        >
                          {Object.keys(EMPLOYMENT_DOCUMENT_RULES).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </SelectInput>
                      </FormField>

                      <div className="flex flex-col justify-center pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                            checked={exp.is_current}
                            onChange={(e) => updateExperience(index, "is_current", e.target.checked)}
                          />
                          <span className="text-indigo-900 font-medium group-hover:text-indigo-700">Currently working here</span>
                        </label>
                      </div>

                      {exp.is_current && (
                        <FormField label="Notice Period (Days)" required>
                          <TextInput
                            type="number"
                            min={0}
                            max={120}
                            value={exp.notice_period_days || ""}
                            onChange={(e) => updateExperience(index, "notice_period_days", Number(e.target.value))}
                            placeholder="Number of days"
                          />
                        </FormField>
                      )}
                    </div>

                    {requiredDocs.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-indigo-50">
                        <h4 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-4">Required Documents</h4>
                        <div className="grid grid-cols-1 gap-4">
                          {requiredDocs.map((doc) => {
                            const existing = exp.documents.find((d) => d.doc_type === doc);
                            const hasFile = existing?.file || existing?.file_path;
                            const fileName = existing?.file?.name || (existing?.file_path?.split("/").pop() || "Uploaded file");

                            return (
                              <div key={doc} className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                <label className="block text-sm font-medium text-indigo-900 mb-3 uppercase flex items-center justify-between">
                                  {doc.replace(/_/g, " ")}
                                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Required</span>
                                </label>
                                <div className="flex flex-wrap items-center gap-3">
                                  <label className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 16l-4-4m0 0l-4 4m4-4v12" />
                                    </svg>
                                    Upload
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      className="hidden"
                                      onChange={(e) => e.target.files && updateDocument(index, doc, e.target.files[0])}
                                    />
                                  </label>
                                  {hasFile && (
                                    <button
                                      onClick={() => openDocumentInNewTab(existing?.file, existing?.file_path)}
                                      className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      View
                                    </button>
                                  )}
                                  <span className="text-sm text-indigo-600 flex-1 truncate">{hasFile ? fileName : "No file selected"}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={addExperience}
                className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 font-semibold hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add another experience
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-8 border-t border-indigo-100">
            <Button
              variant="secondary"
              onClick={() => {
                if (!!searchParams.get("edit")) {
                  router.push(`/onboarding/${token}/preview-page`);
                } else {
                  router.push(`/onboarding/${token}/identity-documents`);
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