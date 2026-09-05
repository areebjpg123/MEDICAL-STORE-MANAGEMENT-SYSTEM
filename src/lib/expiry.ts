/**
 * Expiry helper for MM-YYYY format
 */

export interface ExpiryStatus {
  monthsRemaining: number;
  isExpiringSoon: boolean; // <= 7 months
  isExpired: boolean;
  label: string;
}

export function parseExpiryDate(expDate: string): ExpiryStatus {
  if (!expDate) {
    return { monthsRemaining: 999, isExpiringSoon: false, isExpired: false, label: "N/A" };
  }

  // Support MM-YYYY or MM/YYYY or YYYY-MM
  const cleanStr = expDate.trim().replace("/", "-");
  const parts = cleanStr.split("-");
  
  let month = 0;
  let year = 0;

  if (parts.length === 2) {
    if (parts[0].length === 4) {
      // YYYY-MM
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
    } else {
      // MM-YYYY
      month = parseInt(parts[0], 10) - 1;
      year = parseInt(parts[1], 10);
    }
  }

  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
    return { monthsRemaining: 999, isExpiringSoon: false, isExpired: false, label: expDate };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthsRemaining = (year - currentYear) * 12 + (month - currentMonth);
  const isExpired = monthsRemaining <= 0;
  const isExpiringSoon = monthsRemaining <= 7;

  let label = `${(month + 1).toString().padStart(2, "0")}-${year}`;
  if (isExpired) {
    label += " (Expired)";
  } else if (isExpiringSoon) {
    label += ` (${monthsRemaining} mos left)`;
  }

  return {
    monthsRemaining,
    isExpiringSoon,
    isExpired,
    label,
  };
}
