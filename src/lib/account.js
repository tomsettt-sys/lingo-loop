const ID_DOMAIN = 'id.lingoloop.app'

export function normalizeId(value) {
  return String(value || '').trim().toLowerCase()
}

export function validateId(value) {
  const id = normalizeId(value)
  if (!/^[a-z0-9_]{3,20}$/.test(id)) {
    return '아이디는 영문, 숫자, 밑줄만 사용해 3~20자로 만들어 주세요.'
  }
  return ''
}

export function idToEmail(value) {
  return `${normalizeId(value)}@${ID_DOMAIN}`
}

export function usernameFromUser(user) {
  if (!user) return ''
  const meta = user.user_metadata?.username
  if (typeof meta === 'string' && meta.trim()) return meta.trim()
  const email = user.email || ''
  const suffix = `@${ID_DOMAIN}`
  if (email.endsWith(suffix)) return email.slice(0, -suffix.length)
  return ''
}
