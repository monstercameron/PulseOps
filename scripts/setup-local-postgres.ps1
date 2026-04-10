$ErrorActionPreference = "Stop"

. "$PSScriptRoot/lib/local-postgres.ps1"

$connectionConfig = Get-LocalPostgresConnectionConfig
$databaseName = $connectionConfig.Database
$databaseExists = ((Invoke-LocalPostgresCommand -Database "postgres" -Sql "select 1 from pg_database where datname = '$databaseName';" -TuplesOnly) | Out-String).Trim()

if ($databaseExists -ne "1") {
  Invoke-LocalPostgresCommand -Database "postgres" -Sql "create database $databaseName;"
}

Invoke-LocalPostgresFile -Database $databaseName -Path "infra/sql/init-local-postgres.sql"
