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

interface IdentityType {
  mapping_uuid: string;
  identity_type_uuid: string;
  identity_type_name: string;
  is_mandatory: boolean;
}

interface IdentityDocument {
  mapping_uuid: string;
  identity_uuid?: string;
  identity_type_uuid: string;
  identity_type_name: string;
  identity_file_number: string;
  file?: File;
  file_path?: string;
}

interface IdentityDraft {
  country_uuid: string;
  documents: IdentityDocument[];
}

const isBrowserFile = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

/* ===================== COMPONENT ===================== */

export default function IdentityDocumentsPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLoading: setGlobalLoading } = useGlobalLoading();

  const [countries, setCountries] = useState<Country[]>([]);
  const [identityTypes, setIdentityTypes] = useState<IdentityType[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [draft, setDraft] = useLocalStorageForm<IdentityDraft>(
    `identity-details-${token}`,
    { country_uuid: "", documents: [] }
  );

  const selectedCountry = draft.country_uuid;
  const documents = draft.documents;

  const [originalDraft, setOriginalDraft] = useState<IdentityDraft | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);

  const snapshotDoneRef = useRef(false);

  /* ===================== FETCH COUNTRIES ===================== */

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/country`)
      .then((res) => res.json())
      .then((data: Country[]) =>
        setCountries((Array.isArray(data) ? data : []).filter((c) => c.is_active))
      )
      .catch(() => setError("Unable to load countries"));
  }, []);

  /* ===================== FETCH IDENTITY TYPES ===================== */

  useEffect(() => {
    if (!selectedCountry) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/identity/country-mapping/identities/${selectedCountry}`
    )
      .then((res) => res.json())
      .then((data) => setIdentityTypes(Array.isArray(data) ? data : []))
      .catch(() => setError("Unable to load identity documents"));
  }, [selectedCountry]);

  /* ===================== PREFILL MERGE ===================== */

  useEffect(() => {
    if (!identityTypes.length) return;

    setDraft((prev) => {
      const merged = identityTypes.map((type) => {
        const stored = prev.documents.find(
          (d) => d.identity_type_uuid === type.identity_type_uuid
        );

        return stored
          ? {
              ...stored,
              mapping_uuid: type.mapping_uuid,
              file: isBrowserFile(stored.file) ? stored.file : undefined,
            }
          : {
              mapping_uuid: type.mapping_uuid,
              identity_type_uuid: type.identity_type_uuid,
              identity_type_name: type.identity_type_name,
              identity_file_number: "",
              file_path: undefined,
            };
      });

      if (JSON.stringify(prev.documents) === JSON.stringify(merged)) return prev;

      return { ...prev, documents: merged };
    });
  }, [identityTypes, setDraft]);

  /* ===================== SNAPSHOT ONCE ===================== */

  useEffect(() => {
    if (!token) return;
    if (snapshotDoneRef.current) return;

    if (draft.documents.length > 0) {
      snapshotDoneRef.current = true;
      setOriginalDraft(JSON.parse(JSON.stringify(draft)));
    }
  }, [token, draft]);

  /* ===================== FETCH USER UUID ONCE ===================== */

  useEffect(() => {
    if (!token || userUuid) return;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/token-verification/${token}`
        );
        if (!res.ok) return;
        setUserUuid(await res.json());
      } catch {}
    })();
  }, [token, userUuid]);

  /* ===================== FILE HANDLING ===================== */

  const handleFileChange = (identityType: IdentityType, file?: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be less than 5 MB");
      return;
    }

    setDraft((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.identity_type_uuid === identityType.identity_type_uuid
          ? { ...d, file, mapping_uuid: identityType.mapping_uuid }
          : d
      ),
    }));

    // Clear error for this field
    if (fieldErrors[identityType.identity_type_uuid + "_file"]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[identityType.identity_type_uuid + "_file"];
        return next;
      });
    }
  };

  const handleIdentityNumberChange = (
    identityType: IdentityType,
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.identity_type_uuid === identityType.identity_type_uuid
          ? { ...d, identity_file_number: value, mapping_uuid: identityType.mapping_uuid }
          : d
      ),
    }));

    // Clear error for this field
    if (fieldErrors[identityType.identity_type_uuid]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[identityType.identity_type_uuid];
        return next;
      });
    }
  };

  /* ===================== OPEN IN NEW TAB ===================== */

  const openDocumentInNewTab = (file?: File, filePath?: string) => {
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else if (filePath) {
      window.open(filePath, "_blank");
    }
  };

  /* ===================== CHANGE DETECTION ===================== */

  const hasChanges = () => {
    if (!originalDraft) return true;

    for (const doc of documents) {
      const old = originalDraft.documents.find(
        (d) => d.identity_type_uuid === doc.identity_type_uuid
      );
      if (!old) return true;
      if (old.identity_file_number !== doc.identity_file_number) return true;
      if (isBrowserFile(doc.file)) return true;
    }
    return false;
  };

  /* ===================== CONTINUE ===================== */

  const handleContinue = async () => {
    setLoading(true);
    setGlobalLoading(true);
    setError("");

    const newErrors: Record<string, string> = {};
    const mandatoryDocs = identityTypes.filter((d) => d.is_mandatory);

    for (const type of mandatoryDocs) {
      const doc = documents.find(
        (d) => d.identity_type_uuid === type.identity_type_uuid
      );

      if (!doc?.identity_file_number?.trim()) {
        newErrors[type.identity_type_uuid] = errorMessages.REQUIRED;
      }

      const hasFile = isBrowserFile(doc?.file) || doc?.file_path || doc?.identity_uuid;
      if (!hasFile) {
        newErrors[type.identity_type_uuid + "_file"] = "File upload is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      toast.error("Please complete all mandatory fields and uploads");
      setLoading(false);
      setGlobalLoading(false);
      return;
    }

    try {
      if (!userUuid) throw new Error("User UUID not found");

      if (!hasChanges()) {
        toast("No changes detected", { icon: "ℹ️" });
        if (!!searchParams.get("edit")) {
          router.push(`/onboarding/${token}/preview-page`);
        } else {
          router.push(`/onboarding/${token}/education-details`);
        }
        return;
      }

      for (const doc of documents) {
        // Skip if nothing changed for this specific document and it's already saved
        const old = originalDraft?.documents.find(d => d.identity_type_uuid === doc.identity_type_uuid);
        if (old && old.identity_file_number === doc.identity_file_number && !isBrowserFile(doc.file)) {
          continue;
        }

        const form = new FormData();
        form.append("mapping_uuid", doc.mapping_uuid);
        form.append("user_uuid", userUuid);
        form.append("identity_file_number", doc.identity_file_number);
        if (isBrowserFile(doc.file)) form.append("file", doc.file);

        const endpoint = doc.identity_uuid
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/identity-documents/${doc.identity_uuid}`
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-upload/identity-documents`;

        const res = await fetch(endpoint, {
          method: doc.identity_uuid ? "PUT" : "POST",
          body: form,
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        setDraft((prev) => ({
          ...prev,
          documents: prev.documents.map((d) =>
            d.identity_type_uuid === doc.identity_type_uuid
              ? {
                  ...d,
                  identity_uuid: data.identity_uuid ?? d.identity_uuid,
                  file_path: data.file_path ?? d.file_path,
                  file: undefined,
                }
              : d
          ),
        }));
      }

      toast.success("Identity documents saved successfully");
      if (!!searchParams.get("edit")) {
        router.push(`/onboarding/${token}/preview-page`);
      } else {
        router.push(`/onboarding/${token}/education-details`);
      }
    } catch {
      toast.error("Failed to save identity documents");
      setError("Failed to save identity documents");
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
            <h2 className="text-2xl font-bold text-[#1e3a8a]">Identity Documents</h2>
            <p className="text-sm text-gray-500 mt-1">Please upload your KYC and identity verification documents</p>
          </div>
          <div className="hidden sm:block">
            <span className="bg-blue-50 text-[#1e3a8a] text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
              Step 3 of 6
            </span>
          </div>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError("")} />}

        <div className="space-y-6">
          <FormField label="Issuing Country" required className="max-w-md">
            <SelectInput
              value={selectedCountry}
              onChange={(e) => {
                setDraft({
                  country_uuid: e.target.value,
                  documents: [],
                });
                setOriginalDraft(null);
                snapshotDoneRef.current = false;
              }}
              placeholder="Select Country"
            >
              {countries.map((c) => (
                <option key={c.country_uuid} value={c.country_uuid}>
                  {c.country_name}
                </option>
              ))}
            </SelectInput>
          </FormField>

          {selectedCountry && identityTypes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100">
              {identityTypes
                .filter((doc) => doc.is_mandatory)
                .map((doc) => {
                  const currentDoc = documents.find(
                    (d) => d.identity_type_uuid === doc.identity_type_uuid
                  );
                  const hasFile = isBrowserFile(currentDoc?.file) || currentDoc?.file_path;
                  const fileName = isBrowserFile(currentDoc?.file) 
                    ? currentDoc.file.name 
                    : currentDoc?.file_path?.split("/").pop() || "Uploaded file";

                  return (
                    <div key={doc.identity_type_uuid} className="p-4 rounded-xl border border-indigo-50 bg-indigo-50/30 space-y-4">
                      <h4 className="font-semibold text-indigo-900 flex items-center justify-between">
                        {doc.identity_type_name}
                        {doc.is_mandatory && <span className="text-xs font-normal text-indigo-500">(Mandatory)</span>}
                      </h4>
                      
                      <FormField label={`${doc.identity_type_name} Number`} required error={fieldErrors[doc.identity_type_uuid]}>
                        <TextInput
                          placeholder={`Enter ${doc.identity_type_name} Number`}
                          value={currentDoc?.identity_file_number || ""}
                          onChange={(e) => handleIdentityNumberChange(doc, e.target.value)}
                          error={fieldErrors[doc.identity_type_uuid] ? "true" : ""}
                        />
                      </FormField>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-indigo-900">Upload Document</label>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center justify-center px-4 py-2 bg-[#1e3a8a] hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 16l-4-4m0 0l-4 4m4-4v12" />
                            </svg>
                            Choose File
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileChange(doc, e.target.files?.[0])}
                            />
                          </label>
                          
                          {hasFile && (
                            <button
                              type="button"
                              onClick={() => openDocumentInNewTab(isBrowserFile(currentDoc?.file) ? currentDoc.file : undefined, currentDoc?.file_path)}
                              className="flex items-center px-3 py-2 text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors text-sm font-medium"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                          )}
                        </div>
                        {hasFile ? (
                          <p className="text-xs text-[#1e3a8a] truncate max-w-xs">{fileName}</p>
                        ) : fieldErrors[doc.identity_type_uuid + "_file"] ? (
                          <p className="text-xs text-red-500">{fieldErrors[doc.identity_type_uuid + "_file"]}</p>
                        ) : (
                          <p className="text-xs text-gray-500">No file chosen (Max 5MB)</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {selectedCountry && identityTypes.length === 0 && (
            <div className="text-center py-12 bg-indigo-50/30 rounded-2xl border border-dashed border-indigo-200">
              <p className="text-[#1e3a8a] italic">No identity documents required for this country.</p>
            </div>
          )}

          {!selectedCountry && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 italic">Please select a country to view required documents.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-indigo-100">
            <Button
              variant="secondary"
              onClick={() => {
                if (!!searchParams.get("edit")) {
                  router.push(`/onboarding/${token}/preview-page`);
                } else {
                  router.push(`/onboarding/${token}/address-details`);
                }
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleContinue}
              loading={loading}
              disabled={loading || !selectedCountry}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
