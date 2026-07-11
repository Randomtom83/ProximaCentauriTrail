# watchdog.ps1 — external heartbeat watchdog for agentic-orchestration runs.
# Lives OUTSIDE the agent loop so a dead session cannot silence its own alarm.
#
# REGISTER (run once per project, elevated not required) — every 5 minutes:
#   schtasks /Create /TN "OrchWatchdog-<project>" /SC MINUTE /MO 5 /TR ^
#     "powershell -NoProfile -ExecutionPolicy Bypass -File \"<repo>\scripts\watchdog.ps1\" -HeartbeatPath \"<repo>\docs\heartbeat.txt\""
# UNREGISTER:
#   schtasks /Delete /TN "OrchWatchdog-<project>" /F
#
# Alerts: Windows toast (native, no modules) + writes docs/watchdog-alert.txt so the
# dashboard's stale badge has a companion marker. Ollama check runs only if -CheckOllama.

param(
    [Parameter(Mandatory = $true)][string]$HeartbeatPath,
    [int]$StaleMinutes = 20,
    [switch]$CheckOllama
)

function Show-Toast([string]$Title, [string]$Body) {
    try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
        $xml = @"
<toast><visual><binding template="ToastGeneric"><text>$Title</text><text>$Body</text></binding></visual></toast>
"@
        $doc = New-Object Windows.Data.Xml.Dom.XmlDocument
        $doc.LoadXml($xml)
        $toast = [Windows.UI.Notifications.ToastNotification]::new($doc)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Agentic Orchestration").Show($toast)
    } catch {
        # Headless / toast-unavailable fallback: msg to console session
        msg * "$Title — $Body" 2>$null
    }
}

$alertPath = Join-Path (Split-Path $HeartbeatPath) "watchdog-alert.txt"

if (-not (Test-Path $HeartbeatPath)) {
    Show-Toast "Orchestration watchdog" "No heartbeat file at $HeartbeatPath — run never started or wrong path."
    Set-Content $alertPath "MISSING $(Get-Date -Format o)"
    exit 1
}

# Prefer the ISO timestamp INSIDE the file (what the orchestrator claims); fall back to mtime.
$stale = $false
$raw = (Get-Content $HeartbeatPath -First 1).Trim()
try {
    $last = [DateTimeOffset]::Parse($raw)
    $ageMin = ((Get-Date) - $last.LocalDateTime).TotalMinutes
} catch {
    $ageMin = ((Get-Date) - (Get-Item $HeartbeatPath).LastWriteTime).TotalMinutes
}
if ($ageMin -gt $StaleMinutes) { $stale = $true }

if ($CheckOllama) {
    $ollama = Get-Process ollama -ErrorAction SilentlyContinue
    if (-not $ollama) {
        Show-Toast "Orchestration watchdog" "Ollama process not running — local/hybrid run may be wedged."
        Add-Content $alertPath "OLLAMA-DOWN $(Get-Date -Format o)"
    }
}

if ($stale) {
    $m = [math]::Round($ageMin)
    Show-Toast "Orchestration watchdog" "Heartbeat stale: $m min (threshold $StaleMinutes). Run may have silently died."
    Set-Content $alertPath "STALE ${m}min $(Get-Date -Format o)"
    exit 1
} else {
    if (Test-Path $alertPath) { Remove-Item $alertPath -ErrorAction SilentlyContinue }
    exit 0
}
