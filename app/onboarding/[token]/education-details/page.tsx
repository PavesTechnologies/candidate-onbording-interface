"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useLocalStorageForm } from "../hooks/localStorage";
import { useGlobalLoading } from "../../../components/onboarding/LoadingContext";
import { EDUCATION_HIERARCHY, EDUCATION_DURATION } from "./constants";
import EducationModal from "./EducationModal";
import EducationTimeline from "./EducationTimeline";
import {
  groupRows,
  hasEducationChanged,
  isEmptyValue,
  normalizeDraft,
} from "./educationUtils";
import type { CommonForm, Education, UploadedDoc } from "./types";
import { useEducationData } from "./useEducationData";
import {
  createEducationDocument,
  updateEducationDocument,
} from "./educationApi";
import { Button } from "@/app/components/onboarding/ButtonComponents";
import { ErrorAlert } from "@/app/components/onboarding/AlertsComponents";

export default function EducationDetailsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mappingLoaded, setMappingLoaded] = useState(false);
  const { setLoading: setGlobalLoading } = useGlobalLoading();

  const [countryUuid, setCountryUuid] = useState<string | null>(null);
  const [countryUuidLoaded, setCountryUuidLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    try {
      const personalDetails = localStorage.getItem(`personal-details-${token}`);
      if (personalDetails) {
        const parsed = JSON.parse(personalDetails);
        if (parsed.nationality_country_uuid) {
          setCountryUuid(parsed.nationality_country_uuid);
        } else {
          setError("Please complete Personal Details first to set your nationality");
        }
      } else {
        setError("Please complete Personal Details first");
      }
    } catch {
      setError("Failed to load country information from personal details");
    } finally {
      setCountryUuidLoaded(true);
    }
  }, [token]);

  const { rows, uploadedMap: backendUploadedMap, setUploadedMap: setBackendUploadedMap, userUuid, degrees } = useEducationData({
    base,
    token,
    countryUuid: countryUuid || "",
    onError: setError,
  });

  useEffect(() => {
    if (countryUuid && rows.length > 0) {
      setMappingLoaded(true);
    } else if (countryUuid && error) {
      setMappingLoaded(true);
    } else if (!countryUuid && countryUuidLoaded) {
      setMappingLoaded(true);
    }
  }, [rows, countryUuid, error, countryUuidLoaded]);

  const grouped = useMemo(() => groupRows(rows), [rows]);

  const [educationDetails, setEducationDetails] = useLocalStorageForm<Education[]>(
    `education-details-${token}`, 
    []
  );

  const [uploadedMap, setUploadedMapState] = useState<Record<string, UploadedDoc>>({});

  useEffect(() => {
    if (!token) return;
    try {
      const stored = localStorage.getItem(`uploaded-docs-${token}`);
      setUploadedMapState(stored ? JSON.parse(stored) : {});
    } catch {
      setUploadedMapState({});
    }
  }, [token]);

  useEffect(() => {
    if (Object.keys(backendUploadedMap).length > 0) {
      const merged = { ...uploadedMap, ...backendUploadedMap };
      setUploadedMapState(merged);
    }
  }, [backendUploadedMap]); // Fix dependency

  const setUploadedMap = (value: Record<string, UploadedDoc> | ((prev: Record<string, UploadedDoc>) => Record<string, UploadedDoc>)) => {
    setUploadedMapState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(`uploaded-docs-${token}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  const [form, setForm] = useState<CommonForm>({
    institution_name: "",
    specialization: "",
    year_of_passing: "",
    percentage_cgpa: "",
    degree_uuid: "",
    institute_location: "",
    education_mode: "",
    start_year: "",
    delay_reason: "",
  });

  const [files, setFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    setActiveLevel(null);
    setForm({
      institution_name: "",
      specialization: "",
      year_of_passing: "",
      percentage_cgpa: "",
      degree_uuid: "",
      institute_location: "",
      education_mode: "",
      start_year: "",
      delay_reason: "",
    });
    setFiles({});
    setError("");
    try {
      const stored = localStorage.getItem(`uploaded-docs-${token}`);
      setUploadedMapState(stored ? JSON.parse(stored) : {});
    } catch {
      setUploadedMapState({});
    }
  }, [token]);

  const activeRows = activeLevel ? (grouped[activeLevel] ?? []) : [];

  const draftByLevel = useMemo(() => {
    const map: Record<string, Education> = {};
    educationDetails.forEach((draft) => {
      map[draft.education_name] = draft;
    });
    return map;
  }, [educationDetails]);

  if (!countryUuidLoaded || !mappingLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center">
        <div className="p-8 bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-indigo-100">
          <p className="text-indigo-900 font-medium">Loading education details...</p>
        </div>
      </div>
    );
  }

  const openLevel = (level: string) => {
    const draft = draftByLevel[level];
    setActiveLevel(level);
    setForm({
      institution_name: draft?.institution_name || "",
      specialization: draft?.specialization || "",
      year_of_passing: draft?.year_of_passing || "",
      percentage_cgpa: draft?.percentage_cgpa || "",
      degree_uuid: draft?.degree_uuid || "",
      institute_location: draft?.institute_location || "",
      education_mode: draft?.education_mode || "",
      start_year: draft?.start_year || "",
      delay_reason: draft?.delay_reason || "",
    });
    setFiles({});
    setError("");
  };

  const handleSave = async () => {
    if (!activeLevel) return;
    if (!userUuid) {
      setError("User not initialized. Please reload the page.");
      return;
    }
    
    if (
      isEmptyValue(form.institution_name) ||
      isEmptyValue(form.specialization) ||
      isEmptyValue(form.year_of_passing) ||
      isEmptyValue(form.percentage_cgpa) ||
      isEmptyValue(form.degree_uuid) ||
      isEmptyValue(form.institute_location) ||
      isEmptyValue(form.education_mode) ||
      isEmptyValue(form.start_year)
    ) {
      setError("Please fill all required fields");
      return;
    }

    const getExpectedDuration = (level: string): number => {
      const normalized = level?.trim().toUpperCase() || "";
      if (EDUCATION_DURATION[normalized] !== undefined) return EDUCATION_DURATION[normalized];
      const withoutSpaces = normalized.replace(/\s+/g, "");
      if (EDUCATION_DURATION[withoutSpaces] !== undefined) return EDUCATION_DURATION[withoutSpaces];
      const firstWord = normalized.split(/\s+/)[0];
      if (EDUCATION_DURATION[firstWord] !== undefined) return EDUCATION_DURATION[firstWord];
      return 0;
    };

    const expectedDuration = getExpectedDuration(activeLevel || "");
    const startYear = form.start_year ? parseInt(form.start_year) : 0;
    const endYear = form.year_of_passing ? parseInt(form.year_of_passing) : 0;
    const actualDuration = startYear && endYear ? endYear - startYear : 0;
    const shouldShowDelayReason = actualDuration > expectedDuration;

    if (shouldShowDelayReason && isEmptyValue(form.delay_reason)) {
      setError("Reason for delay is mandatory");
      return;
    }

    const missingMandatory = activeRows.find(
      (r) => r.is_mandatory && !files[r.mapping_uuid] && !uploadedMap[r.mapping_uuid]
    );

    if (missingMandatory) {
      setError(`Please upload required document: ${missingMandatory.document_name}`);
      return;
    }

    const currentIndex = EDUCATION_HIERARCHY.indexOf(activeLevel);
    if (currentIndex > 0) {
      for (let i = 0; i < currentIndex; i++) {
        const requiredLevel = EDUCATION_HIERARCHY[i];
        const levelRows = grouped[requiredLevel] || [];
        const isFilled = levelRows.every((row) => uploadedMap[row.mapping_uuid]);
        if (!isFilled) {
          setError(`Please complete ${requiredLevel} before adding ${activeLevel}`);
          return;
        }
      }
    }

    setLoading(true);
    setGlobalLoading(true);
    setError("");

    try {
      let nextUploadedMap = { ...uploadedMap };
      let hasAnyChange = false;

      for (const row of activeRows) {
        const file = files[row.mapping_uuid];
        const existing = nextUploadedMap[row.mapping_uuid];

        if (!file && !existing) continue;

        const payload = new FormData();
        payload.append("mapping_uuid", row.mapping_uuid);
        payload.append("user_uuid", userUuid);
        payload.append("institution_name", form.institution_name);
        payload.append("specialization", form.specialization);
        payload.append("year_of_passing", form.year_of_passing);
        payload.append("percentage_cgpa", form.percentage_cgpa);
        payload.append("degree_uuid", form.degree_uuid);
        payload.append("institute_location", form.institute_location);
        payload.append("education_mode", form.education_mode);
        payload.append("start_year", form.start_year);
        if (form.delay_reason?.trim()) payload.append("delay_reason", form.delay_reason);
        if (file) payload.append("file", file);

        if (!existing) {
          hasAnyChange = true;
          const saved: UploadedDoc = await createEducationDocument(base, payload);
          nextUploadedMap = { ...nextUploadedMap, [row.mapping_uuid]: saved };
          toast.success("Education documents saved successfully");
        } else if (hasEducationChanged(existing, form, file)) {
          hasAnyChange = true;
          const updated: UploadedDoc = await updateEducationDocument(base, existing.document_uuid, payload);
          nextUploadedMap = { ...nextUploadedMap, [row.mapping_uuid]: updated };
          toast.success("Education documents updated successfully");
        }
      }

      if (!hasAnyChange) toast.success("No changes recorded",{ icon: "ℹ️" });

      setUploadedMap(nextUploadedMap);

      setEducationDetails((prev) => {
        const filtered = prev.filter((e) => e.education_name !== activeLevel);
        const nextDraft: Education = normalizeDraft({
          education_name: activeLevel!,
          institution_name: form.institution_name,
          specialization: form.specialization,
          year_of_passing: form.year_of_passing,
          percentage_cgpa: form.percentage_cgpa,
          degree_uuid: form.degree_uuid,
          institute_location: form.institute_location,
          education_mode: form.education_mode,
          start_year: form.start_year,
          delay_reason: form.delay_reason,
          documents: activeRows.map((row) => ({
            document_name: row.document_name,
            file_path: nextUploadedMap[row.mapping_uuid]?.file_path,
          })),
        });
        return [...filtered, nextDraft];
      });

      setActiveLevel(null);
      setFiles({});
    } catch {
      setError("Failed to save documents. Please try again.");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="relative mx-auto max-w-6xl rounded-[2.5rem] bg-white/80 backdrop-blur-2xl p-10 md:p-16 shadow-2xl border border-white/50">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Onboarding Step 4</span>
            <div className="h-px w-8 bg-indigo-100"></div>
          </div>
          <h2 className="text-4xl font-black text-indigo-950 tracking-tight">
            {activeLevel ? (
              <span className="flex items-center gap-3">
                Education
                <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-indigo-600">{activeLevel}</span>
              </span>
            ) : (
              "Education Details"
            )}
          </h2>
          <p className="mt-4 text-indigo-600/70 font-medium">
            {activeLevel 
              ? `Please provide the specific details and documents for your ${activeLevel.toLowerCase()} education.`
              : "Tell us about your academic background and upload your relevant certificates."}
          </p>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError("")} />}

        {!activeLevel ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <EducationTimeline
              grouped={grouped}
              uploadedMap={uploadedMap}
              draftByLevel={draftByLevel}
              degrees={degrees}
              onOpenLevel={openLevel}
            />
          </div>
        ) : (
          <EducationModal
            activeLevel={activeLevel}
            form={form}
            degrees={
              activeLevel
                ? degrees.filter(
                    (d) => !d.education_name || d.education_name.toLowerCase() === activeLevel.toLowerCase()
                  )
                : []
            }
            activeRows={activeRows}
            files={files}
            uploadedMap={uploadedMap}
            error={error}
            loading={loading}
            onFormChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            onFileChange={(mappingUuid, file) => setFiles((prev) => ({ ...prev, [mappingUuid]: file }))}
            onCancel={() => setActiveLevel(null)}
            onSave={handleSave}
          />
        )}

        {!activeLevel && (
          <div className="mt-16 flex items-center justify-between pt-10 border-t border-indigo-50">
            <Button
              variant="secondary"
              onClick={() => {
                if (!!searchParams.get("edit")) {
                  router.push(`/onboarding/${token}/preview-page`);
                } else {
                  router.push(`/onboarding/${token}/identity-documents`);
                }
              }}
              className="px-8 py-4 text-sm font-bold tracking-wide"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous Step
              </span>
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!!searchParams.get("edit")) {
                  router.push(`/onboarding/${token}/preview-page`);
                } else {
                  router.push(`/onboarding/${token}/experience-details`);
                }
              }}
              className="px-10 py-4 text-sm font-bold shadow-indigo-200 shadow-lg tracking-wide group"
            >
              <span className="flex items-center gap-2">
                Save & Continue
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
