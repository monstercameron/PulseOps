$ErrorActionPreference = "Stop"

. "$PSScriptRoot/lib/local-postgres.ps1"

$connectionConfig = Get-LocalPostgresConnectionConfig
Invoke-LocalPostgresFile -Database $connectionConfig.Database -Path "infra/sql/verify-local-postgres.sql"
