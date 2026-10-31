/** Date → "yyyy-MM-dd", the format the API uses for dates without time. */
export function toIsoDate(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "yyyy-MM-dd" → Date at local midnight (new Date("1995-04-12") would be UTC and can shift a day). */
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
