@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules\@angular\core\package.json (
  echo First run: installing the Angular packages...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
call npm.cmd start
pause
