# Register OpsAgent tools and agents with Kibana Agent Builder API
# Usage: Set ES_API_KEY and KIBANA_URL, then run from opsagent-backend:
#   $env:KIBANA_URL = "https://your-kibana.kb...."
#   $env:ES_API_KEY = "your-api-key"
#   .\register-tools-and-agents.ps1

param(
    [string]$KibanaUrl = $env:KIBANA_URL,
    [string]$ApiKey = $env:ES_API_KEY
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ToolsDir = Join-Path $ScriptDir "tools"
$AgentsDir = Join-Path $ScriptDir "agents"

if (-not $KibanaUrl -or -not $ApiKey) {
    Write-Host "Set KIBANA_URL and ES_API_KEY (env or -KibanaUrl / -ApiKey)" -ForegroundColor Red
    exit 1
}

# Primary tools only (exclude *_fallback.json)
$ToolFiles = Get-ChildItem -Path $ToolsDir -Filter "*.json" | Where-Object { $_.Name -notmatch "_fallback\.json$" } | Sort-Object Name
$AgentFiles = Get-ChildItem -Path $AgentsDir -Filter "*.json" | Sort-Object Name

$Headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "ApiKey $ApiKey"
    "kbn-xsrf"      = "true"
}

# Register tools
Write-Host "`n--- Registering Tools ---" -ForegroundColor Green
foreach ($f in $ToolFiles) {
    $name = $f.BaseName
    try {
        $body = Get-Content -Path $f.FullName -Raw -Encoding UTF8
        $uri = "$KibanaUrl/api/agent_builder/tools"
        Invoke-RestMethod -Uri $uri -Method Post -Headers $Headers -Body $body | Out-Null
        Write-Host "  [OK] $name" -ForegroundColor Green
    } catch {
        $msg = $_.ErrorDetails.Message
        if ($msg -match "already exists") { Write-Host "  [OK] $name (already exists)" -ForegroundColor Green } else { Write-Host "  [FAIL] $name : $($_.Exception.Message)" -ForegroundColor Red }
    }
}

# Register agents
Write-Host "`n--- Registering Agents ---" -ForegroundColor Green
foreach ($f in $AgentFiles) {
    $name = $f.BaseName
    try {
        $body = Get-Content -Path $f.FullName -Raw -Encoding UTF8
        $uri = "$KibanaUrl/api/agent_builder/agents"
        Invoke-RestMethod -Uri $uri -Method Post -Headers $Headers -Body $body | Out-Null
        Write-Host "  [OK] $name" -ForegroundColor Green
    } catch {
        $msg = $_.ErrorDetails.Message
        if ($msg -match "already exists") { Write-Host "  [OK] $name (already exists)" -ForegroundColor Green } else { Write-Host "  [FAIL] $name : $($_.Exception.Message)" -ForegroundColor Red }
    }
}

Write-Host "`nDone. Open Kibana > Agents to chat with Triage Agent." -ForegroundColor Cyan
