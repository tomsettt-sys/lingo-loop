import { useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'
import { quiz } from '../lib/content'
import { today } from '../lib/dates'

export function Review() {
  const { state, addReview, quizIndexRef } = useApp()
  const [step, setStep] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [picked, setPicked] = useState(null)
  const item = quiz[quizIndexRef.current % quiz.length]
  const correctCount = state.reviews.filter((review) => review.correct).length
  const practicedBefore = state.reviews.some((review) => review.date !== today())

  async function choose(index) {
    if (answered) return
    setPicked(index)
    setAnswered(true)
    await addReview({
      date: today(),
      question: quizIndexRef.current % quiz.length,
      correct: index === item.correct,
    })
  }

  function next() {
    quizIndexRef.current += 1
    setPicked(null)
    setAnswered(false)
    setStep((value) => value + 1)
  }

  return (
    <>
      <PageIntro title="틀렸던 표현이, 익숙한 표현으로" desc="짧게 연습하고, 내일 한 번 더 확인해요." />
      <div className="layout">
        <section className="panel" key={step}>
          <div className="eyebrow">EXPRESSION PRACTICE · {(quizIndexRef.current % quiz.length) + 1} / {quiz.length}</div>
          <h2 style={{ fontSize: 21, marginTop: 25 }}>{item.q}</h2>
          <p className="sub">자연스러운 문장을 골라보세요. · 기본 표현 연습</p>
          {item.a.map((choice, index) => {
            const showCorrect = answered && index === item.correct
            const showWrong = answered && picked === index && index !== item.correct
            return (
              <button
                key={choice}
                className={`choice${showCorrect ? ' correct' : ''}${showWrong ? ' wrong' : ''}`}
                type="button"
                onClick={() => choose(index)}
              >
                <span style={{ color: '#94a695', marginRight: 12 }}>{['A', 'B', 'C'][index]}</span>
                {choice}
              </button>
            )
          })}
          {answered && (
            <div>
              <div className="feedback">
                <strong>{picked === item.correct ? '맞았어요! 한 걸음 더 가까워졌어요.' : '괜찮아요. 지금 배우면 되니까요.'}</strong>
                <p>{item.why}</p>
              </div>
              <button className="primary" type="button" onClick={next}>다음 표현 연습 →</button>
            </div>
          )}
        </section>
        <section className="panel" style={{ alignSelf: 'start' }}>
          <h3>나의 복습 여정</h3>
          <p className="sub">선택형 정답은 표현을 알아본 기록이에요. 실제 말하기 숙련도나 영어 등급을 의미하지 않아요.</p>
          <div className="feedback">정답 {correctCount}회 / {state.reviews.length}회 시도</div>
          <p className="sub">
            {practicedBefore ? '이전에 연습한 표현을 다시 확인해 보세요.' : '오늘 연습한 표현은 다음 날 다시 확인해 보세요.'}
          </p>
        </section>
      </div>
    </>
  )
}
