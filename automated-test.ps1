# Smile Center Portal - Automated Pre-Deployment Test Script
# Run this script to automatically validate project readiness
# Usage: powershell -ExecutionPolicy Bypass -File .\automated-test.ps1

Write-Host "`n" -NoNewline
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SMILE CENTER PORTAL - AUTOMATED TEST SUITE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`n"

$script:passCount = 0
$script:failCount = 0
$script:warnCount = 0
$script:issues = @()

function Test-Item {
    param(
        [string]$Category,
        [string]$TestName,
        [scriptblock]$TestBlock,
        [string]$Severity = "FAIL"  # FAIL or WARN
    )
    
    Write-Host "[TEST] " -NoNewline -ForegroundColor Yellow
    Write-Host "$Category > $TestName" -NoNewline
    
    try {
        $result = & $TestBlock
        if ($result) {
            Write-Host " ✓" -ForegroundColor Green
            $script:passCount++
            return $true
        } else {
            if ($Severity -eq "WARN") {
                Write-Host " ⚠" -ForegroundColor Yellow
                $script:warnCount++
            } else {
                Write-Host " ✗" -ForegroundColor Red
                $script:failCount++
            }
            $script:issues += "[$(if($Severity -eq 'WARN'){'WARN'}else{'FAIL'})] $Category > $TestName"
            return $false
        }
    } catch {
        Write-Host " ✗ (ERROR: $($_.Exception.Message))" -ForegroundColor Red
        $script:failCount++
        $script:issues += "[FAIL] $Category > $TestName - Error: $($_.Exception.Message)"
        return $false
    }
}

Write-Host "Starting automated tests...`n" -ForegroundColor Cyan

# ============================================
# SECTION 1: VERSION CONTROL & FILES
# ============================================
Write-Host "`n[SECTION 1] VERSION CONTROL & FILES" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Git" "Repository exists" {
    Test-Path ".git"
}

Test-Item "Git" "Backup branch exists" {
    $branches = git branch | Out-String
    $branches -match "backup"
}

Test-Item "Git" "Development branch exists" {
    $branches = git branch | Out-String
    $branches -match "development"
}

Test-Item "Git" "No uncommitted changes in tracked files" {
    $status = git status --porcelain | Where-Object { $_ -notmatch "^\?\?" }
    $status.Count -eq 0
} "WARN"

Test-Item "Files" "index.html exists" {
    Test-Path "index.html"
}

Test-Item "Files" "portal-login.html exists" {
    Test-Path "portal-login.html"
}

Test-Item "Files" "admin-panel.html exists" {
    Test-Path "admin-panel.html"
}

Test-Item "Files" "designer-portal.html exists" {
    Test-Path "designer-portal.html"
}

Test-Item "Files" "portal-dashboard.html exists" {
    Test-Path "portal-dashboard.html"
}

Test-Item "Files" "client-register.html exists" {
    Test-Path "client-register.html"
}

Test-Item "Files" "style.css exists" {
    Test-Path "style.css"
}

Test-Item "Files" "README.md exists" {
    Test-Path "README.md"
}

Test-Item "Assets" "Logo file exists (smilecenterlogo.png)" {
    Test-Path "smilecenterlogo.png"
}

# ============================================
# SECTION 2: HTML STRUCTURE & SYNTAX
# ============================================
Write-Host "`n[SECTION 2] HTML STRUCTURE & SYNTAX" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "HTML" "index.html has valid DOCTYPE" {
    $content = Get-Content "index.html" -Raw
    $content -match "<!DOCTYPE html>"
}

Test-Item "HTML" "portal-login.html has valid DOCTYPE" {
    $content = Get-Content "portal-login.html" -Raw
    $content -match "<!DOCTYPE html>"
}

Test-Item "HTML" "admin-panel.html has valid DOCTYPE" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "<!DOCTYPE html>"
}

Test-Item "HTML" "designer-portal.html has valid DOCTYPE" {
    $content = Get-Content "designer-portal.html" -Raw
    $content -match "<!DOCTYPE html>"
}

