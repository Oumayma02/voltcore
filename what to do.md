# ⚡ VoltCore — Execution & Development Context (FINAL)

## 🧠 Project Nature

VoltCore is a **local cloud platform** to deploy virtual machines using:

* Proxmox (virtualization)
* Terraform (provisioning)
* Jenkins (automation)
* Node.js backend (API)
* HTML/CSS/JS frontend (index.html)

This project is already partially implemented and WORKING.

---

## 🏗️ REAL EXECUTION ENVIRONMENT

The project does NOT run on the developer machine.

It runs inside:

Windows Host
→ VMware Workstation
→ Proxmox VM
→ Docker containers

---

## 🌐 ACCESS TO REAL SYSTEM

Proxmox access:

```bash
ssh root@192.168.0.143
```

Project location inside Proxmox:

```bash
/opt/voltcore
```

---

## 📦 GITHUB REPOSITORY (SOURCE OF TRUTH)

Repository:

https://github.com/Shouaib-gf/voltcore

---

## 🔄 DEVELOPMENT WORKFLOW (CRITICAL)

Codex MUST follow this workflow:

### Option 1 (Recommended)

1. Modify code locally (via repository)
2. Push changes to GitHub
3. SSH into Proxmox
4. Pull latest changes:

```bash
cd /opt/voltcore
git pull
```

5. Restart containers if needed

---

### Option 2 (Direct Debugging)

Codex may simulate or reason about code locally, BUT:

👉 Real validation happens ONLY inside Proxmox

---

## ⚠️ NETWORK RULE (VERY IMPORTANT)

Backend runs inside Proxmox VM.

NEVER use:

* localhost
* 127.0.0.1

ALWAYS use:

* 192.168.0.143

Example:

❌ http://localhost:3000
✅ http://192.168.0.143:3000

---

## 📂 EXISTING SYSTEM (DO NOT BREAK)

Already implemented and WORKING:

* Backend API (Node.js / Express)
* Jenkins integration
* Terraform provisioning
* Proxmox API control
* VM lifecycle (deploy, start, stop, destroy)

Key files:

* api/routes/vms.js
* api/services/jenkins.js
* api/services/proxmox.js

---

## ❗ STRICT RULES

* DO NOT rewrite backend logic
* DO NOT modify Jenkins service
* DO NOT modify Proxmox service
* DO NOT change folder structure
* DO NOT break existing working deployment

---

## 🎯 MAIN OBJECTIVE

Extend the system into a real SaaS platform.

---

## 🔧 REQUIRED FEATURES

### 1. MongoDB Integration

* Add MongoDB container
* Store users
* Store VMs
* Link VMs to users

---

### 2. Authentication System

* Register / login
* JWT authentication
* Role system (admin / user)

---

### 3. Extend VM Deployment Flow

After VM is deployed:

* Save VM in database
* Associate it with a user

---

### 4. Frontend Integration

Current frontend:

* index.html
* script.js
* uses fake data

Must be updated to:

* Call real backend API
* Display real VM data
* Handle authentication

---

## ❌ DO NOT DO

* Do NOT convert frontend to React yet
* Do NOT rebuild backend
* Do NOT simulate data
* Do NOT ignore existing API

---

## ✅ SUCCESS CRITERIA

System must allow:

* User registration/login
* VM deployment via UI
* VM stored in database
* Real-time status display
* Full end-to-end workflow

---

## 🎯 FINAL GOAL

VoltCore becomes:

👉 A fully functional local cloud platform
👉 With real users, real VMs, real data

---
