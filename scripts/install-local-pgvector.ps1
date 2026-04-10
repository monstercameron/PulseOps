$ErrorActionPreference = "Stop"

. "$PSScriptRoot/lib/local-postgres.ps1"

$repoRoot = Split-Path -Parent $PSScriptRoot
$pgvectorVersion = "v0.8.2"
$tempRoot = Join-Path $repoRoot ".tmp"
$pgvectorRoot = Join-Path $tempRoot "pgvector"
$vcvarsPath = "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
$postgresRoot = Split-Path -Parent (Get-LocalPostgresPsql)
$postgresRoot = Split-Path -Parent $postgresRoot

if (-not (Test-Path $vcvarsPath)) {
  throw "Unable to find vcvars64.bat at $vcvarsPath."
}

if (Test-Path $pgvectorRoot) {
  Remove-Item -Recurse -Force $pgvectorRoot
}

New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

try {
  git clone --depth 1 --branch $pgvectorVersion https://github.com/pgvector/pgvector.git $pgvectorRoot | Out-Host

  if ($LASTEXITCODE -ne 0) {
    throw "git clone failed with exit code $LASTEXITCODE."
  }

  $buildCommand = @(
    "`"$vcvarsPath`" >nul",
    "set `"PGROOT=$postgresRoot`"",
    "cd /d `"$pgvectorRoot`"",
    "nmake /F Makefile.win clean",
    "nmake /F Makefile.win",
    "nmake /F Makefile.win install"
  ) -join " && "

  cmd /c $buildCommand | Out-Host

  if ($LASTEXITCODE -ne 0) {
    throw "pgvector build or install failed with exit code $LASTEXITCODE."
  }

  $connectionConfig = Get-LocalPostgresConnectionConfig
  Invoke-LocalPostgresCommand -Database $connectionConfig.Database -Sql "create extension if not exists vector;"
} finally {
  if (Test-Path $pgvectorRoot) {
    Remove-Item -Recurse -Force $pgvectorRoot
  }
}
