"use client";

import { useEffect, useState } from "react";
import type { DegreeMaster, MappingRow, UploadedDoc } from "./types";
import {
  fetchDegreeMaster,
  fetchEducationMapping,
  fetchEducationLevel,
  fetchUserUuid,
} from "./educationApi";

type UseEducationDataArgs = {
  base: string;
  token?: string;
  countryUuid: string;
  onError: (message: string) => void;
};

export const useEducationData = ({
  base,
  token,
  countryUuid,
  onError,
}: UseEducationDataArgs) => {
  const [rows, setRows] = useState<MappingRow[]>([]);
  const [uploadedMap, setUploadedMap] = useState<Record<string, UploadedDoc>>(
    {},
  );
  const [degrees, setDegrees] = useState<DegreeMaster[]>([]);
  const [userUuid, setUserUuid] = useState("");

  useEffect(() => {
    if (!token) return;

    fetchUserUuid(base, token)
      .then((uuid) => setUserUuid(uuid))
      .catch(() => onError("Invalid onboarding link"));
  }, [base, token, onError]);

  useEffect(() => {
    if (!countryUuid) return; // Skip if countryUuid is not loaded

    Promise.all([
      fetchEducationMapping(base, countryUuid),
      fetchEducationLevel()
    ])
      .then(async ([mappingData, educationLevelData]) => {
        setRows(mappingData);

        // Create a lookup map: education_name -> education_uuid
        const nameToUuidMap = new Map<string, string>();
        educationLevelData.forEach(edu => {
          if (edu.education_name && edu.education_uuid) {
            // Normalize case for matching
            nameToUuidMap.set(edu.education_name.trim().toLowerCase(), edu.education_uuid);
          }
        });

        // Extract unique education UUIDs from the mapping rows by looking up their names
        const educationMap = new Map<string, string>();
        mappingData.forEach(row => {
          if (row.education_name) {
            const normalizedName = row.education_name.trim().toLowerCase();
            const eduUuid = nameToUuidMap.get(normalizedName);
            if (eduUuid) {
              educationMap.set(eduUuid, row.education_name);
            } else {
              console.warn(`Could not find UUID for education level: ${row.education_name}`);
            }
          }
        });

        const uniqueUuids = Array.from(educationMap.keys());

        try {
          // Fetch degrees for all unique matched education levels
          const degreePromises = uniqueUuids.map(uuid =>
            fetchDegreeMaster(uuid).then(degrees =>
              // Attach education_name to each degree so the UI can filter them
              degrees.map(d => ({ ...d, education_name: educationMap.get(uuid) }))
            )
          );

          const results = await Promise.all(degreePromises);
          // Flatten array of arrays and filter active
          const allDegrees = results.flat().filter((d) => d.is_active !== false);
          setDegrees(allDegrees);
        } catch (error) {
          console.error("Failed to load degree data", error);
        }
      })
      .catch((error) => {
        console.error(error);
        onError("Failed to load education data");
      });
  }, [base, countryUuid, onError]);

  return {
    rows,
    uploadedMap,
    setUploadedMap,
    userUuid,
    degrees,
  };
};
