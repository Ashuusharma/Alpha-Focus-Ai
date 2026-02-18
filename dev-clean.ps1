# Force stop any lingering Node.js processes that might lock the files
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment for processes to fully release locks
Start-Sleep -Seconds 1

# Remove the .next folder if it exists
if (Test-Path .next) {
    Write-Host "Cleaning .next cache..."
    Remove-Item .next -Recurse -Force
}

# Start the dev server
Write-Host "Starting dev server..."
npm run dev
