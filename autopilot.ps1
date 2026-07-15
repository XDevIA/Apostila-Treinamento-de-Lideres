$env:RTK_DISABLED = '1'

Write-Host "Waiting for npm install to finish..."
$timeout = 120
$sw = [Diagnostics.Stopwatch]::StartNew()
while (!(Test-Path "node_modules\vite\bin\vite.js") -and $sw.Elapsed.TotalSeconds -lt $timeout) {
    Start-Sleep -Seconds 2
}

if (!(Test-Path "node_modules\vite\bin\vite.js")) {
    Write-Host "NPM INSTALL FAILED OR TIMED OUT."
    exit 1
}

Write-Host "NPM INSTALL DONE. Building..."
npx vite build

Write-Host "BUILD DONE. Committing to Git..."
git add .
git commit -m "feat: Aplicação PWA Apostila Digital v2"
git push

Write-Host "ALL DONE!"
