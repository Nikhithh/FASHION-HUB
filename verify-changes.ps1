# Fashion-Hub OpenCode Auto-Verifier
# Polls every 8s, checks changed files, notifies you

$ProjectRoot = "d:\Fashion-Hub"
$Backend     = $ProjectRoot + "\Backend"
$Frontend    = $ProjectRoot + "\Frontend"
$LogDir      = $ProjectRoot + "\.logs"
$LogFile     = $LogDir + "\verify-" + (Get-Date -Format "yyyy-MM-dd") + ".log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log([string]$msg, [string]$level) {
    if (-not $level) { $level = "INFO" }
    $ts   = Get-Date -Format "HH:mm:ss"
    $line = "[" + $ts + "][" + $level + "] " + $msg
    $color = "Cyan"
    if ($level -eq "PASS") { $color = "Green" }
    if ($level -eq "FAIL") { $color = "Red" }
    if ($level -eq "WARN") { $color = "Yellow" }
    Write-Host $line -ForegroundColor $color
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Show-Notify([string]$title, [string]$body, [string]$kind) {
    $sep = "=" * 50
    $col = "Yellow"
    if ($kind -eq "pass") { $col = "Green" }
    if ($kind -eq "fail") { $col = "Red" }
    Write-Host ""
    Write-Host $sep -ForegroundColor $col
    Write-Host ("  " + $title) -ForegroundColor $col
    Write-Host ("  " + $body)  -ForegroundColor White
    Write-Host $sep -ForegroundColor $col
    Write-Host ""
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $ico  = New-Object System.Windows.Forms.NotifyIcon
        $ico.Icon    = [System.Drawing.SystemIcons]::Information
        $ico.Visible = $true
        $tip  = [System.Windows.Forms.ToolTipIcon]::Info
        if ($kind -eq "fail") { $tip = [System.Windows.Forms.ToolTipIcon]::Warning }
        $ico.ShowBalloonTip(6000, $title, $body, $tip)
        Start-Sleep -Milliseconds 600
        $ico.Dispose()
    } catch {}
}

function Get-Snapshot([string]$root) {
    $map = @{}
    $items = Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Extension -match "\.(js|jsx|json|css)$" -and
            $_.FullName -notmatch "node_modules" -and
            $_.FullName -notmatch "\.git" -and
            $_.FullName -notmatch "\\dist\\" -and
            $_.FullName -notmatch "\\build\\"
        }
    foreach ($item in $items) {
        $map[$item.FullName] = $item.LastWriteTimeUtc.Ticks
    }
    return $map
}

function Test-Syntax([string[]]$files) {
    $errs = @()
    foreach ($f in $files) {
        if ($f -match "\.js$") {
            $out = & node --check $f 2>&1
            if ($LASTEXITCODE -ne 0) {
                $name = [System.IO.Path]::GetFileName($f)
                $errs += ($name + ": " + ($out -join " "))
            }
        }
    }
    return $errs
}

function Test-Build {
    Write-Log "Running frontend build..." "INFO"
    Push-Location $Frontend
    $out = & npm run build 2>&1
    $ok  = ($LASTEXITCODE -eq 0)
    Pop-Location
    $tail = ($out | Select-Object -Last 6) -join "`n"
    return @{ ok = $ok; output = $tail }
}

function Test-Structure([string]$file) {
    $issues = @()
    if (-not (Test-Path $file)) { return $issues }
    $text  = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if (-not $text) { return $issues }
    $name  = [System.IO.Path]::GetFileName($file)

    if ($file -match "Controller\.js$") {
        if ($text -notmatch "module\.exports") {
            $issues += ("No module.exports in " + $name)
        }
    }
    if ($file -match "Routes\.js$") {
        if ($text -notmatch "router\.(get|post|put|delete|patch)") {
            $issues += ("No route handlers in " + $name)
        }
        if ($text -notmatch "module\.exports") {
            $issues += ("No module.exports in " + $name)
        }
    }
    if ($file -match "middleware[\\/][^\\]+\.js$") {
        if ($text -notmatch "module\.exports") {
            $issues += ("No module.exports in middleware " + $name)
        }
    }
    if ($file -match "models[\\/][^\\]+\.js$") {
        if ($text -notmatch "mongoose\.model") {
            $issues += ("No mongoose.model export in " + $name)
        }
    }
    return $issues
}

