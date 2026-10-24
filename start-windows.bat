@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js가 필요합니다. https://nodejs.org 에서 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)
if not exist node_modules (
  echo 패키지를 설치합니다...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo 브라우저에서 http://127.0.0.1:5173 을 여세요.
echo 종료하려면 이 창에서 Ctrl+C 를 누르세요.
call npm run dev
pause