Test-Item "HTML" "portal-dashboard.html has valid DOCTYPE" {
    $content = Get-Content "portal-dashboard.html" -Raw
    $content -match "<!DOCTYPE html>"
}

Test-Item "HTML" "All HTML files link to style.css" {
    $files = @("index.html", "portal-login.html", "admin-panel.html", "designer-portal.html", "portal-dashboard.html")
    $allHaveCSS = $true
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        if ($content -notmatch 'href="style\.css"') {
            $allHaveCSS = $false
            break
        }
    }
    $allHaveCSS
}

Test-Item "HTML" "Logo references correct (smilecenterlogo.png)" {
    $files = @("index.html", "portal-login.html", "admin-panel.html", "designer-portal.html", "portal-dashboard.html")
    $allCorrect = $true
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        # Check for incorrect logo name
        if ($content -match 'smile-center-logo\.png' -and $content -notmatch 'smilecenterlogo\.png') {
            $allCorrect = $false
            break
        }
    }
    $allCorrect
}

# ============================================
# SECTION 3: FIREBASE CONFIGURATION
# ============================================
Write-Host "`n[SECTION 3] FIREBASE CONFIGURATION" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Firebase" "admin-panel.html has Firebase config" {
    $content = Get-Content "admin-panel.html" -Raw
    ($content -match "firebaseConfig") -and ($content -match "apiKey")
}

Test-Item "Firebase" "designer-portal.html has Firebase config" {
    $content = Get-Content "designer-portal.html" -Raw
    ($content -match "firebaseConfig") -and ($content -match "apiKey")
}

Test-Item "Firebase" "portal-dashboard.html has Firebase config" {
    $content = Get-Content "portal-dashboard.html" -Raw
    ($content -match "firebaseConfig") -and ($content -match "apiKey")
}

Test-Item "Firebase" "portal-login.html has Firebase config" {
    $content = Get-Content "portal-login.html" -Raw
    ($content -match "firebaseConfig") -and ($content -match "apiKey")
}

Test-Item "Firebase" "All configs use same projectId" {
    $files = @("admin-panel.html", "designer-portal.html", "portal-dashboard.html", "portal-login.html")
    $projectIds = @()
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        if ($content -match 'projectId:\s*["\']([^"\']+)["\']') {
            $projectIds += $matches[1]
        }
    }
    ($projectIds | Select-Object -Unique).Count -eq 1
}

# ============================================
# SECTION 4: AUTHENTICATION & ROUTING
# ============================================
Write-Host "`n[SECTION 4] AUTHENTICATION & ROUTING" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Auth" "portal-login.html has username conversion logic" {
    $content = Get-Content "portal-login.html" -Raw
    ($content -match '@smile\.local') -and ($content -match "includes\('@'\)")
}

Test-Item "Auth" "portal-login.html routes admins correctly" {
    $content = Get-Content "portal-login.html" -Raw
    $content -match "admin-panel\.html"
}

Test-Item "Auth" "portal-login.html routes designers correctly" {
    $content = Get-Content "portal-login.html" -Raw
    $content -match "designer-portal\.html"
}

Test-Item "Auth" "portal-login.html routes clients correctly" {
    $content = Get-Content "portal-login.html" -Raw
    $content -match "portal-dashboard\.html"
}

Test-Item "Auth" "admin-panel.html protects against non-admins" {
    $content = Get-Content "admin-panel.html" -Raw
    ($content -match "admins\.some") -and ($content -match "window\.location\.href")
}

Test-Item "Auth" "designer-portal.html protects against non-designers" {
    $content = Get-Content "designer-portal.html" -Raw
    ($content -match "designers\.some") -and ($content -match "window\.location\.href")
}

Test-Item "Auth" "All portals redirect to login if not authenticated" {
    $files = @("admin-panel.html", "designer-portal.html", "portal-dashboard.html")
    $allProtected = $true
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        if ($content -notmatch "portal-login\.html") {
            $allProtected = $false
            break
        }
    }
    $allProtected
}

