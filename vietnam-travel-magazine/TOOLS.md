# TOOLS.md — Local Notes (Environment Cheat Sheet)

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Environment-specific notes, such as:
- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Local paths, workspace layout
- Operational shortcuts (restart commands, log locations)
- Anything setup-specific

## ⚠️ Security Rule (Non-Negotiable)
- DO NOT store raw tokens, API keys, passwords, cookies, or private URLs here.
- If you must reference a secret: store only a label (e.g., `TELEGRAM_TOKEN: STORED_IN_ENV`).
- If a secret leaks: rotate/revoke immediately.

---

# ✅ Tourpik / 피디님 Local Setup (Fill & Maintain)

## 💻 Machines
- Mac Mini (always-on): [fill model/hostname]
- Work laptop: [fill]

## 🗂️ Workspace Paths
- OpenClaw workspace: `/Users/youngdonjang/.openclaw/workspace`
- Memory folder: `/Users/youngdonjang/.openclaw/workspace/memory/`

## 🤖 Telegram Bot
- Channel: Telegram (via OpenClaw)
- Mode rules:
  - Group chat: short, non-intrusive, avoid sensitive info
  - 1:1 chat: can be more detailed if requested
- Bot identity label: `JARVIS`

## 🔄 Operational Commands (No secrets here)
- Restart OpenClaw (example placeholders):
  - If using PM2: `pm2 restart openclaw`
  - If using systemd: `sudo systemctl restart openclaw`
  - If using docker: `docker restart openclaw`
  - If using a custom script: `[fill: ./restart.sh or npm run start]`

## 🧾 Logs / Debug
- Log location: `[fill path]`
- Common checks:
  - Telegram webhook/polling status
  - Gateway running (127.0.0.1)
  - Model provider reachable
  - Rate limits / timeouts

## 🎙️ TTS (Optional)
- Preferred voice: `[fill]`
- Default speaker/device: `[fill]`

## 🎥 Production Notes (Optional)
### Cameras
- [fill name] → [location/spec]
### NLE
- Final Cut Pro: [templates/plugins]
- DaVinci Resolve: [templates/plugins]

---

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

Add whatever helps you operate reliably. This is your cheat sheet.
