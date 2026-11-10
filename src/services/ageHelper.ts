import { Language } from '../types';

export const calculateAgeFromDobDetailed = (dobString: string, language: Language, t: any): string => {
  if (!dobString) return '';

  const today = new Date();

  // If it's a clean 4-digit birth-year
  if (/^\d{4}$/.test(dobString)) {
    const birthYear = parseInt(dobString, 10);
    const ageVal = today.getFullYear() - birthYear;
    if (ageVal < 0) return '';
    return `${ageVal} ${t.yearsOld || 'years'}`;
  }

  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return '';

  // Precise calculations of differences
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    // Borrow days from the previous month
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  if (years >= 1) {
    return `${years} ${t.yearsOld || 'years'}`;
  } else {
    // Under 1 year old: show months and days
    if (language === 'ar') {
      if (months === 0) {
        return `${days} يوم`;
      }
      if (days === 0) {
        return `${months} أشهر`;
      }
      return `${months} أشهر و ${days} يوم`;
    } else if (language === 'ku') {
      if (months === 0) {
        return `${days} ڕۆژ`;
      }
      if (days === 0) {
        return `${months} مانگ`;
      }
      return `${months} مانگ و ${days} ڕۆژ`;
    } else {
      const monthStr = months === 1 ? 'month' : 'months';
      const dayStr = days === 1 ? 'day' : 'days';
      if (months === 0) {
        return `${days} ${dayStr}`;
      }
      if (days === 0) {
        return `${months} ${monthStr}`;
      }
      return `${months} ${monthStr} and ${days} ${dayStr}`;
    }
  }
};

/**
 * Parses detailed parts back to YYYY-MM-DD string
 */
export const buildBirthdateString = (year: number, month: number, day: number): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
};
