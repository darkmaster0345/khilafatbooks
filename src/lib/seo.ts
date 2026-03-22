/**
 * Truncates SEO description text to a safe length (max 160 characters)
 * while ensuring it doesn't cut off in the middle of a word.
 */
export function truncateDescription(text: string): string {
  if (!text) return '';
  if (text.length <= 160) return text;
  const cut = text.lastIndexOf(' ', 157);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, 157)) + '...';
}