# ============================================
# SECTION 5: ADMIN PANEL FEATURES
# ============================================
Write-Host "`n[SECTION 5] ADMIN PANEL FEATURES" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Admin" "Has Add Client button" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "openAddClientModal"
}

Test-Item "Admin" "Has designer assignment dropdown" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "assignDesigner"
}

Test-Item "Admin" "Has status update dropdown" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "updateStatus"
}

Test-Item "Admin" "Has urgent flag toggle" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "togglePriority.*urgent"
}

Test-Item "Admin" "Has VIP flag toggle" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "togglePriority.*vip"
}

Test-Item "Admin" "Has file management modal" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "openFilesModal"
}

Test-Item "Admin" "Has delete patient function" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "deletePatient"
}

Test-Item "Admin" "Has filter functionality" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "updateFilter"
}

Test-Item "Admin" "Has pagination" {
    $content = Get-Content "admin-panel.html" -Raw
    ($content -match "changePage") -and ($content -match "currentPage")
}

Test-Item "Admin" "Delete function removes Storage files" {
    $content = Get-Content "admin-panel.html" -Raw
    ($content -match "deleteObject") -and ($content -match "listAll")
}

# ============================================
# SECTION 6: DESIGNER PORTAL FEATURES
# ============================================
Write-Host "`n[SECTION 6] DESIGNER PORTAL FEATURES" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Designer" "Filters projects by assigned designer" {
    $content = Get-Content "designer-portal.html" -Raw
    $content -match "where\('assignedDesignerEmail'"
}

Test-Item "Designer" "Has file upload modal" {
    $content = Get-Content "designer-portal.html" -Raw
    $content -match "openUploadModal"
}

Test-Item "Designer" "Shows client remarks if present" {
    $content = Get-Content "designer-portal.html" -Raw
    $content -match "clientRemarks"
}

Test-Item "Designer" "Blocks STL upload until HTML approved" {
    $content = Get-Content "designer-portal.html" -Raw
    ($content -match "htmlApproved") -and ($content -match "Cannot upload STL")
}

Test-Item "Designer" "Changes status to awaiting-approval for HTML" {
    $content = Get-Content "designer-portal.html" -Raw
    $content -match "awaiting-client-approval"
}

Test-Item "Designer" "Changes status to completed for STL" {
    $content = Get-Content "designer-portal.html" -Raw
    ($content -match "hasSTL") -and ($content -match "status.*completed")
}

Test-Item "Designer" "Renames files to patient name" {
    $content = Get-Content "designer-portal.html" -Raw
    $content -match "currentPatientTitle.*ext"
}

# ============================================
# SECTION 7: CLIENT DASHBOARD FEATURES
# ============================================
Write-Host "`n[SECTION 7] CLIENT DASHBOARD FEATURES" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Client" "Filters projects by client email" {
    $content = Get-Content "portal-dashboard.html" -Raw
    $content -match "where\('clientEmail'"
}

Test-Item "Client" "Has New Patient button" {
    $content = Get-Content "portal-dashboard.html" -Raw
    $content -match "openNewProjectModal"
}

Test-Item "Client" "Has HTML preview & approval system" {
    $content = Get-Content "portal-dashboard.html" -Raw
    ($content -match "viewHtmlForApproval") -and ($content -match "approveDesign")
}

Test-Item "Client" "Has approve design function" {
    $content = Get-Content "portal-dashboard.html" -Raw
    $content -match "approveDesign"
}

Test-Item "Client" "Has request changes function" {
    $content = Get-Content "portal-dashboard.html" -Raw
    $content -match "submitRejection"
}

Test-Item "Client" "Saves client remarks to Firestore" {
    $content = Get-Content "portal-dashboard.html" -Raw
    ($content -match "clientRemarks") -and ($content -match "updateDoc")
}

