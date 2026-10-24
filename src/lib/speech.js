let recognition = null

export function stopRecognition() {
  const current = recognition
  recognition = null
  if (!current) return
  current.onend = null
  current.onerror = null
  current.onresult = null
  try {
    current.stop()
  } catch {
    // 이미 끝난 인식은 무시합니다.
  }
}

export function toggleRecognition({ lang, onResult, onStart, onStop, onError }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    onError('unsupported')
    return false
  }
  if (recognition) {
    stopRecognition()
    onStop()
    return false
  }

  const next = new SpeechRecognition()
  recognition = next
  next.lang = lang
  next.interimResults = false
  next.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript
    if (text) onResult(text)
  }
  next.onerror = (event) => {
    if (recognition === next) recognition = null
    onError(event.error || 'error')
  }
  next.onend = () => {
    if (recognition === next) recognition = null
    onStop()
  }
  try {
    next.start()
  } catch {
    recognition = null
    onError('start')
    return false
  }
  onStart()
  return true
}

export function speakEnglish(text) {
  if (!window.speechSynthesis) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'
  utterance.rate = 0.88
  window.speechSynthesis.speak(utterance)
  return true
}

export function speechErrorMessage(code) {
  if (code === 'unsupported') return '이 브라우저는 음성 인식을 지원하지 않아요. 텍스트로 입력해 주세요.'
  if (code === 'not-allowed') return '마이크 권한을 허용해 주세요.'
  return '음성 인식이 중단됐어요. 다시 시도하거나 직접 입력해 주세요.'
}
