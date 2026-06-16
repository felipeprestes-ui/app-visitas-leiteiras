#!/usr/bin/env pwsh
# Script para compactar o portal web para upload no GitHub
# Uso: powershell -File build-web-zip.ps1

param(
    [string]$OutPath = "web-portal.zip"
)

$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\prestesf\Projects\app-visitas-leiteiras"
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("web-upload-" + [Guid]::NewGuid().ToString().Substring(0,8))

Write-Host "=== Empacotando portal web para GitHub ===" -ForegroundColor Cyan

# Create temp structure
$appsWebTarget = Join-Path $tempDir "apps\web"
$ghWorkflowsTarget = Join-Path $tempDir ".github\workflows"
New-Item -ItemType Directory -Path $appsWebTarget -Force | Out-Null
New-Item -ItemType Directory -Path $ghWorkflowsTarget -Force | Out-Null

# Copy entire apps/web folder
$webSource = Join-Path $projectRoot "apps\web"
Get-ChildItem $webSource -Recurse | ForEach-Object {
    $target = $_.FullName.Replace($webSource, $appsWebTarget)
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
    } else {
        Copy-Item $_.FullName -Destination $target -Force
    }
}
Write-Host "Copied apps/web/ ($((Get-ChildItem $appsWebTarget -Recurse -File).Count) files)" -ForegroundColor Green

# Copy workflow
$workflowSource = Join-Path $projectRoot ".github\workflows\deploy-web.yml"
Copy-Item $workflowSource -Destination $ghWorkflowsTarget -Force
Write-Host "Copied deploy-web.yml workflow" -ForegroundColor Green

# Copy corrected App.js standalone
$appJsSource = Join-Path $projectRoot "standalone\App.js"
Copy-Item $appJsSource -Destination (Join-Path $tempDir "App.js.new") -Force
Write-Host "Copied App.js (standalone)" -ForegroundColor Green

# Show file count for verification
$all = Get-ChildItem $tempDir -Recurse -File
Write-Host ""
Write-Host "Total files ready: $($all.Count)" -ForegroundColor Cyan

# Create ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $OutPath) { Remove-Item $OutPath -Force }

$OutPathFull = Join-Path $projectRoot $OutPath
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $OutPathFull)

Write-Host ""
Write-Host "=== ZIP created successfully ===" -ForegroundColor Cyan
Write-Host "Path: $OutPathFull"
Write-Host ""

# Cleanup
Remove-Item $tempDir -Recurse -Force