Test-Item "Client" "Shows STL locked until HTML approved" {
    $content = Get-Content "portal-dashboard.html" -Raw
    $content -match "Approve HTML preview first"
}

Test-Item "Client" "Has two-column file display (HTML/STL)" {
    $content = Get-Content "portal-dashboard.html" -Raw
    ($content -match "Design Preview.*HTML") -and ($content -match "Final Files.*STL")
}

Test-Item "Client" "Has client file upload feature" {
    $content = Get-Content "portal-dashboard.html" -Raw
    $content -match "openClientUploadModal"
}

# ============================================
# SECTION 8: CSS & STYLING
# ============================================
Write-Host "`n[SECTION 8] CSS & STYLING" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "CSS" "Has color variables defined" {
    $content = Get-Content "style.css" -Raw
    ($content -match "--color-primary") -and ($content -match "--color-secondary")
}

Test-Item "CSS" "Has logo glow animation" {
    $content = Get-Content "style.css" -Raw
    $content -match "@keyframes logoGlow"
}

Test-Item "CSS" "Has fade-in animation" {
    $content = Get-Content "style.css" -Raw
    $content -match "@keyframes fadeIn"
}

Test-Item "CSS" "Has status badge styles" {
    $content = Get-Content "style.css" -Raw
    ($content -match "\.status-pending") -and ($content -match "\.status-completed")
}

Test-Item "CSS" "Has modal styles" {
    $content = Get-Content "style.css" -Raw
    ($content -match "\.modal") -and ($content -match "\.modal-content")
}

Test-Item "CSS" "Has button styles (primary/secondary)" {
    $content = Get-Content "style.css" -Raw
    ($content -match "\.btn-primary") -and ($content -match "\.btn-secondary")
}

Test-Item "CSS" "Has responsive design (media queries)" {
    $content = Get-Content "style.css" -Raw
    $content -match "@media.*max-width"
}

Test-Item "CSS" "Has file list styles" {
    $content = Get-Content "style.css" -Raw
    ($content -match "\.file-list") -and ($content -match "\.file-item")
}

# ============================================
# SECTION 9: JAVASCRIPT FUNCTIONS
# ============================================
Write-Host "`n[SECTION 9] JAVASCRIPT FUNCTIONS" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "JS" "Admin has loadData function" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "async function loadData"
}

Test-Item "JS" "Designer has loadData function" {
    $content = Get-Content "designer-portal.html" -Raw
    $content -match "async function loadData"
}

Test-Item "JS" "Client has loadData function" {
    $content = Get-Content "portal-dashboard.html" -Raw
    $content -match "async function loadData"
}

Test-Item "JS" "All portals have logout function" {
    $files = @("admin-panel.html", "designer-portal.html", "portal-dashboard.html")
    $allHaveLogout = $true
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        if ($content -notmatch "window\.logout.*signOut") {
            $allHaveLogout = $false
            break
        }
    }
    $allHaveLogout
}

Test-Item "JS" "File size formatting function exists" {
    $files = @("admin-panel.html", "designer-portal.html", "portal-dashboard.html")
    $anyHasFormatSize = $false
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        if ($content -match "function formatSize") {
            $anyHasFormatSize = $true
            break
        }
    }
    $anyHasFormatSize
}

# ============================================
# SECTION 10: FIREBASE IMPORTS
# ============================================
Write-Host "`n[SECTION 10] FIREBASE IMPORTS" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Firebase" "Admin imports Firebase modules" {
    $content = Get-Content "admin-panel.html" -Raw
    ($content -match "import.*firebase-app") -and 
    ($content -match "import.*firebase-auth") -and
    ($content -match "import.*firebase-storage") -and
    ($content -match "import.*firebase-firestore")
}

Test-Item "Firebase" "Designer imports Firebase modules" {
    $content = Get-Content "designer-portal.html" -Raw
    ($content -match "import.*firebase-app") -and 
    ($content -match "import.*firebase-auth") -and
    ($content -match "import.*firebase-storage") -and
    ($content -match "import.*firebase-firestore")
}

