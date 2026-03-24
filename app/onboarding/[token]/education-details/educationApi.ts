import type { DegreeMaster, EducationLevel, MappingRow, UploadedDoc } from "./types";

export const fetchUserUuid = async (base: string, token: string) => {
  const res = await fetch(`${base}/token-verification/${token}`);
  return res.json() as Promise<string>;
};

export const fetchEducationMapping = async (
  base: string,
  countryUuid: string,
) => {
  const res = await fetch(`${base}/education/country-mapping/${countryUuid}`);
  const data = await res.json();
  return Array.isArray(data) ? (data as MappingRow[]) : [];
};

export const fetchEducationLevel = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/masters/education-level`
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
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/education/degree-master/${education_uuid}`;
  
  console.log("Calling Degree API:", url); // 👈 add this

  const res = await fetch(url);

  console.log("Status:", res.status); // 👈 add this

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
  base: string,
  payload: FormData,
) => {
  const res = await fetch(`${base}/education/employee-education-document`, {
    method: "POST",
    body: payload,
  });

  if (!res.ok) throw new Error("Create failed");

  return res.json() as Promise<UploadedDoc>;
};

export const updateEducationDocument = async (
  base: string,
  document_uuid: string,
  payload: FormData,
) => {
  const res = await fetch(
    `${base}/education/employee-education-document/${document_uuid}`,
    { method: "PUT", body: payload },
  );

  if (!res.ok) throw new Error("Update failed");

  return res.json() as Promise<UploadedDoc>;
};
