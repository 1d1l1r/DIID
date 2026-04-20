export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function maskCardNumber(num: string): string {
  const clean = num.replace(/\s/g, '')
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ')
}
