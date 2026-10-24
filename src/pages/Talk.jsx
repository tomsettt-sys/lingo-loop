import { useEffect, useMemo, useRef, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'
import { correctText, questionsFor } from '../lib/content'
import { today } from '../lib/dates'
import { speakEnglish, speechErrorMessage, stopRecognition, toggleRecognition } from '../lib/speech'

const sampleAnswer = 'I have to making a report. I discuss about data quality with my team.'

export function Talk() {
  const {
    state,
    addScript,
    addLog,
    setPage,
    toast,
    ensureSession,
    takeSessionMinutes,
    clearStudySession,
  } = useApp()
  const prompts = useMemo(() => questionsFor(state.field, state.level), [state.field, state.level])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [listening, setListening] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const mounted = useRef(true)
  const prompt = prompts[Math.min(index, prompts.length - 1)]

  useEffect(() => {
    mounted.current = true
    ensureSession()
    return () => {
      mounted.current = false
      stopRecognition()
    }
  }, [ensureSession])

  function dictate() {
    if (listening) {
      stopRecognition()
      setListening(false)
      toast('음성 입력을 종료했어요.')
      return
    }
    toggleRecognition({
      lang: 'en-GB',
      onResult: (text) => {
        if (!mounted.current) return
        setAnswer((current) => (current ? `${current} ${text}` : text))
      },
      onStart: () => {
        if (!mounted.current) return
        setListening(true)
        toast('듣고 있어요. 말을 마치면 텍스트로 표시됩니다.')
      },
      onStop: () => {
        if (mounted.current) setListening(false)
      },
      onError: (code) => {
        if (!mounted.current) return
        setListening(false)
        toast(speechErrorMessage(code))
      },
    })
  }

  function listen() {
    if (!speakEnglish(prompt[0])) toast('음성 재생을 지원하지 않는 브라우저예요.')
  }

  async function check() {
    const original = answer.trim()
    if (!original) {
      toast('답변을 먼저 입력해 주세요.')
      return
    }
    const result = correctText(original)
    setSaving(true)
    const ok = await addScript({
      date: today(),
      field: state.field,
      question: prompt[0],
      original,
      corrected: result.corrected,
      note: result.note,
      changed: result.changed,
    })
    if (mounted.current) setSaving(false)
    if (ok) setFeedback(result)
  }

  function nextQuestion() {
    setIndex((current) => current + 1)
    setAnswer('')
    setFeedback(null)
    setListening(false)
  }

  async function finish() {
    const minutes = takeSessionMinutes()
    const ok = await addLog({
      date: today(),
      minutes,
      topic: `${state.field} 말하기`,
      type: '앱 내 연습 (경과 시간 반올림)',
    })
    if (!ok) return
    clearStudySession()
    setPage('journal')
    toast('오늘의 말하기를 기록했어요.')
  }

  return (
    <>
      <PageIntro title="작은 대화, 새로운 자신감" desc="생각을 영어로 꺼내보세요. 틀려도 괜찮아요." />
      <div className="layout">
        <section className="panel">
          <div className="coach-badge">
            ✳ Lingo 코치 <span className="tag">가이드 연습</span>
            <span style={{ marginLeft: 'auto' }}>{index + 1} / {prompts.length}</span>
          </div>
          <div className="question">{prompt[0]}</div>
          <p className="sub">{prompt[1]}</p>
          <button className="text-btn" type="button" onClick={listen}>◖ 질문 듣기</button>
          <div className="form-row">
            <label htmlFor="answer">나의 답변</label>
            <textarea
              id="answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="I worked on a project that…"
              disabled={Boolean(feedback)}
            />
          </div>
          {!feedback && (
            <div className="actions">
              <button className="outline" type="button" onClick={dictate}>
                {listening ? '■ 음성 입력 중지' : '◉ 음성으로 답하기'}
              </button>
              <button className="primary" type="button" onClick={check} disabled={saving}>답변 저장 & 표현 확인 →</button>
            </div>
          )}
          {feedback && (
            <>
              <div className="feedback">
                <strong>{feedback.notes.length ? '이 표현을 연습해 보세요' : '원문을 저장했어요'}</strong>
                <p>{feedback.corrected}</p>
                <small>{feedback.note}</small>
              </div>
              <div className="actions">
                <button className="primary" type="button" onClick={index < prompts.length - 1 ? nextQuestion : finish}>
                  {index < prompts.length - 1 ? '다음 질문으로 →' : '대화 마치고 기록하기 ✓'}
                </button>
                <button className="outline" type="button" onClick={() => setPage('scripts')}>스크립트 보기</button>
              </div>
            </>
          )}
          <div className="notice">
            이 버전은 분야별 질문과 제한된 문법 규칙으로 연습합니다. 자유 대화 AI·전체 문법 분석·발음 평가는 아직 연결되지 않았어요. 음성 입력은 브라우저 지원 및 마이크 권한이 필요합니다.
          </div>
        </section>
        <div className="right">
          <section className="panel next">
            <h3>오늘의 말하기 팁</h3>
            <p>
              먼저 한 문장으로 핵심을 말해보세요.
              <br />
              그다음 이유와 예시를 덧붙여요.
            </p>
            <span className="tag">상황 → 행동 → 결과</span>
          </section>
          <section className="panel">
            <h3>이렇게 시작해 보세요</h3>
            <p className="sub">
              “I worked on…”
              <br />
              “The main challenge was…”
              <br />
              “As a result, we…”
            </p>
            <button className="text-btn" type="button" onClick={() => setAnswer(sampleAnswer)} disabled={Boolean(feedback)}>
              예시 답변으로 체험하기 ↗
            </button>
          </section>
        </div>
      </div>
    </>
  )
}
