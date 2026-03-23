param(
  [string]$OutputPath = "supabase-management-api-patch.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$templateDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $templateDir 'supabase-template-manifest.json'

if (-not (Test-Path $manifestPath)) {
  throw "Manifest not found: $manifestPath"
}

$manifest = Get-Content -Path $manifestPath -Raw | ConvertFrom-Json
$payload = [ordered]@{}

foreach ($sectionName in @('authentication', 'notifications')) {
  foreach ($entry in $manifest.$sectionName) {
    $filePath = Join-Path $templateDir $entry.file

    if (-not (Test-Path $filePath)) {
      throw "Template file not found: $filePath"
    }

    $html = Get-Content -Path $filePath -Raw

    if ($entry.PSObject.Properties.Name -contains 'enabledKey' -and $entry.enabledKey) {
      $payload[$entry.enabledKey] = $true
    }

    $payload[$entry.subjectKey] = $entry.subject
    $payload[$entry.contentKey] = $html
  }
}

$resolvedOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
  $OutputPath
} else {
  Join-Path $templateDir $OutputPath
}

$payload | ConvertTo-Json -Depth 8 | Set-Content -Path $resolvedOutputPath -Encoding UTF8
Write-Host "Generated Supabase Management API payload:" $resolvedOutputPath
