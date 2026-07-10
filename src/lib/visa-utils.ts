import { differenceInDays, format } from "date-fns";

/**
 * Calculate the number of days until a visa expires.
 * Returns negative values if already expired.
 */
export function calculateDaysUntilExpiry(expiryDate: Date | string): number {
  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return differenceInDays(expiry, today);
}

/**
 * Determine visa status from the expiry date.
 * - EXPIRED: already past expiry
 * - EXPIRING_SOON: within 60 days of expiry
 * - VALID: more than 60 days until expiry
 * - PENDING_RENEWAL: returned as-is if explicitly set
 */
export function getVisaStatusFromExpiry(
  expiryDate: Date | string
): "VALID" | "EXPIRING_SOON" | "EXPIRED" {
  const days = calculateDaysUntilExpiry(expiryDate);
  if (days < 0) return "EXPIRED";
  if (days <= 60) return "EXPIRING_SOON";
  return "VALID";
}

/**
 * Get the progress percentage for the visa progress bar.
 * Maps days until expiry to a 0-100 scale:
 * - 0 days or less = 0%
 * - 365+ days = 100%
 */
export function formatVisaProgress(expiryDate: Date | string): number {
  const days = calculateDaysUntilExpiry(expiryDate);
  if (days <= 0) return 0;
  if (days >= 365) return 100;
  return Math.round((days / 365) * 100);
}

/**
 * Get the color class for the visa status progress bar.
 * - green: valid with 60+ days remaining
 * - yellow: expiring soon (14-60 days)
 * - red: expired or less than 14 days
 */
export function getVisaProgressColor(expiryDate: Date | string): string {
  const days = calculateDaysUntilExpiry(expiryDate);
  if (days < 14) return "bg-red-500";
  if (days <= 60) return "bg-yellow-500";
  return "bg-green-500";
}

/**
 * Get the text color class for visa status.
 */
export function getVisaStatusTextColor(status: string): string {
  switch (status) {
    case "VALID":
      return "text-green-700 bg-green-100";
    case "EXPIRING_SOON":
      return "text-yellow-700 bg-yellow-100";
    case "EXPIRED":
      return "text-red-700 bg-red-100";
    case "PENDING_RENEWAL":
      return "text-blue-700 bg-blue-100";
    default:
      return "text-gray-700 bg-gray-100";
  }
}

/**
 * Required documents by visa type.
 */
export function getRequiredDocuments(visaType: string): string[] {
  const commonDocs = [
    "Valid Passport",
    "Visa Application Form",
    "Passport-size Photo",
    "Proof of Financial Support",
  ];

  const visaTypeDocs: Record<string, string[]> = {
    "STUDENT_VISA": [
      ...commonDocs,
      "Certificate of Enrollment",
      "Academic Transcript",
      "Letter of Acceptance",
      "Medical Certificate",
      "Police Clearance",
    ],
    "EXCHANGE_VISA": [
      ...commonDocs,
      "Exchange Program Acceptance Letter",
      "Home University Endorsement",
      "Insurance Certificate",
      "Medical Certificate",
    ],
    "TOURIST_VISA": [
      ...commonDocs,
      "Travel Itinerary",
      "Hotel Reservation",
      "Return Ticket",
    ],
    "WORK_VISA": [
      ...commonDocs,
      "Employment Contract",
      "Company Registration",
      "Tax Identification",
      "Medical Certificate",
      "Police Clearance",
    ],
    "SPECIAL_STUDY_PERMIT": [
      ...commonDocs,
      "Certificate of Enrollment",
      "Notarized Affidavit of Support",
      "ACR I-Card",
      "Medical Certificate",
    ],
  };

  return visaTypeDocs[visaType] ?? commonDocs;
}

/**
 * Get predictive reminders based on days until expiry.
 * Returns relevant reminder messages for 60/30/14/7 day thresholds.
 */
export function getVisaReminders(
  expiryDate: Date | string
): Array<{ days: number; level: "info" | "warning" | "danger"; message: string }> {
  const days = calculateDaysUntilExpiry(expiryDate);
  const reminders: Array<{ days: number; level: "info" | "warning" | "danger"; message: string }> = [];
  const formattedDate = format(
    typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate,
    "MMMM d, yyyy"
  );

  if (days <= 0) {
    reminders.push({
      days: 0,
      level: "danger",
      message: `Your visa has expired! Please contact ISSO immediately to begin renewal proceedings.`,
    });
  } else if (days <= 7) {
    reminders.push({
      days: 7,
      level: "danger",
      message: `URGENT: Your visa expires in ${days} day${days === 1 ? "" : "s"} on ${formattedDate}. Immediate action required.`,
    });
  } else if (days <= 14) {
    reminders.push({
      days: 14,
      level: "danger",
      message: `Your visa expires in ${days} days on ${formattedDate}. Submit renewal documents immediately.`,
    });
  } else if (days <= 30) {
    reminders.push({
      days: 30,
      level: "warning",
      message: `Your visa expires in ${days} days on ${formattedDate}. Begin preparing your renewal documents.`,
    });
  } else if (days <= 60) {
    reminders.push({
      days: 60,
      level: "info",
      message: `Your visa expires in ${days} days on ${formattedDate}. Consider starting the renewal process soon.`,
    });
  }

  return reminders;
}

/**
 * Format visa type for display.
 */
export function formatVisaType(visaType: string): string {
  const types: Record<string, string> = {
    STUDENT_VISA: "Student Visa",
    EXCHANGE_VISA: "Exchange Visa",
    TOURIST_VISA: "Tourist Visa",
    WORK_VISA: "Work Visa",
    SPECIAL_STUDY_PERMIT: "Special Study Permit",
  };
  return types[visaType] ?? visaType.replace(/_/g, " ");
}

/**
 * Available visa types for selection.
 */
export const VISA_TYPES = [
  "STUDENT_VISA",
  "EXCHANGE_VISA",
  "TOURIST_VISA",
  "WORK_VISA",
  "SPECIAL_STUDY_PERMIT",
] as const;

export type VisaType = (typeof VISA_TYPES)[number];
