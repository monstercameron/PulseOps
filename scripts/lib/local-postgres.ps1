$ErrorActionPreference = "Stop"

function Add-LocalPostgresBinToPath {
  $configuredBin = $env:BIZOPS_POSTGRES_BIN
  $postgresBin = if ([string]::IsNullOrWhiteSpace($configuredBin)) {
    "C:\Program Files\PostgreSQL\16\bin"
  } else {
    $configuredBin
  }

  if (Test-Path $postgresBin) {
    $env:Path = "$postgresBin;$env:Path"
  }
}

function Get-LocalPostgresPsql {
  Add-LocalPostgresBinToPath

  $psqlCommand = Get-Command psql -ErrorAction SilentlyContinue

  if ($null -eq $psqlCommand) {
    throw "Unable to locate psql. Set BIZOPS_POSTGRES_BIN to the PostgreSQL bin directory."
  }

  return $psqlCommand.Source
}

function Get-LocalPostgresConnectionConfig {
  return @{
    Database = if ([string]::IsNullOrWhiteSpace($env:BIZOPS_POSTGRES_DB)) {
      "bizopsaccelerator"
    } else {
      $env:BIZOPS_POSTGRES_DB
    }
    Host = if ([string]::IsNullOrWhiteSpace($env:BIZOPS_POSTGRES_HOST)) {
      "localhost"
    } else {
      $env:BIZOPS_POSTGRES_HOST
    }
    Port = if ([string]::IsNullOrWhiteSpace($env:BIZOPS_POSTGRES_PORT)) {
      "5432"
    } else {
      $env:BIZOPS_POSTGRES_PORT
    }
    User = if ([string]::IsNullOrWhiteSpace($env:BIZOPS_POSTGRES_USER)) {
      "postgres"
    } else {
      $env:BIZOPS_POSTGRES_USER
    }
  }
}

function New-LocalPostgresBaseArgs {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ConnectionConfig
  )

  return @(
    "-v", "ON_ERROR_STOP=1",
    "-h", $ConnectionConfig.Host,
    "-p", $ConnectionConfig.Port,
    "-U", $ConnectionConfig.User
  )
}

function Invoke-LocalPostgresCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Database,
    [Parameter(Mandatory = $true)]
    [string]$Sql,
    [switch]$TuplesOnly
  )

  $psql = Get-LocalPostgresPsql
  $connectionConfig = Get-LocalPostgresConnectionConfig
  $baseArgs = New-LocalPostgresBaseArgs -ConnectionConfig $connectionConfig
  $commandArgs = $baseArgs

  if ($TuplesOnly) {
    $commandArgs += @("-t", "-A")
  }

  $commandArgs += @("-d", $Database, "-c", $Sql)

  & $psql @commandArgs

  if ($LASTEXITCODE -ne 0) {
    throw "psql command failed with exit code $LASTEXITCODE."
  }
}

function Invoke-LocalPostgresFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Database,
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [hashtable]$Variables = @{}
  )

  $psql = Get-LocalPostgresPsql
  $connectionConfig = Get-LocalPostgresConnectionConfig
  $baseArgs = New-LocalPostgresBaseArgs -ConnectionConfig $connectionConfig
  $variableArgs = @()

  foreach ($entry in $Variables.GetEnumerator()) {
    $variableArgs += @("-v", "$($entry.Key)=$($entry.Value)")
  }

  $fileArgs = $baseArgs + $variableArgs + @("-d", $Database, "-f", $Path)

  & $psql @fileArgs

  if ($LASTEXITCODE -ne 0) {
    throw "psql file execution failed with exit code $LASTEXITCODE."
  }
}
