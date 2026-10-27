# Lingo Loop

매일 조금씩 말하는 영어 학습 앱입니다. React와 Vite로 동작하고, Supabase를 연결하면 계정별로 학습 기록이 동기화됩니다. 키를 넣지 않으면 이전처럼 이 브라우저에만 저장됩니다.

## 실행

Node.js가 필요합니다.

```sh
npm install
npm run dev
```

브라우저에서 http://127.0.0.1:5173 을 엽니다. Windows에서는 `start-windows.bat`을 실행해도 됩니다.

```sh
npm run build
npm run preview
```

## Supabase 연결

1. [Supabase](https://supabase.com)에서 프로젝트를 만듭니다.
2. SQL Editor에 `supabase/schema.sql` 전체를 붙여 넣고 실행합니다.
3. Project Settings → API에서 Project URL과 **anon public** 키를 복사합니다. `service_role` 키는 브라우저에 넣지 마세요.
4. `.env.example`을 `.env.local`로 복사하고 두 값을 채웁니다.
5. 개발 서버를 다시 시작합니다.
6. 앱에서는 이메일 대신 아이디와 비밀번호로 가입합니다. 가입 직후 들어가지지 않으면 SQL Editor에서 `supabase/schema.sql`을 한 번 더 실행하세요.

`.env.local`이 없으면 로그인 없이 동작하고, 기록은 `localStorage` 키 `lingoloop-v1`에 남습니다. 예전에 저장해 둔 기록은 첫 로그인 때 그 계정으로 한 번 옮겨집니다. 계정에 이미 기록이 있으면 덮어쓰지 않습니다.

테이블은 행 단위 보안이 켜져 있어 로그인한 사용자는 자신의 프로필, 학습 기록, 스크립트, 복습만 읽고 쓸 수 있습니다.

## 파일

- `src/`: 화면, 학습 로직, Supabase 저장
- `supabase/schema.sql`: 테이블, RLS, 가입 시 프로필 생성, 기존 브라우저 기록 이전
- `src/lib/content.js`: 분야별 질문, 교정 규칙, 복습 문제
- `.env.example`: Supabase 주소와 anon 키 예시

## 지금 되는 것

- 분야와 수준에 맞춘 말하기 연습, 브라우저 음성 인식, 영국 영어 읽어 주기
- 원문 저장과 제한된 문법 규칙 교정, 스크립트 복사
- 표현 퀴즈, 학습 시간 기록, 하루 목표, JSON 내보내기
- 페이지를 열어 둔 동안 설정한 시각에 알림
- Supabase 계정 로그인 후 기기 간 기록 동기화

자유 대화 AI, 전체 문법·발음 평가, 앱을 닫은 뒤의 푸시 알림은 아직 없습니다.
