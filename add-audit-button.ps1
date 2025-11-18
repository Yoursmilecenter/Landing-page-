$file = "C:\Users\avico\Downloads\CLONE\Landing-page-\admin-panel.html"
$content = Get-Content $file -Raw

$oldText = @"
                            <span class="admin-badge" style="background: rgba(239, 68, 68, 0.2); color: var(--color-error); border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">ADMIN</span>
                            <button class="btn-primary btn-small" onclick="openInviteClientModal()">
"@

$newText = @"
                            <span class="admin-badge" style="background: rgba(239, 68, 68, 0.2); color: var(--color-error); border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">ADMIN</span>
                            <button class="btn-secondary btn-small" onclick="window.location.href='audit-logs.html'">
                                <i class="fas fa-clipboard-list"></i> Audit Logs
                            </button>
                            <button class="btn-primary btn-small" onclick="openInviteClientModal()">
"@

$content = $content.Replace($oldText, $newText)
$content | Set-Content $file -NoNewline
Write-Host "✅ Audit Logs button added to admin panel!"
