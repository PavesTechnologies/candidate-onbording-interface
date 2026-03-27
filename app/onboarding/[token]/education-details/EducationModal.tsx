"use client";

import { useEffect } from "react";
import type { CommonForm, DegreeMaster, MappingRow, UploadedDoc } from "./types";
import { EDUCATION_DURATION } from "./constants";
import { FormField, TextInput, SelectInput } from "@/app/components/onboarding/FormComponents";
import { Button } from "@/app/components/onboarding/ButtonComponents";

type EducationModalProps = {
  activeLevel: string | null;
  form: CommonForm;
  degrees: DegreeMaster[];
  activeRows: MappingRow[];
  files: Record<string, File | null>;
  uploadedMap: Record<string, UploadedDoc>;
  error: string;
  loading: boolean;
  onFormChange: (patch: Partial<CommonForm>) => void;
  onFileChange: (mappingUuid: string, file: File) => void;
  onCancel: () => void;
  onSave: () => void;
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

export default function EducationModal({
  activeLevel,
  form,
  degrees,
  activeRows,
  files,
  uploadedMap,
  error,
  loading,
  onFormChange,
  onFileChange,
  onCancel,
  onSave,
}: EducationModalProps) {
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

  useEffect(() => {
    if (!shouldShowDelayReason && form.delay_reason) {
      onFormChange({ delay_reason: "" });
    }
  }, [shouldShowDelayReason, form.delay_reason, onFormChange]);

  if (!activeLevel) return null;

  return (
    <div className="mt-8 pt-8 border-t border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-indigo-50/50 rounded-2xl p-8 border border-indigo-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-[#1e3a8a] rounded-full"></span>
            {activeLevel} – Details
          </h3>
          <button
            onClick={onCancel}
            className="text-sm font-bold text-[#1e3a8a] hover:text-blue-800 transition-colors uppercase tracking-widest"
          >
            Cancel Edit
          </button>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField label="Degree" required>
              <SelectInput
                value={form.degree_uuid}
                onChange={(e) => onFormChange({ degree_uuid: e.target.value })}
                placeholder="Select Degree"
              >
                {degrees.map((d) => (
                  <option key={d.degree_uuid} value={d.degree_uuid}>
                    {d.degree_name}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Specialization" required>
              <TextInput
                placeholder="e.g. Computer Science"
                value={form.specialization}
                onChange={(e) => onFormChange({ specialization: e.target.value })}
              />
            </FormField>

            <FormField label="Institute Name" required>
              <TextInput
                placeholder="Collage / School Name"
                value={form.institution_name}
                onChange={(e) => onFormChange({ institution_name: e.target.value })}
              />
            </FormField>

            <FormField label="Institute Location" required>
              <TextInput
                placeholder="City, State"
                value={form.institute_location}
                onChange={(e) => onFormChange({ institute_location: e.target.value })}
              />
            </FormField>

            <FormField label="Start Year" required>
              <TextInput
                type="number"
                placeholder="YYYY"
                value={form.start_year}
                onChange={(e) => onFormChange({ start_year: e.target.value })}
              />
            </FormField>

            <FormField label="Year of Passing" required>
              <TextInput
                type="number"
                placeholder="YYYY"
                value={form.year_of_passing}
                onChange={(e) => onFormChange({ year_of_passing: e.target.value })}
              />
            </FormField>

            <FormField label="Education Mode" required>
              <SelectInput
                value={form.education_mode}
                onChange={(e) => onFormChange({ education_mode: e.target.value })}
                placeholder="Select Mode"
              >
                <option value="Regular">Regular</option>
                <option value="Distance">Distance</option>
                <option value="Part Time">Part time</option>
                <option value="Online">Online</option>
              </SelectInput>
            </FormField>

            <FormField label="Percentage / CGPA" required>
              <TextInput
                type="number"
                step="0.01"
                placeholder="e.g. 85 or 8.5"
                value={form.percentage_cgpa}
                onChange={(e) => onFormChange({ percentage_cgpa: e.target.value })}
              />
            </FormField>
          </div>

          {shouldShowDelayReason && (
            <FormField label="Reason for Delay" required>
              <TextInput
                placeholder="Please explain the reason for delay..."
                value={form.delay_reason}
                onChange={(e) => onFormChange({ delay_reason: e.target.value })}
              />
            </FormField>
          )}

          <div className="pt-6 border-t border-indigo-100">
            <h4 className="mb-6 text-xs font-bold text-indigo-400 uppercase tracking-widest">Required Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRows.map((row) => {
                const existingFile = files[row.mapping_uuid];
                const uploadedDoc = uploadedMap[row.mapping_uuid];
                const uploadedName = uploadedDoc?.file_path?.split("/").pop();
                const hasFile = existingFile || uploadedName;

                return (
                  <div key={row.mapping_uuid} className="p-4 rounded-xl bg-white border border-indigo-50 shadow-sm">
                    <label className="mb-3 block text-sm font-bold text-indigo-900">
                      {row.document_name}
                      {row.is_mandatory && <span className="ml-1 text-red-500">*</span>}
                    </label>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex-1 flex items-center px-3 py-2 bg-blue-50 border-blue-100 text-[#1e3a8a] hover:bg-blue-100 transition-all text-xs font-bold shadow-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 16l-4-4m0 0l-4 4m4-4v12" />
                          </svg>
                          {hasFile ? "Change File" : "Choose File"}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onFileChange(row.mapping_uuid, file);
                            }}
                          />
                        </label>

                        {hasFile && (
                          <button
                            type="button"
                            onClick={() => openDocumentInNewTab(existingFile || undefined, uploadedDoc?.file_path)}
                            className="p-2 text-[#1e3a8a] bg-white border-blue-100 hover:bg-blue-50 rounded-lg transition-all shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-indigo-400 font-medium truncate italic px-1">
                        {existingFile ? existingFile.name : uploadedName || "No file uploaded"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {error && <p className="mt-6 text-sm font-bold text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>}

        <div className="mt-10 flex justify-end gap-4 pt-8 border-t border-indigo-100">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave} loading={loading} disabled={loading} className="px-10">
            {loading ? "Saving..." : "Save Education Details"}
          </Button>
        </div>
      </div>
    </div>
  );
}
