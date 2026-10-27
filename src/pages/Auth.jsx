import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { idToEmail, normalizeId, validateId } from '../lib/account'
import { explainSupabaseError } from '../lib/data'
import { supabase } from '../lib/supabase'

export function AuthScreen() {
  const { toast } = useApp()
  const [mode, setMode] = useState('signIn')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  function switchMode(next) {
    setMode(next)
    setMessage('')
  }

  async function onSubmit(event) {
    event.preventDefault()
    const idError = validateId(userId)
    if (idError) {
      setMessage(idError)
      return
    }
    const id = normalizeId(userId)
    const email = idToEmail(id)
    setPending(true)
    setMessage('')
    try {
      if (mode === 'signUp') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: id } },
        })
        if (error) throw error
        if (!data.session) {
          const signIn = await supabase.auth.signInWithPassword({ email, password })
          if (signIn.error) throw signIn.error
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      const text = explainSupabaseError(error)
      setMessage(text)
      toast(text)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-card">
        <div className="brand">
          <span className="logo">l∿</span>
          lingo loop
          <span className="dot">.</span>
        </div>
        <h1>{mode === 'signIn' ? '학습 공간에 들어가기' : '나의 학습 계정 만들기'}</h1>
        <p className="sub">아이디와 비밀번호만 있으면 돼요. 기록은 이 아이디에만 저장됩니다.</p>
        <div className="auth-switch">
          <button className={mode === 'signIn' ? 'active' : ''} type="button" onClick={() => switchMode('signIn')}>로그인</button>
          <button className={mode === 'signUp' ? 'active' : ''} type="button" onClick={() => switchMode('signUp')}>회원가입</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label htmlFor="userId">아이디</label>
            <input
              id="userId"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="hyochan"
              minLength={3}
              maxLength={20}
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {message && <div className="auth-error">{message}</div>}
          <button className="primary" type="submit" disabled={pending}>
            {pending ? '잠시만요…' : mode === 'signIn' ? '로그인' : '회원가입'}
          </button>
        </form>
      </section>
    </div>
  )
}
