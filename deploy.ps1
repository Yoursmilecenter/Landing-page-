# Quick Deploy Script
cd "C:\Users\avico\Downloads\CLONE\Landing-page-"

Write-Host "Current branch:" -ForegroundColor Cyan
git branch --show-current

Write-Host "`nStatus:" -ForegroundColor Cyan
git status --short

$action = Read-Host "`nAction? (dev/prod/backup/status)"

switch ($action) {
    "dev" {
        git checkout development
        Write-Host "Switched to development. Make changes and push." -ForegroundColor Green
    }
    "prod" {
        git checkout main
        git merge development
        git push
        Write-Host "Deployed to production!" -ForegroundColor Green
    }
    "backup" {
        git checkout backup
        git merge main
        git push
        git checkout main
        Write-Host "Backup created!" -ForegroundColor Green
    }
    "status" {
        git log --oneline -5
    }
}
