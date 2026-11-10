@echo off
REM Arranca sim-web: backend NestJS (puerto 3000) y frontend Next.js (puerto 3001)
cd /d "%~dp0"

echo Verificando dependencias del backend...
pushd backend & call npm install --no-audit --no-fund & popd
echo Verificando dependencias del frontend...
pushd frontend & call npm install --no-audit --no-fund & popd

start "SIM-WEB backend :3000" cmd /k "cd /d "%~dp0backend" && npm run start:dev"
timeout /t 8 /nobreak >nul
start "SIM-WEB frontend :3001" cmd /k "cd /d "%~dp0frontend" && npm run dev -- -p 3001"

echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3001
echo Puedes cerrar esta ventana; los servidores siguen en sus propias ventanas.
timeout /t 10
