export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date | null | undefined): string {
  if (!date) return '-';
  return date.toLocaleDateString('id-ID');
}

export function generateInvoiceNumber(date?: Date, existingInvs: string[] = []): string {
  const d = date ?? new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const prefix = `VK${yy}`;

  let max = 0;
  existingInvs.forEach((inv) => {
    if (typeof inv === 'string' && inv.startsWith(prefix)) {
      const num = parseInt(inv.slice(prefix.length), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    }
  });

  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}
