import { useEffect, useState } from 'react'
import { SetupSteps } from '../components/SetupSteps'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'
import { usernameFromUser } from '../lib/account'
import { fields, levels } from '../lib/content'
import { supabaseProjectHost } from '../lib/supabase'

export function Settings() {
  const { state, saveSettings, session, supabaseMode, signOut } = useApp()
  const username = usernameFromUser(session?.user)
  const [draft, setDraft] = useState(state)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      field: state.field,
      level: state.level,
      goal: state.goal,
      time: state.time,
      remind: state.remind,
    }))
  }, [state.field, state.level, state.goal, state.time, state.remind])

  function update(event) {
    const { name, value, type, checked } = event.target
    setDraft((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setSaving(true)
    await saveSettings({
      field: draft.field,
      level: draft.level,
      goal: Number(draft.goal),
      time: String(draft.time).slice(0, 5),
      remind: Boolean(draft.remind),
    })
    setSaving(false)
  }

  return (
    <>
      <PageIntro title="나에게 맞는 학습의 리듬" desc="분야와 목표, 편안한 학습 시간을 정해보세요." />
      <form className="panel settings-form" onSubmit={onSubmit}>
        <div className="split">
          <div className="form-row">
            <label htmlFor="field">관심 분야</label>
            <select id="field" name="field" value={draft.field} onChange={update}>
              {fields.map((field) => <option key={field} value={field}>{field}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="level">스스로 느끼는 수준</label>
            <select id="level" name="level" value={draft.level} onChange={update}>
              {levels.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
        </div>
        <div className="split">
          <div className="form-row">
            <label htmlFor="goal">하루 목표 (분)</label>
            <input id="goal" name="goal" type="number" min="1" max="240" value={draft.goal} onChange={update} required />
          </div>
          <div className="form-row">
            <label htmlFor="time">매일 학습 시간</label>
            <input id="time" name="time" type="time" value={draft.time} onChange={update} required />
          </div>
        </div>
        <label className="checkline">
          <input name="remind" type="checkbox" checked={Boolean(draft.remind)} onChange={update} />
          페이지를 열어 둔 동안 학습 시간에 알려주기
        </label>
        {supabaseMode === 'remote' ? (
          <>
            <div className="notice">
              기록은 로그인한 계정의 Supabase({supabaseProjectHost()})에 저장됩니다. 앱을 닫은 뒤의 푸시 알림은 아직 지원하지 않아요.
            </div>
            <div className="account-row">
              <div>
                <strong>{username || session?.user?.email}</strong>
                <small>{username ? '아이디' : '계정'}</small>
              </div>
              <button className="outline" type="button" onClick={signOut}>로그아웃</button>
            </div>
          </>
        ) : (
          <div className="notice">
            지금은 이 브라우저에만 저장됩니다. 다른 기기와 맞추려면 Supabase를 연결하세요.
            <SetupSteps />
            키 파일 없이 쓰려면 <code>.env.local</code>을 만들지 않으면 됩니다. 앱을 닫은 뒤의 푸시 알림은 아직 지원하지 않아요.
          </div>
        )}
        <button className="primary" type="submit" disabled={saving}>설정 저장하기</button>
      </form>
    </>
  )
}
