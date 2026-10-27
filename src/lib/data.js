import { defaultState } from './content'
import { normalizeTime } from './dates'
import { supabase } from './supabase'

const LOCAL_KEY = 'lingoloop-v1'
const UPLOADED_KEY = 'lingoloop-v1-uploaded'
const bootstraps = new Map()

export function explainSupabaseError(error) {
  const message = error?.message || ''
  if (/invalid login credentials/i.test(message)) return '아이디 또는 비밀번호가 올바르지 않아요.'
  if (/already registered|already been registered/i.test(message)) return '이미 있는 아이디예요. 로그인해 주세요.'
  if (/email not confirmed/i.test(message)) return '가입은 됐지만 바로 로그인되지 않았어요. SQL Editor에서 supabase/schema.sql을 한 번 더 실행한 뒤 로그인해 주세요.'
  if (/at least 6 characters/i.test(message)) return '비밀번호는 6자 이상이어야 해요.'
  if (/relation .* does not exist|schema cache|could not find the function/i.test(message)) {
    return 'Supabase 테이블이 아직 없어요. SQL Editor에서 supabase/schema.sql을 실행해 주세요.'
  }
  if (/row-level security|permission denied/i.test(message)) {
    return '저장 권한이 없어요. schema.sql의 RLS 정책이 적용됐는지 확인해 주세요.'
  }
  if (/failed to fetch|networkerror|network request failed/i.test(message)) return 'Supabase에 연결하지 못했어요. 주소와 인터넷 연결을 확인해 주세요.'
  return message || '요청을 처리하지 못했어요.'
}

export function loadLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')
    if (!parsed || typeof parsed !== 'object') return { ...defaultState, logs: [], scripts: [], reviews: [] }
    return {
      ...defaultState,
      ...parsed,
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      scripts: Array.isArray(parsed.scripts) ? parsed.scripts : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      goal: Number(parsed.goal) || defaultState.goal,
      time: normalizeTime(parsed.time || defaultState.time),
      remind: Boolean(parsed.remind),
      lastReminder: parsed.lastReminder || null,
    }
  } catch {
    return { ...defaultState, logs: [], scripts: [], reviews: [] }
  }
}

export function saveLocal(state) {
  const payload = {
    logs: state.logs,
    scripts: state.scripts,
    reviews: state.reviews,
    goal: state.goal,
    field: state.field,
    level: state.level,
    time: state.time,
    remind: state.remind,
    lastReminder: state.lastReminder,
  }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(payload))
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : ''
}

function mapRemote(profile, logs, scripts, reviews) {
  return {
    logs: logs.map((row) => ({
      id: row.id,
      date: dateOnly(row.date),
      minutes: row.minutes,
      topic: row.topic,
      type: row.type,
    })),
    scripts: scripts.map((row) => ({
      id: row.id,
      date: dateOnly(row.date),
      field: row.field,
      question: row.question,
      original: row.original,
      corrected: row.corrected,
      note: row.note,
      changed: row.changed,
    })),
    reviews: reviews.map((row) => ({
      id: row.id,
      date: dateOnly(row.date),
      question: row.question,
      correct: row.correct,
    })),
    goal: profile.goal ?? defaultState.goal,
    field: profile.field || defaultState.field,
    level: profile.level || defaultState.level,
    time: normalizeTime(profile.study_time),
    remind: Boolean(profile.remind),
    lastReminder: profile.last_reminder ? dateOnly(profile.last_reminder) : null,
  }
}

async function ensureProfile(userId) {
  const existing = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) return existing.data

  const inserted = await supabase.from('profiles').insert({ id: userId }).select().single()
  if (!inserted.error) return inserted.data
  if (inserted.error.code !== '23505') throw inserted.error

  const again = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (again.error) throw again.error
  return again.data
}

export async function fetchRemoteState(userId) {
  const [profile, logs, scripts, reviews] = await Promise.all([
    ensureProfile(userId),
    supabase.from('logs').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('scripts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('reviews').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
  ])
  if (logs.error) throw logs.error
  if (scripts.error) throw scripts.error
  if (reviews.error) throw reviews.error
  return mapRemote(profile, logs.data || [], scripts.data || [], reviews.data || [])
}

function hasLocalLearningData(local) {
  return local.logs.length > 0
    || local.scripts.length > 0
    || local.reviews.length > 0
    || local.goal !== defaultState.goal
    || local.field !== defaultState.field
    || local.level !== defaultState.level
    || local.time !== defaultState.time
    || local.remind !== defaultState.remind
    || Boolean(local.lastReminder)
}

async function migrateLocalOnce(userId, remote) {
  if (localStorage.getItem(UPLOADED_KEY) === '1') return { state: remote, migrated: false, skipped: false }
  const local = loadLocal()
  if (!hasLocalLearningData(local)) {
    localStorage.setItem(UPLOADED_KEY, '1')
    return { state: remote, migrated: false, skipped: false }
  }

  const { data: imported, error } = await supabase.rpc('import_local_backup', {
    payload: {
      logs: local.logs,
      scripts: local.scripts,
      reviews: local.reviews,
      profile: {
        goal: local.goal,
        field: local.field,
        level: local.level,
        time: local.time,
        remind: local.remind,
        lastReminder: local.lastReminder,
      },
    },
  })
  if (error) throw error
  localStorage.setItem(UPLOADED_KEY, '1')
  if (!imported) return { state: remote, migrated: false, skipped: true }
  return { state: await fetchRemoteState(userId), migrated: true, skipped: false }
}

async function runBootstrap(userId) {
  const remote = await fetchRemoteState(userId)
  return migrateLocalOnce(userId, remote)
}

export function bootstrap(userId) {
  if (!bootstraps.has(userId)) {
    const task = runBootstrap(userId).catch((error) => {
      bootstraps.delete(userId)
      throw error
    })
    bootstraps.set(userId, task)
  }
  return bootstraps.get(userId)
}

export function clearBootstrapCache() {
  bootstraps.clear()
}

export async function updateLogRecord(userId, log) {
  const { data, error } = await supabase.from('logs').update({
    date: log.date,
    minutes: log.minutes,
    topic: log.topic,
  }).eq('id', log.id).eq('user_id', userId).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('수정된 기록을 찾지 못했어요.')
}

export async function insertLog(userId, log) {
  const { error } = await supabase.from('logs').insert({
    id: log.id,
    user_id: userId,
    date: log.date,
    minutes: log.minutes,
    topic: log.topic,
    type: log.type,
  })
  if (error) throw error
}

export async function insertScript(userId, script) {
  const { error } = await supabase.from('scripts').insert({
    id: script.id,
    user_id: userId,
    date: script.date,
    field: script.field,
    question: script.question,
    original: script.original,
    corrected: script.corrected,
    note: script.note,
    changed: script.changed,
  })
  if (error) throw error
}

export async function insertReview(userId, review) {
  const { error } = await supabase.from('reviews').insert({
    id: review.id,
    user_id: userId,
    date: review.date,
    question: review.question,
    correct: review.correct,
  })
  if (error) throw error
}

export async function saveProfile(userId, profile) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    goal: Number(profile.goal),
    field: profile.field,
    level: profile.level,
    study_time: profile.time,
    remind: profile.remind,
    last_reminder: profile.lastReminder,
  })
  if (error) throw error
}
