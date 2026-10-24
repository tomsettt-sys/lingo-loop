import { useApp } from '../context/AppContext'

const items = [
  ['home', '◫', '오늘의 학습'],
  ['talk', '◉', '코치와 대화'],
  ['scripts', '▤', '나의 스크립트'],
  ['review', '✧', '복습 스튜디오'],
  ['journal', '▦', '학습 기록'],
]

export function Sidebar() {
  const { page, setPage } = useApp()

  return (
    <aside>
      <a
        className="brand"
        href="#home"
        onClick={(event) => {
          event.preventDefault()
          setPage('home')
        }}
      >
        <span className="logo">l∿</span>
        lingo loop
        <span className="dot">.</span>
      </a>
      <div className="workspace">MY LEARNING SPACE</div>
      <nav>
        {items.map(([id, icon, label]) => (
          <button key={id} type="button" className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
            {icon} <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="side-note">
        <span>
          작은 대화가 만드는
          <br />
          큰 변화.
        </span>
        <p>
          완벽하지 않아도 괜찮아요.
          <br />
          오늘도 한 문장부터 시작해요.
        </p>
        <i>✳</i>
      </div>
      <button className="profile" type="button" onClick={() => setPage('settings')}>
        <span className="avatar">H</span>
        <span>
          Hyochan
          <small>나의 학습 설정 ↗</small>
        </span>
      </button>
    </aside>
  )
}
