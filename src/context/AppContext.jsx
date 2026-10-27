import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { defaultState } from '../lib/content'
import {
  bootstrap,
  clearBootstrapCache,
  explainSupabaseError,
  insertLog,
  updateLogRecord,
  insertReview,
  insertScript,
  loadLocal,
  saveLocal,
  saveProfile,
} from '../lib/data'
import { stopRecognition } from '../lib/speech'
import { supabase, supabaseMode } from '../lib/supabase'

const AppContext = createContext(null)

function freshState() {
  return { ...defaultState, logs: [], scripts: [], reviews: [] }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => (supabaseMode === 'local' ? loadLocal() : freshState()))
  const [page, setPageState] = useState('home')
  const [session, setSession] = useState(null)
  const [booting, setBooting] = useState(supabaseMode === 'remote')
  const [loadedUserId, setLoadedUserId] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [logOpen, setLogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [toastOn, setToastOn] = useState(false)

  const stateRef = useRef(state)
  const sessionRef = useRef(session)
  const toastTimer = useRef(null)
  const loadedFor = useRef(null)
  const quizIndexRef = useRef(0)
  const sessionStartRef = useRef(0)
  sessionRef.current = session

  const toast = (message) => {
    setToastMessage(message)
    setToastOn(true)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastOn(false), 3500)
  }
  const toastRef = useRef(toast)
  toastRef.current = toast

  const apply = (next) => {
    stateRef.current = next
    setState(next)
    if (supabaseMode === 'local') {
      try {
        saveLocal(next)
      } catch {
        toastRef.current('저장 공간을 사용할 수 없습니다. 브라우저 설정을 확인해 주세요.')
      }
    }
  }

  useEffect(() => {
    if (supabaseMode !== 'remote') return undefined
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) toastRef.current(explainSupabaseError(error))
      setSession(data?.session ?? null)
      setBooting(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      window.setTimeout(() => {
        if (!active) return
        setSession(nextSession)
        setBooting(false)
        if (event === 'SIGNED_OUT') {
          clearBootstrapCache()
          loadedFor.current = null
          setLoadedUserId(null)
          setLoadError('')
          setPageState('home')
          apply(freshState())
        }
      }, 0)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (supabaseMode !== 'remote') return undefined
    if (!userId) {
      loadedFor.current = null
      return undefined
    }
    if (loadedFor.current === userId) return undefined
    let cancelled = false
    setLoadError('')
    bootstrap(userId)
      .then((result) => {
        if (cancelled) return
        loadedFor.current = userId
        apply(result.state)
        setLoadedUserId(userId)
        if (result.migrated) toastRef.current('이 브라우저에 있던 학습 기록을 계정으로 옮겼어요.')
        else if (result.skipped) toastRef.current('계정에 이미 학습 기록이 있어, 이 브라우저의 기록은 덮어쓰지 않았어요.')
      })
      .catch((error) => {
        if (cancelled) return
        setLoadedUserId(null)
        setLoadError(explainSupabaseError(error))
      })
    return () => {
      cancelled = true
    }
  }, [userId, retryCount])

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = stateRef.current
      const now = new Date()
      const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      if (!current.remind || clock !== current.time || current.lastReminder === new Date().toLocaleDateString('en-CA')) return
      const next = { ...current, lastReminder: new Date().toLocaleDateString('en-CA') }
      apply(next)
      const activeUserId = sessionRef.current?.user?.id
      if (supabaseMode === 'remote' && activeUserId) {
        saveProfile(activeUserId, next).catch((error) => toastRef.current(explainSupabaseError(error)))
      }
      toastRef.current('오늘은 어떤 하루였나요? 영어 한 문장으로 이야기해 볼 시간이에요.')
    }, 15000)
    return () => window.clearInterval(id)
  }, [])

  const setPage = (next) => {
    stopRecognition()
    window.speechSynthesis?.cancel()
    setPageState(next)
    window.scrollTo(0, 0)
  }

  const requireUser = () => {
    const activeUserId = sessionRef.current?.user?.id
    if (supabaseMode === 'remote' && !activeUserId) {
      toastRef.current('로그인이 필요해요.')
      return null
    }
    return activeUserId
  }

  const addLog = async (entry) => {
    const row = { id: crypto.randomUUID(), ...entry }
    apply({ ...stateRef.current, logs: [...stateRef.current.logs, row] })
    if (supabaseMode !== 'remote') return true
    const activeUserId = requireUser()
    if (!activeUserId) {
      apply({ ...stateRef.current, logs: stateRef.current.logs.filter((item) => item.id !== row.id) })
      return false
    }
    try {
      await insertLog(activeUserId, row)
      return true
    } catch (error) {
      apply({ ...stateRef.current, logs: stateRef.current.logs.filter((item) => item.id !== row.id) })
      toastRef.current(explainSupabaseError(error))
      return false
    }
  }

  const updateLog = async (target, patch) => {
    const before = stateRef.current.logs
    const index = before.findIndex((item) => (target.id ? item.id === target.id : item === target))
    if (index < 0) {
      toastRef.current('수정할 기록을 찾지 못했어요.')
      return false
    }
    const nextRow = { ...before[index], ...patch, id: before[index].id || crypto.randomUUID() }
    apply({
      ...stateRef.current,
      logs: before.map((item, itemIndex) => (itemIndex === index ? nextRow : item)),
    })
    if (supabaseMode !== 'remote') return true
    if (!before[index].id) {
      apply({ ...stateRef.current, logs: before })
      toastRef.current('이 기록은 서버에서 수정할 수 없어요.')
      return false
    }
    const activeUserId = requireUser()
    if (!activeUserId) {
      apply({ ...stateRef.current, logs: before })
      return false
    }
    try {
      await updateLogRecord(activeUserId, nextRow)
      return true
    } catch (error) {
      apply({ ...stateRef.current, logs: before })
      toastRef.current(explainSupabaseError(error))
      return false
    }
  }

  const openLogComposer = (log = null) => {
    setEditingLog(log)
    setLogOpen(true)
  }

  const addScript = async (entry) => {
    const row = { id: crypto.randomUUID(), ...entry }
    apply({ ...stateRef.current, scripts: [...stateRef.current.scripts, row] })
    if (supabaseMode !== 'remote') return true
    const activeUserId = requireUser()
    if (!activeUserId) {
      apply({ ...stateRef.current, scripts: stateRef.current.scripts.filter((item) => item.id !== row.id) })
      return false
    }
    try {
      await insertScript(activeUserId, row)
      return true
    } catch (error) {
      apply({ ...stateRef.current, scripts: stateRef.current.scripts.filter((item) => item.id !== row.id) })
      toastRef.current(explainSupabaseError(error))
      return false
    }
  }

  const addReview = async (entry) => {
    const row = { id: crypto.randomUUID(), ...entry }
    apply({ ...stateRef.current, reviews: [...stateRef.current.reviews, row] })
    if (supabaseMode !== 'remote') return true
    const activeUserId = requireUser()
    if (!activeUserId) {
      apply({ ...stateRef.current, reviews: stateRef.current.reviews.filter((item) => item.id !== row.id) })
      return false
    }
    try {
      await insertReview(activeUserId, row)
      return true
    } catch (error) {
      apply({ ...stateRef.current, reviews: stateRef.current.reviews.filter((item) => item.id !== row.id) })
      toastRef.current(explainSupabaseError(error))
      return false
    }
  }

  const saveSettings = async (patch) => {
    const previous = stateRef.current
    const next = { ...previous, ...patch }
    apply(next)
    if (supabaseMode !== 'remote') {
      toastRef.current('나의 학습 설정을 저장했어요.')
      return true
    }
    const activeUserId = requireUser()
    if (!activeUserId) {
      apply({ ...stateRef.current, ...pickSettings(previous) })
      return false
    }
    try {
      await saveProfile(activeUserId, next)
      toastRef.current('나의 학습 설정을 저장했어요.')
      return true
    } catch (error) {
      apply({ ...stateRef.current, ...pickSettings(previous) })
      toastRef.current(explainSupabaseError(error))
      return false
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) toastRef.current(explainSupabaseError(error))
  }

  const retryLoad = () => {
    clearBootstrapCache()
    loadedFor.current = null
    setLoadError('')
    setRetryCount((count) => count + 1)
  }

  const ensureSession = useCallback(() => {
    if (!sessionStartRef.current) sessionStartRef.current = Date.now()
  }, [])

  const takeSessionMinutes = () => {
    const start = sessionStartRef.current || Date.now()
    return Math.max(1, Math.round((Date.now() - start) / 60000))
  }

  const clearStudySession = () => {
    sessionStartRef.current = 0
  }

  const value = {
    state,
    page,
    setPage,
    session,
    supabaseMode,
    booting,
    loadedUserId,
    loadError,
    logOpen,
    setLogOpen,
    editingLog,
    setEditingLog,
    openLogComposer,
    toastMessage,
    toastOn,
    toast,
    addLog,
    updateLog,
    addScript,
    addReview,
    saveSettings,
    signOut,
    retryLoad,
    quizIndexRef,
    ensureSession,
    takeSessionMinutes,
    clearStudySession,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function pickSettings(state) {
  return {
    goal: state.goal,
    field: state.field,
    level: state.level,
    time: state.time,
    remind: state.remind,
  }
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp는 AppProvider 안에서만 사용할 수 있어요.')
  return context
}
