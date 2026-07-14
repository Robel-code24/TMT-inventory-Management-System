# Start the Inventory Management frontend
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path node_modules)) {
    & npm.cmd install
}

& npm.cmd run dev -- --host 0.0.0.0 --port 5173
