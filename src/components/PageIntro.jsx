import { formatKoreanDate } from '../lib/dates'

export function PageIntro({ title, desc }) {
  return (
    <div className="intro">
      <div>
        <div className="eyebrow">YOUR ENGLISH, A LITTLE BETTER.</div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      <span className="date">{formatKoreanDate()}</span>
    </div>
  )
}
