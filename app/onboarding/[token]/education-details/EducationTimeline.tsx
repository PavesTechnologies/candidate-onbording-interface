"use client";

import { useState, useRef, useEffect } from "react";
import { isEmptyValue } from "./educationUtils";
import type { DegreeMaster, Education, MappingRow, UploadedDoc } from "./types";

type EducationTimelineProps = {
  grouped: Record<string, MappingRow[]>;
  uploadedMap: Record<string, UploadedDoc>;
  draftByLevel: Record<string, Education>;
  degrees: DegreeMaster[];
  onOpenLevel: (level: string) => void;
};

export default function EducationTimeline({
  grouped,
  uploadedMap,
  draftByLevel,
  degrees,
  onOpenLevel,
}: EducationTimelineProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addedLevels = Object.entries(grouped).filter(([level, rows]) => {
    const draft = draftByLevel[level];
    const uploadedDocs = rows
      .map((r) => uploadedMap[r.mapping_uuid])
      .filter(Boolean);

    const anyFieldFilled = draft
      ? !isEmptyValue(draft.institution_name) ||
        !isEmptyValue(draft.specialization) ||
        !isEmptyValue(draft.year_of_passing) ||
        !isEmptyValue(draft.percentage_cgpa)
      : false;

    // A level is added if it has form data or uploaded documents
    return draft || uploadedDocs.length > 0 || anyFieldFilled;
  });

  const availableLevels = Object.keys(grouped).filter(
    (level) => !addedLevels.find(([l]) => l === level)
  );

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {addedLevels.map(([level, rows], arrayIndex) => {
        const draft = draftByLevel[level];
        const uploadedDocs = rows
          .map((r) => uploadedMap[r.mapping_uuid])
          .filter(Boolean);

        const commonFilledInStorage = draft
          ? !isEmptyValue(draft.institution_name) &&
            !isEmptyValue(draft.specialization) &&
            !isEmptyValue(draft.year_of_passing) &&
            !isEmptyValue(draft.percentage_cgpa) &&
            !isEmptyValue(draft.degree_uuid) &&
            !isEmptyValue(draft.institute_location) &&
            !isEmptyValue(draft.education_mode) &&
            !isEmptyValue(draft.start_year)
          : false;

        const requiredDocsComplete = rows.every(
          (row) => !row.is_mandatory || uploadedMap[row.mapping_uuid],
        );

        const showExpandedDetails = commonFilledInStorage;
        const completed = commonFilledInStorage && requiredDocsComplete;

        const anyFieldFilled = draft
          ? !isEmptyValue(draft.institution_name) ||
            !isEmptyValue(draft.specialization) ||
            !isEmptyValue(draft.year_of_passing) ||
            !isEmptyValue(draft.percentage_cgpa)
          : false;

        const anyDocsUploaded = uploadedDocs.length > 0;
        const inProgress = (anyFieldFilled || anyDocsUploaded) && !completed;

        return (
          <div key={level} className="flex gap-8 group">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                  completed
                    ? "bg-green-500 text-white shadow-green-100"
                    : showExpandedDetails
                      ? "bg-amber-500 text-white shadow-amber-100"
                      : inProgress
                        ? "bg-[#1e3a8a] text-white shadow-blue-100"
                        : "bg-indigo-50 text-indigo-300 border border-indigo-100"
                }`}
              >
                {completed ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-black">{arrayIndex + 1}</span>
                )}
              </div>
              {(arrayIndex !== addedLevels.length - 1 || availableLevels.length > 0) && (
                <div
                  className={`w-1 flex-1 mt-4 rounded-full transition-all duration-500 ${
                    completed ? "bg-green-200" : showExpandedDetails ? "bg-amber-200" : "bg-indigo-50"
                  }`}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-3xl border border-indigo-50 p-6 md:p-8 shadow-sm group-hover:shadow-md transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-950 capitalize tracking-tight">{level}</h3>
                    <div className="mt-2 flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${
                        completed ? "bg-green-500" : inProgress ? "bg-indigo-500" : "bg-indigo-200"
                      }`}></span>
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        {completed
                          ? "Verified & Complete"
                          : showExpandedDetails
                            ? "Details Saved - Documents Missing"
                            : inProgress
                              ? "In Progress"
                              : "Actions Required"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenLevel(level)}
                    className="self-start px-6 py-2 bg-blue-50 hover:bg-[#1e3a8a] text-[#1e3a8a] hover:text-white border-blue-100 hover:border-[#1e3a8a] shadow-sm transition-all duration-300"
                  >
                    {completed ? "Update Info" : "Add Details"}
                  </button>
                </div>

                {showExpandedDetails && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 animate-in fade-in duration-500">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Institute</p>
                      <p className="text-sm font-semibold text-indigo-900 truncate">
                        {draft?.institution_name || "-"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Degree</p>
                      <p className="text-sm font-semibold text-indigo-900 truncate">
                        {(() => {
                          const uuid = draft?.degree_uuid;
                          if (!uuid) return "-";
                          const degree = degrees.find((d) => d.degree_uuid === uuid);
                          return degree ? degree.degree_name : uuid;
                        })()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Passing Year</p>
                      <p className="text-sm font-semibold text-indigo-900">
                        {draft?.year_of_passing || "-"}
                      </p>
                    </div>

                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 pt-4 border-t border-indigo-50">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Stored Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {rows.map((row) => {
                          const doc = uploadedMap[row.mapping_uuid];
                          return (
                            <div
                              key={row.mapping_uuid}
                              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 transition-colors ${
                                doc 
                                  ? "bg-green-50 border-green-100 text-green-700" 
                                  : "bg-indigo-50 border-indigo-100 text-indigo-400 italic"
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${doc ? "bg-green-500" : "bg-indigo-200"}`}></div>
                              {row.document_name}
                              {doc && (
                                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {availableLevels.length > 0 && (
        <div className="flex gap-8 relative items-center">
          <div className="flex flex-col items-center">
             <div className="w-10 h-10 rounded-2xl bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
             </div>
          </div>
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-8 py-3 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-[1.25rem] text-sm font-bold shadow-blue-100 shadow-xl transition-all duration-300 flex items-center gap-3 active:scale-95"
            >
              Add New Education Level
              <svg className={`w-4 h-4 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDropdown && (
              <div className="absolute left-0 mt-4 w-64 origin-top-left rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="p-2 space-y-1">
                  {availableLevels.map((level) => (
                    <button
                      key={level}
                      className="flex items-center w-full text-left px-5 py-3 text-sm font-bold text-indigo-900 hover:bg-indigo-50 rounded-2xl transition-all group"
                      onClick={() => {
                        setShowDropdown(false);
                        onOpenLevel(level);
                      }}
                    >
                      <span className="capitalize">{level}</span>
                      <svg className="w-4 h-4 ml-auto text-indigo-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

  );
}
