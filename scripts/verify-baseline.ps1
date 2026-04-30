param()

$ErrorActionPreference = "Stop"

function Step($text) {
  Write-Host "==> $text"
}

function Assert-LastExitCode($context) {
  if ($LASTEXITCODE -ne 0) {
    throw "$context failed with exit code $LASTEXITCODE"
  }
}

Step "Frontend syntax check"
$tmpDir = Join-Path $env:TEMP "complaintsm-baseline-check"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$tmpApp = Join-Path $tmpDir "app.mjs"
$tmpApi = Join-Path $tmpDir "api.mjs"
Copy-Item app.js $tmpApp -Force
Copy-Item api.js $tmpApi -Force
node --check $tmpApp
Assert-LastExitCode "ESM parse app.js"
node --check $tmpApi
Assert-LastExitCode "ESM parse api.js"
Remove-Item $tmpApp,$tmpApi -Force -ErrorAction SilentlyContinue

Step "Backend build check"
npm run build
Assert-LastExitCode "npm run build"

Step "Critical API surface check"
$requiredPatterns = @(
  "/auth/register",
  "/auth/login",
  "/auth/me",
  "/cases",
  "/admin/backups",
  "/admin/deleted"
)

foreach ($pattern in $requiredPatterns) {
  rg --fixed-strings --quiet --glob "src/modules/**/*.routes.ts" $pattern
  if ($LASTEXITCODE -ne 0) {
    throw "Missing expected API route pattern: $pattern"
  }
}

Step "Baseline verification passed"
