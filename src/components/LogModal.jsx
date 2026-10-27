import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { today } from '../lib/dates'
import { speechErrorMessage, stopRecognition, toggleRecognition } from '../lib/speech'

export function LogModal() {
  const { logOpen, setLogOpen, editingLog, setEditingLog, addLog, updateLog, toast } = useApp()
  const dialogRef = useRef(null)
  const mounted = useRef(true)
  const [voiceText, setVoiceText] = useState('')
  const [topic, setTopic] = useState('')
  const [minutes, setMinutes] = useState('')
  const [date, setDate] = useState(today)
  const [listening, setListening] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stopRecognition()
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (logOpen && !dialog.open) {
      setVoiceText(editingLog?.topic || '')
      setTopic(editingLog?.topic || '')
      setMinutes(editingLog ? String(editingLog.minutes) : '')
      setDate(editingLog?.date || today())
      setListening(false)
      setSaving(false)
      dialog.showModal()
    }
    if (!logOpen && dialog.open) dialog.close()
    return undefined
  }, [logOpen, editingLog])

  function close() {
    stopRecognition()
    setListening(false)
    setLogOpen(false)
    setEditingLog(null)
  }

  function dictate() {
    if (listening) {
      stopRecognition()
      setListening(false)
      toast('음성 입력을 종료했어요.')
      return
    }
    toggleRecognition({
      lang: 'ko-KR',
      onResult: (text) => {
        if (!mounted.current) return
        setVoiceText((current) => {
          const next = current ? `${current} ${text}` : text
          setTopic(next)
          return next
        })
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

  function onVoiceChange(event) {
    const value = event.target.value
    setVoiceText(value)
    setTopic(value)
  }

  function onTopicChange(event) {
    const value = event.target.value
    setTopic(value)
    setVoiceText(value)
  }

  function parse() {
    const text = voiceText.trim()
    setTopic(text)
    let total = 0
    for (const match of text.matchAll(/(\d+)\s*(시간|분)/g)) {
      total += Number(match[1]) * (match[2] === '시간' ? 60 : 1)
    }
    setMinutes(total ? String(total) : '')
    toast(total ? '시간을 채웠어요. 내용을 확인해 주세요.' : '숫자로 된 시간을 찾지 못했어요. 직접 입력해 주세요.')
  }

  async function onSubmit(event) {
    event.preventDefault()
    setSaving(true)
    const entry = {
      date,
      minutes: Number(minutes),
      topic: topic.trim(),
    }
    const ok = editingLog
      ? await updateLog(editingLog, entry)
      : await addLog({ ...entry, type: '직접 기록' })
    if (mounted.current) setSaving(false)
    if (!ok) return
    stopRecognition()
    setLogOpen(false)
    setEditingLog(null)
    toast(editingLog ? '학습 기록을 수정했어요.' : '오늘의 노력이 기록됐어요.')
  }

  return (
    <dialog
      id="modal"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
    >
      <form onSubmit={onSubmit}>
        <h2>{editingLog ? '이 기록을 수정할까요?' : '오늘의 공부를 남겨볼까요?'}</h2>
        <p className="sub">예: 오늘 팟캐스트 20분 듣고 면접 연습 15분 했어.</p>
        <textarea
          value={voiceText}
          onChange={onVoiceChange}
          placeholder="오늘 공부한 내용을 말하거나 적어주세요."
        />
        <div className="actions" style={{ marginTop: 10 }}>
          <button className="outline" type="button" onClick={dictate}>
            {listening ? '■ 음성 입력 중지' : '◉ 한국어 음성 입력'}
          </button>
          <button className="outline" type="button" onClick={parse}>기록 항목 채우기 ↓</button>
        </div>
        <div className="form-row">
          <label htmlFor="logTopic">학습 내용</label>
          <input
            id="logTopic"
            value={topic}
            onChange={onTopicChange}
            required
            placeholder="예: 팟캐스트 듣기 / 면접 연습"
          />
        </div>
        <div className="split">
          <div className="form-row">
            <label htmlFor="logMinutes">시간 (분)</label>
            <input
              id="logMinutes"
              type="number"
              min="1"
              max="1440"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="logDate">학습 날짜</label>
            <input
              id="logDate"
              type="date"
              value={date}
              max={today()}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
        </div>
        <p className="sub">시간 표현(숫자 + 시간/분)을 읽어 합산해요. 저장 전 확인해 주세요.</p>
        <div className="actions">
          <button className="primary" type="submit" disabled={saving}>{editingLog ? '수정 저장' : '기록 저장'}</button>
          <button className="outline" type="button" onClick={close}>취소</button>
        </div>
      </form>
    </dialog>
  )
}
