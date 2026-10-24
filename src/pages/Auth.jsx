import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { explainSupabaseError } from '../lib/data'
import { supabase } from '../lib/supabase'

export function AuthScreen() {
  const { toast } = useApp()
  const [mode, setMode] = useState('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    try {
      if (mode === 'signUp') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
        if (!data.session) {
          setMessage('가입 메일을 확인해 주세요. 메일이 오지 않으면 Supabase에서 Confirm email을 끈 뒤 다시 가입해 주세요.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
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
        <p className="sub">기록은 이 계정에만 저장되고, 다른 기기에서도 이어서 볼 수 있어요.</p>
        <div className="auth-switch">
          <button className={mode === 'signIn' ? 'active' : ''} type="button" onClick={() => setMode('signIn')}>로그인</button>
          <button className={mode === 'signUp' ? 'active' : ''} type="button" onClick={() => setMode('signUp')}>회원가입</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
