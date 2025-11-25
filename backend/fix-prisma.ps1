# Скрипт для исправления проблемы с Prisma и OneDrive

Write-Host "Очистка временных файлов Prisma..." -ForegroundColor Yellow

# Остановить процессы Node.js
Get-Process | Where-Object {$_.ProcessName -match "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Очистить временные файлы
$paths = @(
    "node_modules\.prisma\client\query_engine-windows.dll.node.tmp*",
    "node_modules\prisma\engines\*\query_engine-windows.dll.node.tmp*",
    "node_modules\@prisma\.engines-*\query_engine-windows.dll.node.tmp*"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Get-ChildItem $path -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
        Write-Host "Очищено: $path" -ForegroundColor Green
    }
}

Write-Host "`nПопытка генерации Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate


