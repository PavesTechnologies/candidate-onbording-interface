import type { DegreeMaster, EducationLevel, MappingRow, UploadedDoc } from "./types";
import { API_CONFIG } from "@/app/utils/apiConfig";

export const fetchUserUuid = async (token: string) => {
  const res = await fetch(`${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/token-verification/${token}`);
  return res.json() as Promise<string>;
};

export const fetchEducationMapping = async (
  countryUuid: string,
) => {
  const res = await fetch(`${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/education/country-mapping/${countryUuid}`);
  const data = await res.json();
  return Array.isArray(data) ? (data as MappingRow[]) : [];
};

export const fetchEducationLevel = async () => {
  const res = await fetch(
    `${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/masters/education-level`
  );

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error("Failed to load education levels");
  }

  const data = await res.json();
  const value = data.value || data;

  return Array.isArray(value) ? value : [];
};


export const fetchDegreeMaster = async (education_uuid: string) => {
  const url = `${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/education/degree-master/${education_uuid}`;
  
  console.log("Calling Degree API:", url);

  const res = await fetch(url);

  console.log("Status:", res.status);

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to load degree master data for ${education_uuid}`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) return [];

  const uniqueDegrees = Array.from(
    new Map(data.map((d: DegreeMaster) => [d.degree_uuid, d])).values()
  );

  return uniqueDegrees as DegreeMaster[];
};


export const createEducationDocument = async (
  payload: FormData,
) => {
  const res = await fetch(`${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/education/employee-education-document`, {
    method: "POST",
    body: payload,
  });

  if (!res.ok) throw new Error("Create failed");

  return res.json() as Promise<UploadedDoc>;
};

export const updateEducationDocument = async (
  document_uuid: string,
  payload: FormData,
) => {
  const res = await fetch(
    `${API_CONFIG.EMPLOYEE_ONBOARDING_URL}/education/employee-education-document/${document_uuid}`,
    { method: "PUT", body: payload },
  );

  if (!res.ok) throw new Error("Update failed");

  return res.json() as Promise<UploadedDoc>;
};
