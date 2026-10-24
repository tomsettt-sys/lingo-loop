import { LogList } from '../components/LogList'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'
import { minutesOn, weekDays } from '../lib/dates'

export function Home() {
  const { state, setPage, setLogOpen } = useApp()
  const done = minutesOn(state.logs)
  const goal = Number(state.goal) > 0 ? Number(state.goal) : 20
  const progress = Math.min(100, (done / goal) * 100)
  const percent = Math.min(100, Math.round(progress))
  const correctCount = state.reviews.filter((item) => item.correct).length
  const recent = [...state.logs].reverse().slice(0, 8)

  return (
    <>
      <PageIntro title="Hyochan님, 오늘도 한 걸음 더 🌱" desc="완벽한 문장보다, 오늘의 작은 대화가 중요해요." />
      <div className="layout">
        <div>
          <section className="hero">
            <span className="pill">✦ 나의 목표에 맞춘 오늘의 대화</span>
            <h2>
              당신의 이야기가
              <br />
              가장 좋은 영어 교재니까요.
            </h2>
            <p>
              오늘은 나의 경험을 영어로 이야기해 볼까요?
              <br />
              한 문장부터 차근차근 시작해요.
            </p>
            <button className="primary" type="button" onClick={() => setPage('talk')}>오늘의 대화 시작하기　 ↗</button>
            <div className="orb" />
            <div className="orbit" />
            <span className="spark">✧</span>
          </section>
          <div className="section-title">
            <h2>오늘의 학습 루틴</h2>
            <span className="text-btn">작게 시작해서, 꾸준하게</span>
          </div>
          <div className="cards">
            <button className="card" type="button" onClick={() => setPage('talk')}>
              <span className="symbol">◉</span>
              <h3>나를 위한 대화</h3>
              <p>
                내 분야의 질문에
                <br />
                영어로 답해보세요.
              </p>
              <div className="card-bottom"><span>말하기 · 5분</span><span>↗</span></div>
            </button>
            <button className="card" type="button" onClick={() => setPage('review')}>
              <span className="symbol lav">✧</span>
              <h3>표현 레벨업</h3>
              <p>
                헷갈렸던 문장을
                <br />
                나만의 표현으로.
              </p>
              <div className="card-bottom"><span>복습 · 3분</span><span>↗</span></div>
            </button>
            <button className="card" type="button" onClick={() => setLogOpen(true)}>
              <span className="symbol peach">▤</span>
              <h3>오늘을 기록하기</h3>
              <p>
                한마디로 남기는
                <br />
                오늘의 학습 기록.
              </p>
              <div className="card-bottom"><span>학습 일지 · 1분</span><span>＋</span></div>
            </button>
          </div>
          <div className="section-title">
            <h2>최근 학습 기록</h2>
            <button className="text-btn" type="button" onClick={() => setPage('journal')}>전체 보기 ↗</button>
          </div>
          <section className="panel tight">
            <LogList logs={recent} />
          </section>
          <div className="growth">
            <span>✳</span>
            <div>
              <h3>{state.reviews.length ? '연습한 표현을 내일 다시 만나보세요.' : '잘하는 영어보다, 계속하는 영어.'}</h3>
              <p>
                {state.reviews.length
                  ? `지금까지 ${correctCount}번 정답을 골랐어요. 다음에는 힌트 없이 직접 말해보세요.`
                  : '아직은 기록을 쌓는 중이에요. 첫 대화를 시작하면 나의 표현을 돌아볼 수 있어요.'}
              </p>
            </div>
          </div>
        </div>
        <div className="right">
          <section className="panel">
            <h3>오늘의 작은 목표 <span style={{ float: 'right' }}>◌</span></h3>
            <div className="goal">
              <div>
                <strong>{done} <span className="goal-cap">/ {goal}분</span></strong>
                <small>{done >= goal ? '오늘 목표를 달성했어요!' : '나만의 속도로 채워보세요'}</small>
              </div>
              <div className="ring" style={{ '--progress': `${progress}%` }}>
                <strong>{percent}%</strong>
              </div>
            </div>
            <div className="week">
              {weekDays(state.logs).map((day) => (
                <div className="day" key={day.key}>
                  {day.label}
                  <b className={day.done ? 'done' : ''}>{day.done ? '✓' : day.day}</b>
                </div>
              ))}
            </div>
          </section>
          <section className="panel next">
            <span className="eyebrow">A LITTLE PROMISE</span>
            <h3 style={{ marginTop: 12 }}>다음 대화, 잊지 않도록</h3>
            <p>
              하루의 작은 틈에
              <br />
              영어를 위한 시간을 만들어보세요.
            </p>
            <div className="time">
              <span>◷ 학습 시간</span>
              <strong>{state.time}</strong>
            </div>
            <button className="outline wide" type="button" onClick={() => setPage('settings')}>나의 스케줄 설정하기 ↗</button>
          </section>
          <section className="panel">
            <h3>나의 학습 방향</h3>
            <span className="tag">{state.field}</span>
            <span className="tag">{state.level}</span>
            <p className="sub">
              목표에 맞는 질문으로
              <br />
              실제 필요한 영어를 연습해요.
            </p>
            <button className="text-btn" type="button" onClick={() => setPage('settings')}>학습 목표 수정 ↗</button>
          </section>
        </div>
      </div>
    </>
  )
}
