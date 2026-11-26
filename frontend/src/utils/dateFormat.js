/**
 * Utility formatting tanggal sistem ALSYFA: standar DD-MM-YYYY (contoh: 25-11-2026)
 */

function extractYMDParts(input) {
  if (!input) return null;

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    const yyyy = input.getFullYear();
    const mm = String(input.getMonth() + 1).padStart(2, '0');
    const dd = String(input.getDate()).padStart(2, '0');
    return { yyyy: String(yyyy), mm, dd };
  }

  const str = String(input).trim();
  if (!str) return null;

  // Already DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dmyMatch) {
    return { dd: dmyMatch[1], mm: dmyMatch[2], yyyy: dmyMatch[3] };
  }

  // ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return { yyyy: isoMatch[1], mm: isoMatch[2], dd: isoMatch[3] };
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return { yyyy: String(yyyy), mm, dd };
  }

  return null;
}

/**
 * Format tanggal ke DD-MM-YYYY (mis. 25-11-2026)
 */
export function formatDateID(input, fallback = '-') {
  const parts = extractYMDParts(input);
  if (!parts) return fallback;
  return `${parts.dd}-${parts.mm}-${parts.yyyy}`;
}

/**
 * Format tanggal & waktu ke DD-MM-YYYY HH:mm
 */
export function formatDateTimeID(input, fallback = '-') {
  if (!input) return fallback;
  const datePart = formatDateID(input, '');
  if (!datePart) return fallback;

  const str = String(input);
  const timeMatch = str.match(/[T\s](\d{2}:\d{2})/);
  if (timeMatch) {
    return `${datePart} ${timeMatch[1]}`;
  }
  return datePart;
}

/**
 * Format YYYY-MM menjadi MM-YYYY atau nama bulan Indonesia
 */
export function formatMonthYearID(monthStr) {
  if (!monthStr) return '-';
  const m = String(monthStr).match(/^(\d{4})-(\d{2})$/);
  if (!m) return monthStr;
  return `${m[2]}-${m[1]}`;
}

/**
 * Ambil tanggal hari ini lokal format YYYY-MM-DD (untuk nilai input[type="date"] & query API)
 */
export function getTodayISO() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Ambil bulan hari ini lokal format YYYY-MM (untuk nilai input[type="month"])
 */
export function getCurrentMonthISO() {
  return getTodayISO().substring(0, 7);
}