Test-Item "Firebase" "Client imports Firebase modules" {
    $content = Get-Content "portal-dashboard.html" -Raw
    ($content -match "import.*firebase-app") -and 
    ($content -match "import.*firebase-auth") -and
    ($content -match "import.*firebase-storage") -and
    ($content -match "import.*firebase-firestore")
}

Test-Item "Firebase" "Login imports Firebase Auth" {
    $content = Get-Content "portal-login.html" -Raw
    ($content -match "import.*firebase-app") -and 
    ($content -match "import.*firebase-auth")
}

# ============================================
# SECTION 11: CDN & EXTERNAL RESOURCES
# ============================================
Write-Host "`n[SECTION 11] CDN & EXTERNAL RESOURCES" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "CDN" "Admin panel has Font Awesome" {
    $content = Get-Content "admin-panel.html" -Raw
    $content -match "font-awesome.*css"
}

Test-Item "CDN" "Designer portal has Font Awesome" {
    $content = Get-Content "designer-portal.html" -Raw
    $content -match "font-awesome.*css"
}

Test-Item "CDN" "Client dashboard has Font Awesome" {
    $content = Get-Content "portal-dashboard.html" -Raw
    $content -match "font-awesome.*css"
}

Test-Item "CDN" "Firebase CDN version is 10.7.1" {
    $files = @("admin-panel.html", "designer-portal.html", "portal-dashboard.html", "portal-login.html")
    $allCorrectVersion = $true
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        if ($content -notmatch "firebasejs/10\.7\.1") {
            $allCorrectVersion = $false
            break
        }
    }
    $allCorrectVersion
}

# ============================================
# SECTION 12: SECURITY CHECKS
# ============================================
Write-Host "`n[SECTION 12] SECURITY CHECKS" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Security" "No hardcoded passwords in HTML" {
    $files = @("admin-panel.html", "designer-portal.html", "portal-dashboard.html", "portal-login.html")
    $noPasswords = $true
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        # Look for suspicious password patterns (not including form fields)
        if ($content -match 'password\s*[:=]\s*["\'][^"\']{6,}["\']') {
            $noPasswords = $false
            break
        }
    }
    $noPasswords
}

Test-Item "Security" "Password fields use type=password" {
    $files = @("portal-login.html", "admin-panel.html", "client-register.html")
    $allSecure = $true
    foreach ($file in $files) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            if ($content -match 'id=["\']password["\']' -and $content -notmatch 'type=["\']password["\']') {
                $allSecure = $false
                break
            }
        }
    }
    $allSecure
}

Test-Item "Security" "No innerHTML with user input (XSS check)" {
    $files = @("admin-panel.html", "designer-portal.html", "portal-dashboard.html")
    $noXSS = $true
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        # Check for dangerous innerHTML usage (basic check)
        if ($content -match '\.innerHTML\s*=\s*[^`"\']*\$\{.*project\.' -and $content -notmatch 'textContent') {
            $noXSS = $false
            break
        }
    }
    $noXSS
} "WARN"

# ============================================
# SECTION 13: FILE ORGANIZATION
# ============================================
Write-Host "`n[SECTION 13] FILE ORGANIZATION" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Files" "No duplicate HTML files" {
    $htmlFiles = Get-ChildItem -Filter "*.html"
    $names = $htmlFiles | Select-Object -ExpandProperty Name
    ($names | Group-Object | Where-Object { $_.Count -gt 1 }).Count -eq 0
}

Test-Item "Files" "No backup files (*.bak, *.old)" {
    $backupFiles = Get-ChildItem -Filter "*.bak","*.old" -ErrorAction SilentlyContinue
    $backupFiles.Count -eq 0
}

Test-Item "Files" "No temp files (*.tmp)" {
    $tempFiles = Get-ChildItem -Filter "*.tmp" -ErrorAction SilentlyContinue
    $tempFiles.Count -eq 0
}

