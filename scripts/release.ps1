param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^\d+\.\d+\.\d+$')]
  [string]$Version,

  [Parameter(Mandatory = $true)]
  [string]$UpdateNote
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$versionConfig = Join-Path $root 'js/version-config.js'
(Get-Content $versionConfig -Raw) `
  -replace "version: '\d+\.\d+\.\d+'", "version: '$Version'" |
  Set-Content $versionConfig -NoNewline

$assetFiles = @(
  'index.html',
  '404.html'
) + (Get-ChildItem (Join-Path $root 'tools') -Filter '*.html' | ForEach-Object { $_.FullName })

foreach ($file in $assetFiles) {
  $path = if ([System.IO.Path]::IsPathRooted($file)) { $file } else { Join-Path $root $file }
  (Get-Content $path -Raw) `
    -replace '\?v=\d+\.\d+\.\d+', "?v=$Version" |
    Set-Content $path -NoNewline
}

$home = Join-Path $root 'content/home.md'
$today = Get-Date -Format 'dd MMMM yyyy'
$entry = "- **v$Version · $today** - $UpdateNote"
$homeText = Get-Content $home -Raw
$homeText = $homeText -replace "(## Recent Updates\r?\n\r?\n)", "`$1$entry`r`n"
Set-Content $home $homeText -NoNewline

Write-Host "Updated release metadata to v$Version."
Write-Host "Run: node --test tests/*.test.js"
Write-Host "Then commit and push when ready."
