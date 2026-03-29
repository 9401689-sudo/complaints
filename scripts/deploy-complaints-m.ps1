param(
  [string]$HostName = "oigoabtsgr",
  [string]$RemoteDir = "/var/www/complaints-backend/complaints_m",
  [string]$Branch = "multi-user",
  [string]$ServiceName = "complaints-backend-m"
)

$ErrorActionPreference = "Stop"

Write-Host "Deploy host: $HostName"
Write-Host "Remote dir: $RemoteDir"
Write-Host "Branch: $Branch"

$remoteCommand = @"
cd '$RemoteDir' &&
git fetch origin &&
git checkout '$Branch' &&
git pull --ff-only origin '$Branch' &&
docker compose up -d --build &&
docker logs --tail=80 '$ServiceName'
"@

ssh $HostName $remoteCommand

Write-Host "Deploy completed."
