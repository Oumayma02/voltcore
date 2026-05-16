# VoltCore Missing / Misaligned Items After PFA + VM Check

Checked on 2026-05-16 from the Windows host against Proxmox VM `192.168.0.143`.

## Confirmed Working

- SSH access to the Proxmox VM works with the provided root credentials.
- Proxmox VE is running: `pve-manager/9.1.1`, node name `pve`.
- Core services are active: `pveproxy`, `pvedaemon`, `pvestatd`, `ssh`, `docker`.
- Network bridge `vmbr0` is up on `192.168.0.143/24`.
- Storage is available: `local` and `local-lvm`.
- Templates exist:
  - `9001` named `debian-12-template`, cloud-init enabled.
  - `9100` named `temp-fix-vm`, cloud-init enabled, but should be renamed/documented as the Ubuntu 22.04 template if it is the official Ubuntu template.
- Docker containers are running for API, MongoDB, MinIO, and Jenkins.
- API health endpoint responds on `http://192.168.0.143:3000/health`.
- MinIO is healthy on ports `9000` and `9001`.
- Jenkins responds on host port `8080`.

## Critical Gaps

- Jenkins was configured to load `jenkins/Jenkinsfile` from the repository root, but the repo only had `voltcore/jenkins/Jenkinsfile`. Fixed by adding the root Jenkinsfile and keeping the nested copy aligned.
- Terraform destroy was not wired through the Jenkins pipeline. Deleting through the API could remove a VM from Proxmox while leaving stale Terraform state in MinIO. Fixed so `ACTION=destroy` creates and applies a destroy plan.
- API-generated expected VM IPs used `192.168.1.x`, but Terraform provisions `192.168.0.x`. Fixed to `192.168.0.x`.
- API deploy accepted `clientId` and `clientEmail` from the browser. That allowed identity spoofing. Fixed to derive both from the JWT user.
- The integrated WebSocket SSH terminal is implemented in the API and exposed from VM details. New VMs receive a platform terminal SSH public key through cloud-init; the API reads the matching private key from `/opt/voltcore/secrets/terminal_ed25519`.
- Pending IP display is fixed by reading the Proxmox guest agent IP when Jenkins output does not include an address.

## Functional Gaps

- Notifications are now persisted in MongoDB and loaded by the frontend. Provisioning, lifecycle actions, idle detection, and expiration warnings create backend notifications.
- VM expiration now stores `leaseDays` / `expiresAt` and is monitored by a backend lifecycle worker. Expired VMs are marked and notified; automatic Proxmox destruction is controlled by `VM_AUTO_DESTROY_EXPIRED`.
- Idle VM detection now runs in the backend lifecycle worker using `VM_IDLE_MINUTES`.
- Admin infrastructure health now calls a real API endpoint that checks Proxmox, Jenkins, MinIO, MongoDB, and the API.
- Subscription upgrades are wired through `PATCH /api/auth/plan`, so signed-in users can move from Starter to Professional or Enterprise and get an account notification.
- Frontend is a React wrapper around legacy HTML via `dangerouslySetInnerHTML`, so it is hard to maintain and hard to test.

## Infrastructure Gaps

- Secrets/defaults are still placeholders in example compose values and must be replaced in production. Runtime secrets are kept out of Git.
- Jenkins credentials need to be verified in Jenkins itself: `proxmox-api-token`, `minio-access-key`, and `minio-secret-key`.
- MinIO Terraform state bucket exists locally, but state consistency must be rechecked after the new destroy flow.
- The Ubuntu template ID `9100` exists, but its name is `temp-fix-vm`; this should be cleaned up to match the report and Terraform local map.
- Existing VMs that were created before terminal-key injection cannot use the platform terminal unless the key is manually inserted or the VM is rebuilt.

## Local Fixes Started

- Hardened deploy identity handling in the API.
- Added lease/expiration fields to VM persistence.
- Aligned expected IP calculation with the Proxmox bridge subnet.
- Hardened Jenkins HTTP/HTTPS handling and CSRF crumb behavior.
- Updated Jenkinsfile to support `ACTION=destroy` and use the correct Proxmox provider endpoint base URL.
- Added persistent notifications, backend lifecycle monitoring, admin infrastructure health, and WebSocket SSH terminal support.

## Next Execution Steps

1. Push the local fixes to GitHub so Jenkins can load the root `jenkins/Jenkinsfile`.
2. Run one real VM apply from the frontend/API.
3. Confirm VM appears in Proxmox, gets the cloud-init terminal SSH key, reports the guest-agent IP, and opens the browser terminal.
4. Destroy the test VM through the API/Jenkins path to confirm Terraform state cleanup.
