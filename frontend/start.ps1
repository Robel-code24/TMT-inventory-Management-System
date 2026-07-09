# Start the Inventory Management frontend
Set-Location $PSScriptRoot
if (-not (Test-Path node_modules)) { npm install }
npm run dev
