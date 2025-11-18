# Quick Deploy - Smile Center
# Safe 3-step workflow

cd "C:\Users\avico\Downloads\CLONE\Landing-page-"

Write-Host "`n=== SMILE CENTER DEPLOY ===" -ForegroundColor Cyan
Write-Host "Current branch: " -NoNewline
git branch --show-current

Write-Host "`n[1] Start Development (make changes safely)"
Write-Host "[2] Deploy to LIVE (after testing preview)"
Write-Host "[3] Create Backup"
Write-Host "[4] Emergency Rollback"
Write-Host "[5] Check Status"

$choice = Read-Host "`nSelect"

switch ($choice) {
    "1" {
        git checkout development
        Write-Host "`n✅ Switched to DEVELOPMENT" -ForegroundColor Green
        Write-Host "• Make your changes now" -ForegroundColor Yellow
        Write-Host "• When done: git add . && git commit -m 'description' && git push" -ForegroundColor Yellow
        Write-Host "• Then check preview URL in Vercel dashboard" -ForegroundColor Yellow
    }
    "2" {
        Write-Host "`n⚠️  This will deploy to LIVE site!" -ForegroundColor Red
        $confirm = Read-Host "Have you tested preview? (yes/no)"
        if ($confirm -eq "yes") {
            git checkout main
            git merge development
            git push
            Write-Host "`n✅ DEPLOYED TO LIVE!" -ForegroundColor Green
            Write-Host "Check: www.smilecenter.pro" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Cancelled. Test preview first!" -ForegroundColor Red
        }
    }
    "3" {
        git checkout backup
        git merge main
        git push
        git checkout main
        Write-Host "`n✅ Backup created!" -ForegroundColor Green
    }
    "4" {
        Write-Host "`n⚠️  EMERGENCY: Restore from backup?" -ForegroundColor Red
        $confirm = Read-Host "Type YES to confirm"
        if ($confirm -eq "YES") {
            git checkout main
            git reset --hard backup
            git push --force
            Write-Host "`n✅ Live site restored from backup!" -ForegroundColor Green
        }
    }
    "5" {
        Write-Host "`nRecent commits:" -ForegroundColor Cyan
        git log --oneline -5
        Write-Host "`nBranches:" -ForegroundColor Cyan
        git branch -v
    }
}
