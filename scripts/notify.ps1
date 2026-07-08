<#
  Windows Toast Notification Script for Claude Code
  Usage from PowerShell: .\notify.ps1 -Message "Your message here"
  Usage from bash:       powershell -File scripts/notify.ps1 -Message "Your message here"
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "Task completed"
)

$Title = "Claude Code"

# --- Play a system notification sound ---
# Uses the .NET System.Media.SoundPlayer with a Windows system sound file.
# The "Notify" sound is a short chime that exists on default Windows 10 installs.
$SystemSoundPath = "$env:WINDIR\Media\notify.wav"

if (Test-Path $SystemSoundPath) {
    $Player = New-Object System.Media.SoundPlayer $SystemSoundPath
    $Player.Play()
} else {
    # Fallback: try another common system notification sound
    $AltSoundPath = "$env:WINDIR\Media\chimes.wav"
    if (Test-Path $AltSoundPath) {
        $Player = New-Object System.Media.SoundPlayer $AltSoundPath
        $Player.Play()
    }
}

# --- Show toast notification ---
# Strategy: use BurntToast module if available; otherwise fall back to the
# Windows.Forms approach which works without any extra packages on Windows 10.

try {
    # Check if BurntToast module is available (fast check, no side effects)
    $burntToast = Get-Module -ListAvailable -Name BurntToast -ErrorAction SilentlyContinue
    if ($burntToast) {
        Import-Module BurntToast -ErrorAction Stop
        New-BurntToastNotification -Text $Title, $Message -Sound 'Notification.Default'
        exit 0
    }
} catch {
    # BurntToast failed, fall through to the fallback method
}

# --- Fallback: use Windows Forms toast (no extra modules needed) ---
# This uses the ToastNotification API via .NET reflection, which works on
# Windows 10 without installing anything. It shows a proper Action Center toast.

Add-Type -AssemblyName System.Windows.Forms

# We need to access Windows.UI.Notifications via the WinRT projection.
# On Windows 10, the required types live in a runtime that PowerShell can
# reach through a known assembly path.
$null = [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]
$null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime]

# The AppId must match a registered app so the toast appears in Action Center
# and gets proper styling. We use PowerShell's own AppId which is always present.
$AppId = '{1AC14E77-02E7-4E5D-B744-2EB1D5A8B047}\WindowsPowerShell\v1.0\powershell.exe'

# Build the toast XML template (the standard two-line text template)
$ToastXml = @"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>$Title</text>
      <text>$Message</text>
    </binding>
  </visual>
  <audio src="ms-winsoundevent:Notification.Default"/>
</toast>
"@

$XmlDoc = New-Object Windows.Data.Xml.Dom.XmlDocument
$XmlDoc.LoadXml($ToastXml)

$Toast = New-Object Windows.UI.Notifications.ToastNotification $XmlDoc
$Toast.Tag = 'ClaudeCode'

[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($AppId).Show($Toast)
