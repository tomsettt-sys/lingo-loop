export const defaultState = {
  logs: [],
  scripts: [],
  reviews: [],
  goal: 20,
  field: 'Data engineering',
  level: '중급',
  time: '20:30',
  remind: false,
  lastReminder: null,
}

export const fields = ['Data engineering', '취업 인터뷰', '일상 대화']
export const levels = ['초급', '중급', '고급']

export const pageTitles = {
  home: '오늘의 학습',
  talk: '코치와 대화',
  scripts: '나의 스크립트',
  review: '복습 스튜디오',
  journal: '학습 기록',
  settings: '나의 학습 설정',
}

export const quiz = [
  {
    q: '“보고서를 만들어야 해요.”',
    a: ['I have to making a report.', 'I have to make a report.', 'I have to made a report.'],
    correct: 1,
    why: 'have to 뒤에는 동사원형 make를 사용해요.',
  },
  {
    q: '“팀과 데이터 품질을 논의해요.”',
    a: [
      'I discuss data quality with my team.',
      'I discuss about data quality with my team.',
      'I discussing data quality with my team.',
    ],
    correct: 0,
    why: 'discuss는 목적어를 바로 받으므로 about이 필요 없어요.',
  },
  {
    q: '“저도 그 생각에 동의해요.”',
    a: ['I am agree with that idea.', 'I agreeing with that idea.', 'I agree with that idea.'],
    correct: 2,
    why: 'agree 자체가 동사이므로 am을 붙이지 않아요.',
  },
]

const rules = [
  [/\b(have|has) to making\b/gi, '$1 to make', 'have to 뒤에는 동사원형을 사용해요.'],
  [/\bneed to making\b/gi, 'need to make', 'need to 뒤에는 동사원형을 사용해요.'],
  [/\bI am agree\b/gi, 'I agree', 'agree는 동사라 am 없이 사용해요.'],
  [/\bdiscuss about\b/gi, 'discuss', 'discuss 뒤에는 about 없이 목적어를 써요.'],
  [/\bI have went\b/gi, 'I have gone', '현재완료에서는 과거분사 gone을 사용해요.'],
]

export function questionsFor(field, level) {
  if (field === '일상 대화') {
    return [
      ['How was your day?', '오늘 하루를 한두 문장으로 설명해 보세요.'],
      ['What was the best part of your day?', '가장 좋았던 순간과 이유를 이야기해요.'],
      ['What would you like to do tomorrow?', '내일 하고 싶은 일을 설명해 보세요.'],
    ]
  }
  if (field === '취업 인터뷰') {
    return [
      ['Could you tell me a little about yourself?', '경험과 강점을 간단하게 소개해요.'],
      ['Tell me about a challenge you overcame.', '어려운 상황과 해결 과정을 설명해요.'],
      ['Why are you interested in this role?', '지원 동기를 구체적으로 말해보세요.'],
    ]
  }
  if (level === '초급') {
    return [
      ['What do you do at work?', '업무를 짧은 문장으로 소개해요.'],
      ['What tools do you use?', '자주 쓰는 도구를 말해보세요.'],
      ['What do you have to do today?', '오늘 해야 하는 일을 설명해요.'],
    ]
  }
  return [
    ['Tell me about a data project you worked on.', '최근 프로젝트의 목표와 맡은 역할을 설명해 보세요.'],
    ['What was the biggest challenge, and how did you solve it?', '문제 → 해결 과정 → 결과 순서로 이야기해요.'],
    [
      level === '고급'
        ? 'What trade-offs did you make, and how did you measure success?'
        : 'How would you explain the project to a non-technical colleague?',
      '한 단계 깊게, 선택의 이유나 쉬운 비유를 덧붙여요.',
    ],
  ]
}

export function correctText(original) {
  let corrected = original
  const notes = []
  for (const [pattern, replacement, note] of rules) {
    const expression = new RegExp(pattern.source, pattern.flags)
    const next = corrected.replace(expression, replacement)
    if (next !== corrected) notes.push(note)
    corrected = next
  }
  return {
    corrected,
    notes,
    changed: original !== corrected,
    note: notes.length
      ? notes.join(' ')
      : '등록된 규칙에 해당하는 오류가 없어요. 문장 전체가 정확하다는 판정은 아닙니다.',
  }
}
