# Start the Inventory Management API backend
Set-Location $PSScriptRoot
.\venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
