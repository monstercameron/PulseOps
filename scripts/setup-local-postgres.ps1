$ErrorActionPreference = "Stop"

. "$PSScriptRoot/lib/local-postgres.ps1"

$repoRoot = Split-Path -Parent $PSScriptRoot
$connectionConfig = Get-LocalPostgresConnectionConfig
$databaseName = $connectionConfig.Database
$databaseExists = ((Invoke-LocalPostgresCommand -Database "postgres" -Sql "select 1 from pg_database where datname = '$databaseName';" -TuplesOnly) | Out-String).Trim()

if ($databaseExists -ne "1") {
  Invoke-LocalPostgresCommand -Database "postgres" -Sql "create database $databaseName;"
}

Invoke-LocalPostgresFile -Database $databaseName -Path "infra/sql/init-local-postgres.sql"

Push-Location $repoRoot
try {
  & npm.cmd run db:seed:ui-translations

  if ($LASTEXITCODE -ne 0) {
    throw "UI translation seed failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
