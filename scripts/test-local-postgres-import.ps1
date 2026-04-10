$ErrorActionPreference = "Stop"

. "$PSScriptRoot/lib/local-postgres.ps1"

$connectionConfig = Get-LocalPostgresConnectionConfig
$repoRoot = Split-Path -Parent $PSScriptRoot
$assetPath = if ([string]::IsNullOrWhiteSpace($env:BIZOPS_IMPORT_ASSET)) {
  "assets/docs/10020Records.csv"
} else {
  $env:BIZOPS_IMPORT_ASSET
}
$resolvedAssetPath = (Resolve-Path $assetPath).ProviderPath.Replace("\", "/")
$escapedAssetLiteral = "'" + $resolvedAssetPath.Replace("'", "''") + "'"
$templatePath = Join-Path $repoRoot "infra/sql/test-local-postgres-import.sql"
$tempSqlPath = [System.IO.Path]::GetTempFileName().Replace(".tmp", ".sql")
$sqlTemplate = Get-Content $templatePath -Raw
$sqlContent = $sqlTemplate.Replace("__BIZOPS_IMPORT_ASSET_PATH__", $escapedAssetLiteral)

try {
  Set-Content -Path $tempSqlPath -Value $sqlContent -Encoding UTF8
  Invoke-LocalPostgresFile `
    -Database $connectionConfig.Database `
    -Path $tempSqlPath
} finally {
  if (Test-Path $tempSqlPath) {
    Remove-Item -Force $tempSqlPath
  }
}
