param(
  [ValidatePattern('^\d+\.\d+\.\d+$')]
  [string]$Version,

  [string]$Tool,

  [ValidatePattern('^\d+\.\d+\.\d+$')]
  [string]$ToolVersion,

  [Parameter(Mandatory = $true)]
  [string]$UpdateNote,

  [switch]$NoCacheBuster
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Replace-InFile {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Pattern,
    [Parameter(Mandatory = $true)][string]$Replacement
  )

  (Get-Content $Path -Raw) -replace $Pattern, $Replacement | Set-Content $Path -NoNewline
}

function Add-ReleaseEntry {
  param(
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][string]$Note
  )

  $today = Get-Date -Format 'dd MMMM yyyy'
  $homeFile = Join-Path $root 'content/home.md'
  $homeEntry = "- **$Title - $today** - $Note"
  $homeText = Get-Content $homeFile -Raw
  $homeText = $homeText -replace "(## Recent Updates\r?\n\r?\n)", "`$1$homeEntry`r`n"
  Set-Content $homeFile $homeText -NoNewline

  $changelogFile = Join-Path $root 'CHANGELOG.md'
  $changelogEntry = "## $Title - $today`r`n`r`n- $Note`r`n`r`n"
  $changelogText = Get-Content $changelogFile -Raw
  $changelogText = $changelogText -replace "(All notable user-facing changes to eDM Helper are tracked here\.\r?\n\r?\n)", "`$1$changelogEntry"
  Set-Content $changelogFile $changelogText -NoNewline
}

function Update-CacheBusters {
  param([Parameter(Mandatory = $true)][string]$NewVersion)

  if ($NoCacheBuster) { return }

  $assetFiles = @(
    (Join-Path $root 'index.html'),
    (Join-Path $root '404.html')
  ) + (Get-ChildItem (Join-Path $root 'tools') -Filter '*.html' | ForEach-Object { $_.FullName })

  foreach ($file in $assetFiles) {
    Replace-InFile -Path $file -Pattern '\?v=\d+\.\d+\.\d+' -Replacement "?v=$NewVersion"
  }
}

if ($Tool -and -not $ToolVersion) {
  throw 'Use -ToolVersion when releasing a specific tool.'
}

if (-not $Tool -and -not $Version) {
  throw 'Use -Version for a Core release, or -Tool and -ToolVersion for a tool release.'
}

if ($Version) {
  $versionConfig = Join-Path $root 'js/version-config.js'
  Replace-InFile -Path $versionConfig -Pattern "version: '\d+\.\d+\.\d+'" -Replacement "version: '$Version'"
  $toolVersions = Join-Path $root 'js/tool-versions.js'
  Replace-InFile -Path $toolVersions -Pattern "(core\s*:\s*\{[\s\S]*?version:\s*)'\d+\.\d+\.\d+'" -Replacement "`${1}'$Version'"
  Update-CacheBusters -NewVersion $Version
  Add-ReleaseEntry -Title "Core v$Version" -Note $UpdateNote
  Write-Host "Updated Core release metadata to v$Version."
}

if ($Tool) {
  $toolVersions = Join-Path $root 'js/tool-versions.js'
  $toolPattern = "('$([regex]::Escape($Tool))'\s*:\s*\{[\s\S]*?version:\s*)'\d+\.\d+\.\d+'"
  $toolReplacement = "`${1}'$ToolVersion'"
  Replace-InFile -Path $toolVersions -Pattern $toolPattern -Replacement $toolReplacement

  $toolLabel = (Get-Culture).TextInfo.ToTitleCase(($Tool -replace '-', ' '))
  Add-ReleaseEntry -Title "$toolLabel v$ToolVersion" -Note $UpdateNote
  Write-Host "Updated $Tool release metadata to v$ToolVersion."
}

Write-Host 'Run checks before commit:'
Write-Host '  node --test tests/*.test.js'
Write-Host '  git diff --check'
