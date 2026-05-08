import { steps } from "./steps";

type IdentityDocument = {
  identity_file_number?: string;
  file_path?: string;
  identity_uuid?: string;
};

export function getCompletedSteps(token: string): boolean[] {
  function checkStepCompletion(index: number): boolean {
    if (steps[index].path === "preview-page") {
      return [0, 1, 2, 3, 4, 5].every((idx) => checkStepCompletion(idx));
    }

    if (steps[index].path === "success") return false;

    let keyPart = steps[index].path;
    if (keyPart === "identity-documents") keyPart = "identity-details";

    const data = localStorage.getItem(`${keyPart}-${token}`);
    if (!data) return false;

    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed.length > 0;

      if (typeof parsed === "object" && parsed !== null) {
        if (steps[index].path === "personal-details") {
          return !!(parsed.first_name && parsed.date_of_birth);
        }

        if (steps[index].path === "address-details") {
          return !!(parsed.permanent?.address_line1 && parsed.permanent?.city);
        }

        if (steps[index].path === "identity-documents") {
          return (
            Array.isArray(parsed.documents) &&
            parsed.documents.length > 0 &&
            parsed.documents.some(
              (d: IdentityDocument) =>
                d.identity_file_number && (d.file_path || d.identity_uuid)
            )
          );
        }

        if (steps[index].path === "bank-pf-details") {
          const bank = "bank" in parsed ? parsed.bank : parsed;
          return !!(
            bank?.account_holder_name &&
            bank?.bank_name &&
            bank?.account_number &&
            bank?.ifsc_code &&
            bank?.account_type
          );
        }

        return Object.keys(parsed).length > 0;
      }

      return !!parsed;
    } catch {
      return !!data;
    }
  }

  return steps.map((_, index) => checkStepCompletion(index));
}
