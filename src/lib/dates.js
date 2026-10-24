export const today = () => new Date().toLocaleDateString('en-CA')

export const formatKoreanDate = (date = new Date()) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date)

export function minutesOn(logs, date = today()) {
  return logs.filter((item) => item.date === date).reduce((sum, item) => sum + Number(item.minutes || 0), 0)
}

export function totalMinutes(logs) {
  return logs.reduce((sum, item) => sum + Number(item.minutes || 0), 0)
}

export function studyDays(logs) {
  return new Set(logs.map((item) => item.date)).size
}

export function weekDays(logs) {
  const labels = ['일', '월', '화', '수', '목', '금', '토']
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - 6 + index)
    const key = date.toLocaleDateString('en-CA')
    return {
      key,
      label: labels[date.getDay()],
      day: date.getDate(),
      done: logs.some((item) => item.date === key),
    }
  })
}

export function normalizeTime(value) {
  if (typeof value !== 'string' || value.length < 4) return '20:30'
  return value.slice(0, 5)
}
