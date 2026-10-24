import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'

export function Scripts() {
  const { state, setPage, toast } = useApp()
  const scripts = [...state.scripts].reverse()

  async function copyOriginal(text) {
    try {
      await navigator.clipboard.writeText(text)
      toast('원문을 복사했어요.')
    } catch {
      toast('복사 권한이 없어요. 원문을 선택해 복사해 주세요.')
    }
  }

  return (
    <>
      <PageIntro title="내가 말한 영어, 나의 성장 기록" desc="원문은 그대로. 개선할 표현은 따로 모아보세요." />
      {scripts.length ? scripts.map((script, index) => (
        <section className="panel stack" key={script.id || `${script.date}-${index}`}>
          <span className="eyebrow">{script.date} · {script.field}</span>
          <h3 style={{ marginTop: 15 }}>{script.question}</h3>
          <div className="split">
            <div>
              <label>내가 말한 원문</label>
              <p className="original">{script.original}</p>
            </div>
            <div>
              <label>규칙 기반 교정 {script.changed ? '' : '· 교정 제안 없음'}</label>
              <p className="feedback">{script.corrected}</p>
            </div>
          </div>
          <p className="sub">{script.note}</p>
          <button className="text-btn" type="button" onClick={() => copyOriginal(script.original)}>원문 복사 ↗</button>
        </section>
      )) : (
        <section className="panel empty">
          첫 답변이 나만의 스크립트가 됩니다.
          <br />
          <br />
          <button className="primary" type="button" onClick={() => setPage('talk')}>첫 대화 시작하기 →</button>
        </section>
      )}
    </>
  )
}
