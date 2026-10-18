# RetailFlow POS - Production Publishing Assets

This directory contains production-ready binary packages separated and prepared for publication on Git and GitHub Releases.

## Binary Artifacts

| File | Type | Architecture | Size | Description |
|---|---|---|---|---|
| `RetailFlow_POS_v1.0.0_Setup.exe` | NSIS Installer | Windows x64 | ~3.5 MB | 1-Click GUI Setup installer with desktop shortcut and uninstaller |
| `RetailFlow_POS_v1.0.0_Enterprise.msi` | Windows Installer (WiX) | Windows x64 | ~4.7 MB | Enterprise MSI package for silent IT deployment via GPO / Intune |
| `RetailFlow_POS_Portable.exe` | Standalone Executable | Windows x64 | ~9.9 MB | Zero-install portable binary ready to run immediately from flash drive |
| `RetailFlow_POS_v1.0.0_x64-setup.nsis.zip` | Updater Bundle | Windows x64 | ~3.5 MB | Compressed package utilized by the native Tauri Auto-Updater engine |
| `latest.json` | Release Manifest | All Platforms | JSON | Remote manifest polled by the desktop app for continuous updates |
| `checksums.txt` | SHA-256 Hashes | All Files | Plain Text | Cryptographic verification checksums for software integrity |

---

## How to Publish to GitHub Releases

### Option 1: Via GitHub Web Interface (Recommended)
1. Open your repository on GitHub: `https://github.com/Juhamim/retailpos/releases/new`
2. Set **Tag version** to `v1.0.0` (create new tag on publish).
3. Set **Release title** to `RetailFlow POS v1.0.0 - Production Release`.
4. Drag and drop all files from this `publish/` directory into the release assets drop area.
5. Click **Publish release**!

### Option 2: Via GitHub CLI (`gh`)
Run the following terminal command from the repository root:

```bash
gh release create v1.0.0 \
  publish/RetailFlow_POS_v1.0.0_Setup.exe \
  publish/RetailFlow_POS_v1.0.0_Enterprise.msi \
  publish/RetailFlow_POS_Portable.exe \
  publish/RetailFlow_POS_v1.0.0_x64-setup.nsis.zip \
  publish/latest.json \
  publish/checksums.txt \
  --title "RetailFlow POS v1.0.0" \
  --notes "Production Release of RetailFlow POS with Windows installers, dynamic UPI QR billing, Customer Cloudflare Setup Wizard, and Cloudflare D1 central database synchronization."
```

---

## Cryptographic Security Verification

Users can verify binary authenticity in PowerShell:

```powershell
Get-FileHash -Path ".\RetailFlow_POS_v1.0.0_Setup.exe" -Algorithm SHA256
```
Compare the resulting hash against `checksums.txt`.
