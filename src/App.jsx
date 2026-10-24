import { LogModal } from './components/LogModal'
import { SetupSteps } from './components/SetupSteps'
import { Sidebar } from './components/Sidebar'
import { useApp } from './context/AppContext'
import { pageTitles } from './lib/content'
import { Home } from './pages/Home'
import { Journal } from './pages/Journal'
import { Review } from './pages/Review'
import { Scripts } from './pages/Scripts'
import { Settings } from './pages/Settings'
import { Talk } from './pages/Talk'
import { AuthScreen } from './pages/Auth'

const pages = { home: Home, talk: Talk, scripts: Scripts, review: Review, journal: Journal, settings: Settings }

export default function App() {
  const {
    page,
    setPage,
    supabaseMode,
    booting,
    session,
    loadedUserId,
    loadError,
    retryLoad,
    signOut,
    toastMessage,
    toastOn,
  } = useApp()

  if (booting) return <Loading label="학습 공간을 준비하고 있어요." />
  if (supabaseMode === 'invalid') return <InvalidConfig />
  if (supabaseMode === 'remote' && !session) return <AuthScreen />
  if (supabaseMode === 'remote' && loadError) return <LoadError message={loadError} onRetry={retryLoad} onSignOut={signOut} />
  if (supabaseMode === 'remote' && loadedUserId !== session.user.id) return <Loading label="학습 기록을 불러오고 있어요." />

  const Page = pages[page] || Home

  return (
    <>
      <Sidebar />
      <main>
        <header>
          <span>{pageTitles[page]}</span>
          <div>
            <span className={supabaseMode === 'remote' ? 'private' : 'private local'}>
              {supabaseMode === 'remote' ? '● Supabase에 동기화' : '● 이 브라우저에 저장'}
            </span>
            <button className="icon" type="button" aria-label="설정" onClick={() => setPage('settings')}>⚙</button>
          </div>
        </header>
        <div id="view">
          <Page />
        </div>
        <footer>
          Make a little progress, every day.
          <span>{supabaseMode === 'remote' ? 'Lingo Loop · Supabase에 저장됩니다' : 'Lingo Loop · 브라우저에 기록이 저장됩니다'}</span>
        </footer>
      </main>
      <div id="toast" role="status" className={toastOn ? 'show' : ''}>{toastMessage}</div>
      <LogModal />
    </>
  )
}

function Loading({ label }) {
  return (
    <div className="loading-screen">
      <div>
        <div className="brand">
          <span className="logo">l∿</span>
          lingo loop
          <span className="dot">.</span>
        </div>
        <p>{label}</p>
      </div>
    </div>
  )
}

function InvalidConfig() {
  return (
    <div className="auth-screen">
      <section className="auth-card">
        <div className="brand">
          <span className="logo">l∿</span>
          lingo loop
          <span className="dot">.</span>
        </div>
        <h1>Supabase 설정을 확인해 주세요</h1>
        <p className="sub">.env.local의 주소나 anon 키가 비어 있거나 예시 값으로 남아 있어요.</p>
        <SetupSteps />
        <p className="sub">이 브라우저에만 저장해서 쓰려면 .env.local을 지우거나, 두 값을 모두 비운 뒤 서버를 다시 시작하세요.</p>
      </section>
    </div>
  )
}

function LoadError({ message, onRetry, onSignOut }) {
  return (
    <div className="auth-screen">
      <section className="auth-card">
        <h1>학습 기록을 불러오지 못했어요</h1>
        <p className="sub">{message}</p>
        <div className="actions">
          <button className="primary" type="button" onClick={onRetry}>다시 시도</button>
          <button className="outline" type="button" onClick={onSignOut}>로그아웃</button>
        </div>
      </section>
    </div>
  )
}
