export function formatPrice(cents: number, currency = 'USD') {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
