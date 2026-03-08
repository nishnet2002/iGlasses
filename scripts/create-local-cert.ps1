param(
  [string]$CertDir = ".cert",
  [string]$FriendlyName = "Glasses Local HTTPS Dev"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$certPath = Join-Path $repoRoot $CertDir
$pfxPath = Join-Path $certPath "glasses-local-dev.pfx"
$cerPath = Join-Path $certPath "glasses-local-dev.cer"
$passwordPath = Join-Path $certPath "glasses-local-dev.password.txt"

if ((Test-Path $pfxPath) -and (Test-Path $passwordPath)) {
  Write-Host "Local HTTPS certificate already exists at $pfxPath"
  exit 0
}

New-Item -ItemType Directory -Force -Path $certPath | Out-Null

$dnsNames = @("localhost", "127.0.0.1", $env:COMPUTERNAME) | Where-Object { $_ -and $_.Trim().Length -gt 0 } | Select-Object -Unique
$passwordPlain = [Guid]::NewGuid().ToString("N")
$securePassword = ConvertTo-SecureString -String $passwordPlain -AsPlainText -Force

$cert = New-SelfSignedCertificate `
  -DnsName $dnsNames `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -FriendlyName $FriendlyName `
  -NotAfter (Get-Date).AddYears(2) `
  -HashAlgorithm "SHA256" `
  -KeyAlgorithm "RSA" `
  -KeyLength 2048 `
  -KeyExportPolicy Exportable

Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null
Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $securePassword | Out-Null
Set-Content -Path $passwordPath -Value $passwordPlain -Encoding ascii

Write-Host "Created and trusted local HTTPS certificate."
Write-Host "PFX: $pfxPath"
