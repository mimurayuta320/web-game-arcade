function Get-CloudflaredExe {
  $fromCommand = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($fromCommand -and $fromCommand.Source) {
    return $fromCommand.Source
  }

  $candidates = @(
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe",
    "$env:ProgramFiles\cloudflared\cloudflared.exe",
    "$env:LOCALAPPDATA\Programs\cloudflared\cloudflared.exe"
  )

  foreach ($path in $candidates) {
    if (Test-Path $path) {
      return $path
    }
  }

  throw "cloudflared.exe not found. Run: winget install --id Cloudflare.cloudflared -e"
}

function Get-ProjectRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}