# ---- Start ----
Write-Log "Fashion-Hub OpenCode Auto-Verifier STARTED" "INFO"
Write-Log ("Watching: " + $ProjectRoot) "INFO"
Write-Log "Polling every 8 seconds — press Ctrl+C to stop" "WARN"
Write-Host ""

$prev     = Get-Snapshot -root $ProjectRoot
$idleN    = 0

while ($true) {
    Start-Sleep -Seconds 8

    $curr    = Get-Snapshot -root $ProjectRoot
    $changed = [System.Collections.Generic.List[string]]::new()

    foreach ($k in $curr.Keys) {
        if (-not $prev.ContainsKey($k) -or $prev[$k] -ne $curr[$k]) {
            $changed.Add($k) | Out-Null
        }
    }
    foreach ($k in $prev.Keys) {
        if (-not $curr.ContainsKey($k) -and -not $changed.Contains($k)) {
            $changed.Add($k) | Out-Null
        }
    }

    if ($changed.Count -eq 0) {
        $idleN++
        if ($idleN % 75 -eq 0) { Write-Log "Still watching... no changes" "INFO" }
        $prev = $curr
        continue
    }

    $idleN = 0
    $n     = $changed.Count
    Write-Log ("Detected " + $n + " changed file(s) - waiting 10s for OpenCode to finish...") "WARN"
    foreach ($f in $changed) { Write-Log ("  -> " + [System.IO.Path]::GetFileName($f)) "INFO" }
    Start-Sleep -Seconds 10

    # Re-scan after settle
    $curr2 = Get-Snapshot -root $ProjectRoot
    foreach ($k in $curr2.Keys) {
        if ((-not $prev.ContainsKey($k) -or $prev[$k] -ne $curr2[$k]) -and -not $changed.Contains($k)) {
            $changed.Add($k) | Out-Null
        }
    }

    $passed = $true
    $report = [System.Collections.Generic.List[string]]::new()

    # 1. Syntax
    $beFiles = $changed | Where-Object { $_ -match "\\Backend\\" -and $_ -match "\.js$" }
    if ($beFiles) {
        $cnt = @($beFiles).Count
        Write-Log ("-- Syntax checking " + $cnt + " backend file(s)") "INFO"
        $synErrs = Test-Syntax -files @($beFiles)
        if ($synErrs.Count -gt 0) {
            $passed = $false
            foreach ($e in $synErrs) { Write-Log $e "FAIL"; $report.Add("FAIL Syntax: " + $e) | Out-Null }
        } else {
            Write-Log "Syntax OK" "PASS"
            $report.Add("PASS Syntax OK (" + $cnt + " files)") | Out-Null
        }
    }

    # 2. Structure
    $strIssues = [System.Collections.Generic.List[string]]::new()
    foreach ($f in $changed) {
        $issues = Test-Structure -file $f
        foreach ($i in $issues) { $strIssues.Add($i) | Out-Null }
    }
    if ($strIssues.Count -gt 0) {
        $passed = $false
        foreach ($i in $strIssues) { Write-Log $i "FAIL"; $report.Add("FAIL Structure: " + $i) | Out-Null }
    } elseif ($beFiles) {
        Write-Log "Module structure OK" "PASS"
        $report.Add("PASS Module exports OK") | Out-Null
    }

    # 3. Frontend build
    $feFiles = $changed | Where-Object { $_ -match "\\Frontend\\src\\" }
    if ($feFiles) {
        Write-Log "-- Frontend src changed, running build..." "INFO"
        $br = Test-Build
        if ($br.ok) {
            Write-Log "Frontend build PASSED" "PASS"
            $report.Add("PASS Frontend build OK") | Out-Null
        } else {
            $passed = $false
            Write-Log "Frontend build FAILED" "FAIL"
            Write-Log $br.output "FAIL"
            $report.Add("FAIL Frontend build failed") | Out-Null
        }
    }

    # Summary
    Write-Log ("-" * 45) "INFO"
    foreach ($r in $report) { Write-Log $r "INFO" }
    Write-Log ("-" * 45) "INFO"

    $summary = $report -join " | "
    if ($passed) {
        Write-Log "ALL CHECKS PASSED" "PASS"
        Show-Notify "OpenCode: All Checks PASSED" $summary "pass"
    } else {
        Write-Log "ISSUES DETECTED - check above" "FAIL"
        Show-Notify "OpenCode: Issues Found!" $summary "fail"
    }

    $prev = $curr2
}
