/** Hanya URL https yang dipakai; nilai dari Firestore bisa saja berisi skema lain seperti javascript:. */
export function safeImageUrl(raw: string): string {
  const value = raw.trim();
  return value.toLowerCase().startsWith('https://') ? value : '';
}
