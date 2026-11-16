@echo off
rem Compila Bot_web_angular in produzione e lo serve su http://localhost:4200
rem (la porta deve restare 4200: e' l'origine autorizzata dal CORS di Bot_web_api).
title Bot_web_angular (produzione) - http://localhost:4200
cd /d "%~dp0"
call npm run build || exit /b 1
call npx serve -s dist\bot-web-angular\browser -l 4200 --no-clipboard
