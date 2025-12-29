@echo off
:: Script de inicializacion para Vexa Marketplace
:: DEBE ejecutarse como Administrador la primera vez

echo.
echo ============================================
echo   VEXA MARKETPLACE - Inicializacion
echo ============================================
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Este script debe ejecutarse como Administrador.
    echo.
    echo Haz clic derecho en este archivo y selecciona
    echo "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

:: Verificar si Docker esta corriendo
docker info >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Docker no esta corriendo.
    echo Por favor inicia Docker Desktop y vuelve a ejecutar este script.
    echo.
    pause
    exit /b 1
)

echo [1/3] Configurando archivo hosts...

:: Verificar si ya existe la entrada
findstr /C:"vexa.test" C:\Windows\System32\drivers\etc\hosts >nul 2>&1
if %errorLevel% equ 0 (
    echo       - Las entradas ya existen en hosts
) else (
    :: Agregar las entradas
    echo.>> C:\Windows\System32\drivers\etc\hosts
    echo # Vexa Marketplace - Local Development>> C:\Windows\System32\drivers\etc\hosts
    echo 127.0.0.1    vexa.test>> C:\Windows\System32\drivers\etc\hosts
    echo 127.0.0.1    api.vexa.test>> C:\Windows\System32\drivers\etc\hosts
    echo       - Entradas agregadas a hosts
)

echo.
echo [2/3] Construyendo contenedores Docker...
echo       Esto puede tomar unos minutos...
echo.

cd /d "%~dp0"
docker-compose up -d --build

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Error al construir los contenedores.
    echo Revisa que el puerto 80 no este en uso.
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Esperando a que los servicios inicien...
timeout /t 10 /nobreak >nul

echo.
echo ============================================
echo   INICIALIZACION COMPLETADA
echo ============================================
echo.
echo   Accede a la aplicacion en:
echo.
echo   http://vexa.test
echo.
echo ============================================
echo.
echo   Comandos utiles:
echo   - Detener:    docker-compose down
echo   - Iniciar:    docker-compose up -d
echo   - Logs:       docker-compose logs -f
echo   - Reiniciar:  docker-compose restart
echo.
pause
