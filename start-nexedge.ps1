$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$runtimeDir = Join-Path $projectRoot ".runtime"
$started = [System.Collections.Generic.List[object]]::new()

$requiredFolders = @(
  "Backend\node_modules",
  "CDN\edge-server\node_modules",
  "CDN\cdn-router\node_modules",
  "Frontend\node_modules"
)

foreach ($folder in $requiredFolders) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $folder))) {
    throw "Missing $folder. Run npm install in that folder first."
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "Backend\.env"))) {
  throw "Backend/.env is missing. Add the database, JWT and ImageKit values first."
}

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

function Test-Port([int]$Port) {
  return [bool](
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    | Select-Object -First 1
  )
}

function Start-ServiceProcess {
  param(
    [string]$Name,
    [int]$Port,
    [string]$WorkingDirectory,
    [string[]]$Arguments,
    [hashtable]$Environment = @{}
  )

  if (Test-Port $Port) {
    Write-Host "[ready] $Name is already using port $Port" -ForegroundColor DarkGreen
    return
  }

  $slug = $Name.ToLowerInvariant().Replace(" ", "-")
  $process = Start-Process `
    -FilePath "node.exe" `
    -ArgumentList $Arguments `
    -WorkingDirectory $WorkingDirectory `
    -Environment $Environment `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $runtimeDir "$slug.log") `
    -RedirectStandardError (Join-Path $runtimeDir "$slug.error.log") `
    -PassThru

  $started.Add([pscustomobject]@{ Name = $Name; Port = $Port; Process = $process })
  Write-Host "[start] $Name on port $Port" -ForegroundColor Green
}

function Start-Edge {
  param(
    [string]$Name,
    [int]$Port,
    [double]$Latitude,
    [double]$Longitude,
    [string]$CacheFolder
  )

  Start-ServiceProcess `
    -Name "$Name edge" `
    -Port $Port `
    -WorkingDirectory (Join-Path $projectRoot "CDN\edge-server") `
    -Arguments @("src/server.js") `
    -Environment @{
      EDGE_NAME = $Name
      EDGE_PORT = [string]$Port
      EDGE_LAT = [string]$Latitude
      EDGE_LNG = [string]$Longitude
      CACHE_DIR = "./cache-data/$CacheFolder"
      CACHE_TTL_SECONDS = "300"
    }
}

try {
  Start-ServiceProcess `
    -Name "Backend" `
    -Port 3000 `
    -WorkingDirectory (Join-Path $projectRoot "Backend") `
    -Arguments @("server.js")

  Start-Edge "Delhi" 5001 28.6139 77.2090 "delhi"
  Start-Edge "Mumbai" 5002 19.0760 72.8777 "mumbai"
  Start-Edge "Kolkata" 5003 22.5726 88.3639 "kolkata"
  Start-Edge "Bangalore" 5004 12.9716 77.5946 "bangalore"
  Start-Edge "Chennai" 5005 13.0827 80.2707 "chennai"

  Start-ServiceProcess `
    -Name "CDN router" `
    -Port 6000 `
    -WorkingDirectory (Join-Path $projectRoot "CDN\cdn-router") `
    -Arguments @("src/server.js") `
    -Environment @{ ROUTER_PORT = "6000"; ORIGIN_URL = "http://localhost:3000" }

  Start-ServiceProcess `
    -Name "Frontend" `
    -Port 5173 `
    -WorkingDirectory (Join-Path $projectRoot "Frontend") `
    -Arguments @("node_modules/vite/bin/vite.js", "--host", "localhost")

  Write-Host ""
  Write-Host "NexEdge is starting at http://localhost:5173" -ForegroundColor Cyan
  Write-Host "Runtime logs: $runtimeDir"
  Write-Host "Press Ctrl+C to stop services started by this script."

  while ($true) {
    Start-Sleep -Seconds 1
  }
} finally {
  Write-Host ""
  Write-Host "Stopping NexEdge services..."

  foreach ($service in $started) {
    if (-not $service.Process.HasExited) {
      Stop-Process -Id $service.Process.Id -Force -ErrorAction SilentlyContinue
    }
  }
}
