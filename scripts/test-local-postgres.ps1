$ErrorActionPreference = "Stop"

. "$PSScriptRoot/lib/local-postgres.ps1"

$connectionConfig = Get-LocalPostgresConnectionConfig
Invoke-LocalPostgresFile -Database $connectionConfig.Database -Path "infra/sql/test-local-postgres.sql"
