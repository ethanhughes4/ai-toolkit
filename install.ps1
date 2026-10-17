# Copies this toolkit's skills and agents into your personal Claude Code folder
# (~/.claude), so they work in every project.
# Run from the agent-toolkit folder:   .\install.ps1
# Re-run it every time you edit a skill or agent here.

$ErrorActionPreference = "Stop"

$toolkit   = $PSScriptRoot
$claudeDir = Join-Path $HOME ".claude"

foreach ($kind in @("skills", "agents")) {
    $source = Join-Path $toolkit $kind
    if (-not (Test-Path $source)) { continue }

    $target = Join-Path $claudeDir $kind
    New-Item -ItemType Directory -Force -Path $target | Out-Null

    Get-ChildItem -Path $source | ForEach-Object {
        $dest = Join-Path $target $_.Name
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        Copy-Item -Recurse -Force $_.FullName $dest
        Write-Host "Installed $kind/$($_.Name) -> $dest"
    }
}

Write-Host "`nDone. Restart Claude Code (or start a new session) to pick up changes."