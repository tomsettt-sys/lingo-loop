export function SetupSteps() {
  return (
    <ol>
      <li>Supabase에서 새 프로젝트를 만듭니다.</li>
      <li>SQL Editor에 <code>supabase/schema.sql</code> 전체를 붙여 넣고 실행합니다.</li>
      <li>Project Settings → API에서 Project URL과 anon public key를 복사합니다.</li>
      <li><code>.env.example</code>을 <code>.env.local</code>로 복사한 뒤 두 값을 넣습니다.</li>
      <li>개발 서버를 다시 시작합니다. 가입은 아이디와 비밀번호로 합니다.</li>
    </ol>
  )
}