# ============================================
# SECTION 14: CRITICAL FUNCTIONALITY
# ============================================
Write-Host "`n[SECTION 14] CRITICAL FUNCTIONALITY" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Critical" "Admin can assign designers" {
    $content = Get-Content "admin-panel.html" -Raw
    ($content -match "assignedDesignerEmail") -and ($content -match "updateDoc")
}

Test-Item "Critical" "Admin can update status" {
    $content = Get-Content "admin-panel.html" -Raw
    ($content -match "updateStatus") -and ($content -match "newStatus")
}

Test-Item "Critical" "Designer file upload updates status" {
    $content = Get-Content "designer-portal.html" -Raw
    ($content -match "updateData\.status") -and ($content -match "updateDoc")
}

Test-Item "Critical" "Client HTML approval sets htmlApproved" {
    $content = Get-Content "portal-dashboard.html" -Raw
    ($content -match "htmlApproved:\s*true") -and ($content -match "approveDesign")
}

Test-Item "Critical" "Client rejection saves remarks" {
    $content = Get-Content "portal-dashboard.html" -Raw
    ($content -match "clientRemarks:\s*remarks") -and ($content -match "submitRejection")
}

Test-Item "Critical" "Files upload to correct Storage path" {
    $files = @("admin-panel.html", "designer-portal.html", "portal-dashboard.html")
    $allCorrectPath = $true
    foreach ($file in $files) {
        $content = Get-Content $file -Raw
        if ($content -match "ref\(storage" -and $content -notmatch "projects/\$\{.*projectId") {
            $allCorrectPath = $false
            break
        }
    }
    $allCorrectPath
}

# ============================================
# SECTION 15: LANDING PAGE
# ============================================
Write-Host "`n[SECTION 15] LANDING PAGE" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Test-Item "Landing" "index.html redirects to login" {
    $content = Get-Content "index.html" -Raw
    $content -match "portal-login\.html"
}

Test-Item "Landing" "index.html has logo with correct path" {
    $content = Get-Content "index.html" -Raw
    $content -match 'src=["\']smilecenterlogo\.png["\']'
}

Test-Item "Landing" "index.html is clickable" {
    $content = Get-Content "index.html" -Raw
    $content -match 'onclick=["\'].*window\.location'
}

# ============================================
# FINAL REPORT
# ============================================
Write-Host "`n"
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "              TEST SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`n"

$totalTests = $script:passCount + $script:failCount + $script:warnCount
$passPercent = if ($totalTests -gt 0) { [math]::Round(($script:passCount / $totalTests) * 100, 1) } else { 0 }

Write-Host "Total Tests Run:     $totalTests" -ForegroundColor White
Write-Host "Tests Passed:        " -NoNewline
Write-Host "$script:passCount" -ForegroundColor Green
Write-Host "Tests Failed:        " -NoNewline
Write-Host "$script:failCount" -ForegroundColor Red
Write-Host "Warnings:            " -NoNewline
Write-Host "$script:warnCount" -ForegroundColor Yellow
Write-Host "Success Rate:        " -NoNewline
Write-Host "$passPercent%" -ForegroundColor $(if($passPercent -ge 90){"Green"}elseif($passPercent -ge 70){"Yellow"}else{"Red"})

Write-Host "`n"

if ($script:failCount -gt 0 -or $script:warnCount -gt 0) {
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "                ISSUES FOUND" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "`n"
    
    foreach ($issue in $script:issues) {
        if ($issue -match "^\[FAIL\]") {
            Write-Host $issue -ForegroundColor Red
        } elseif ($issue -match "^\[WARN\]") {
            Write-Host $issue -ForegroundColor Yellow
        }
    }
    Write-Host "`n"
}

# ============================================
# DEPLOYMENT RECOMMENDATION
# ============================================
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "           DEPLOYMENT RECOMMENDATION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`n"

