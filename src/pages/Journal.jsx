import { LogList } from '../components/LogList'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'
import { minutesOn, studyDays, totalMinutes } from '../lib/dates'

export function Journal() {
  const { state, openLogComposer } = useApp()
  const logs = [...state.logs].reverse()

  function exportRecords() {
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
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'lingo-loop-records.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageIntro title="꾸준함이 쌓이는 곳" desc="오늘 무엇을, 얼마나 공부했는지 가볍게 남겨보세요." />
      <div className="actions">
        <button className="primary" type="button" onClick={() => openLogComposer()}>＋ 학습 기록 추가</button>
        <button className="outline" type="button" onClick={exportRecords}>기록 JSON 내보내기</button>
      </div>
      <div className="stats">
        <section className="panel"><strong>{minutesOn(state.logs)}<span style={{ fontSize: 13 }}> 분</span></strong><small>오늘의 학습</small></section>
        <section className="panel"><strong>{totalMinutes(state.logs)}<span style={{ fontSize: 13 }}> 분</span></strong><small>누적 학습 시간</small></section>
        <section className="panel"><strong>{studyDays(state.logs)}<span style={{ fontSize: 13 }}> 일</span></strong><small>공부한 날</small></section>
      </div>
      <section className="panel">
        <LogList logs={logs} onEdit={openLogComposer} />
      </section>
    </>
  )
}
