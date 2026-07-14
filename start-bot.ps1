# Starts the WhatsApp bot dev environment on Windows: cloudflared tunnel +
# Nuxt dev server + automatic Meta callback URL sync.
# Run via start-bot.bat (double-click) or: powershell -ExecutionPolicy Bypass -File start-bot.ps1
#
# The dev server opens in its own window; this window shows tunnel/Meta status.
# The tunnel keeps running in the background so its URL stays valid between restarts.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$TunnelLog = Join-Path $env:TEMP 'whatsapp-bot-tunnel.log'
$Port = 3000

function Get-EnvValue([string]$Key) {
    if (-not (Test-Path .env)) { return '' }
    $line = Select-String -Path .env -Pattern "^$Key=" | Select-Object -First 1
    if ($line) { return $line.Line.Substring($Key.Length + 1).Trim() }
    return ''
}

function Get-TunnelUrl {
    if (-not (Test-Path $TunnelLog)) { return $null }
    $match = Select-String -Path $TunnelLog -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
    if ($match) { return $match.Matches[0].Value }
    return $null
}

$AppId = Get-EnvValue 'META_APP_ID'
$AppSecret = Get-EnvValue 'NUXT_WHATSAPP_APP_SECRET'
$VerifyToken = Get-EnvValue 'NUXT_WHATSAPP_VERIFY_TOKEN'

# --- 1. Start or reuse the tunnel -------------------------------------------
if (Get-Process cloudflared -ErrorAction SilentlyContinue) {
    $Url = Get-TunnelUrl
    Write-Host "[OK] Tunnel already running: $Url"
}
else {
    Write-Host 'Starting cloudflared tunnel...'
    Remove-Item $TunnelLog -ErrorAction SilentlyContinue
    # cloudflared prints the URL on stderr
    Start-Process -FilePath 'cloudflared' `
        -ArgumentList 'tunnel', '--url', "http://localhost:$Port" `
        -RedirectStandardError $TunnelLog `
        -RedirectStandardOutput (Join-Path $env:TEMP 'whatsapp-bot-tunnel-out.log') `
        -WindowStyle Hidden
    $Url = $null
    for ($i = 0; $i -lt 30 -and -not $Url; $i++) {
        Start-Sleep -Seconds 1
        $Url = Get-TunnelUrl
    }
    if (-not $Url) {
        Write-Host "[X] Tunnel failed to start - see $TunnelLog"
        Read-Host 'Press Enter to close'
        exit 1
    }
    Write-Host "[OK] Tunnel URL: $Url"
}

# --- 2. Start the dev server in its own window ------------------------------
Write-Host 'Starting dev server in a new window...'
Start-Process -FilePath 'cmd' -ArgumentList '/k', 'pnpm dev'

# --- 3. Keep Meta's callback pointed at the current tunnel URL ---------------
if (-not ($AppId -and $AppSecret -and $VerifyToken -and $Url)) {
    Write-Host '[!] Missing META_APP_ID / app secret / verify token in .env -'
    Write-Host '    update the callback URL in Meta manually if the tunnel URL changed.'
    Read-Host 'Press Enter to close'
    exit 0
}

$Handshake = "/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=$VerifyToken&hub.challenge=ready"

Write-Host 'Waiting for the dev server...'
$ready = $false
for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
    try {
        if ((Invoke-RestMethod -Uri "http://localhost:$Port$Handshake" -TimeoutSec 5) -eq 'ready') { $ready = $true }
    }
    catch { Start-Sleep -Seconds 2 }
}

Write-Host 'Waiting for the tunnel to be publicly reachable (DNS can take a minute)...'
$publicOk = $false
for ($i = 0; $i -lt 24 -and -not $publicOk; $i++) {
    try {
        if ((Invoke-RestMethod -Uri "$Url$Handshake" -TimeoutSec 10) -eq 'ready') { $publicOk = $true }
    }
    catch { Start-Sleep -Seconds 5 }
}
if (-not $publicOk) {
    Write-Host "[X] Tunnel $Url never became publicly reachable - update the Meta callback URL manually."
    Read-Host 'Press Enter to close'
    exit 1
}

Write-Host 'Registering the callback URL with Meta...'
$registered = $false
for ($attempt = 1; $attempt -le 4 -and -not $registered; $attempt++) {
    try {
        $result = Invoke-RestMethod -Method Post -Uri "https://graph.facebook.com/v23.0/$AppId/subscriptions" -Body @{
            object       = 'whatsapp_business_account'
            callback_url = "$Url/api/whatsapp/webhook"
            verify_token = $VerifyToken
            fields       = 'messages'
            access_token = "$AppId|$AppSecret"
        }
        if ($result.success) { $registered = $true }
    }
    catch { Start-Sleep -Seconds 10 }
}

if ($registered) {
    Write-Host "[OK] Meta callback URL set to $Url/api/whatsapp/webhook"
    Write-Host 'All set - message your WhatsApp number to test. You can close this window.'
}
else {
    Write-Host '[X] Could not update the Meta callback URL after 4 attempts - set it manually in the Meta dashboard.'
}
Read-Host 'Press Enter to close'