if ($script:failCount -eq 0) {
    Write-Host "✓ READY FOR DEPLOYMENT" -ForegroundColor Green
    Write-Host "`n"
    Write-Host "All critical tests passed. The application is ready to:" -ForegroundColor White
    Write-Host "  1. Update backup branch" -ForegroundColor White
    Write-Host "  2. Push to production" -ForegroundColor White
    Write-Host "  3. Deploy to GitHub Pages" -ForegroundColor White
    
    if ($script:warnCount -gt 0) {
        Write-Host "`n"
        Write-Host "⚠ Note: There are $script:warnCount warnings. Review them before deployment." -ForegroundColor Yellow
    }
} elseif ($script:failCount -le 5) {
    Write-Host "⚠ REVIEW REQUIRED" -ForegroundColor Yellow
    Write-Host "`n"
    Write-Host "Found $script:failCount issue(s) that should be reviewed:" -ForegroundColor White
    Write-Host "  • Check the issues list above" -ForegroundColor White
    Write-Host "  • Fix critical issues" -ForegroundColor White
    Write-Host "  • Re-run this test" -ForegroundColor White
    Write-Host "  • Consider deploying if issues are minor" -ForegroundColor White
} else {
    Write-Host "✗ NOT READY FOR DEPLOYMENT" -ForegroundColor Red
    Write-Host "`n"
    Write-Host "Found $script:failCount critical issue(s):" -ForegroundColor White
    Write-Host "  • Review and fix all issues above" -ForegroundColor White
    Write-Host "  • Re-run this test suite" -ForegroundColor White
    Write-Host "  • Do NOT deploy until all tests pass" -ForegroundColor White
}

Write-Host "`n"
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`n"

# ============================================
# NEXT STEPS
# ============================================
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($script:failCount -eq 0) {
    Write-Host "1. Perform manual browser testing (login, file upload, etc.)" -ForegroundColor White
    Write-Host "2. Check PRE-DEPLOYMENT-CHECKLIST.md for user testing scenarios" -ForegroundColor White
    Write-Host "3. If satisfied, run deployment commands:" -ForegroundColor White
    Write-Host "   git add ." -ForegroundColor Gray
    Write-Host "   git commit -m 'Pre-deployment validation passed'" -ForegroundColor Gray
    Write-Host "   git push origin development" -ForegroundColor Gray
    Write-Host "4. Consider merging to backup/main when ready" -ForegroundColor White
} else {
    Write-Host "1. Review failed tests above" -ForegroundColor White
    Write-Host "2. Fix issues in source files" -ForegroundColor White
    Write-Host "3. Re-run this script: .\automated-test.ps1" -ForegroundColor White
    Write-Host "4. Continue only when all tests pass" -ForegroundColor White
}

Write-Host "`n"

# Generate detailed log file
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "test-report-$timestamp.txt"

$logContent = @"
SMILE CENTER PORTAL - AUTOMATED TEST REPORT
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
================================================

SUMMARY
-------
Total Tests: $totalTests
Passed: $script:passCount
Failed: $script:failCount
Warnings: $script:warnCount
Success Rate: $passPercent%

ISSUES FOUND
------------
$($script:issues -join "`n")

DEPLOYMENT STATUS
-----------------
$(if ($script:failCount -eq 0) { "✓ READY FOR DEPLOYMENT" } elseif ($script:failCount -le 5) { "⚠ REVIEW REQUIRED" } else { "✗ NOT READY" })

NEXT STEPS
----------
$(if ($script:failCount -eq 0) {
    "1. Perform manual browser testing
2. Review PRE-DEPLOYMENT-CHECKLIST.md
3. Run deployment commands if satisfied"
} else {
    "1. Review failed tests
2. Fix issues
3. Re-run automated-test.ps1"
})

================================================
"@

$logContent | Out-File -FilePath $logFile -Encoding UTF8

Write-Host "📄 Detailed report saved to: $logFile" -ForegroundColor Cyan
Write-Host "`n"

# Return exit code based on results
if ($script:failCount -eq 0) {
    exit 0  # Success
} else {
    exit 1  # Failure
}
