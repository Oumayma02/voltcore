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

- Jenkins port mapping is inconsistent. The repo compose file maps Jenkins as `8081:8080` under a profile, while the VM has Jenkins reachable on host `8080` and the Docker container shows no published ports. Decide whether Jenkins is host-managed or compose-managed, then update `docker-compose.yml`, `.env`, and docs consistently.
- Terraform destroy was not wired through the Jenkins pipeline. Deleting through the API could remove a VM from Proxmox while leaving stale Terraform state in MinIO. A first fix has been added so `ACTION=destroy` creates a destroy plan.
- API-generated expected VM IPs used `192.168.1.x`, but Terraform provisions `192.168.0.x`. This would display wrong IPs while provisioning. Fixed locally to `192.168.0.x`.
- API deploy accepted `clientId` and `clientEmail` from the browser. That allowed identity spoofing. Fixed locally to derive both from the JWT user.
- The integrated WebSocket SSH terminal is now implemented in the API and exposed from VM details. It still requires `VM_SSH_PRIVATE_KEY` or `VM_SSH_PASSWORD` in the API environment to open real VM shells.

## Functional Gaps

- Notifications are now persisted in MongoDB and loaded by the frontend. Provisioning, lifecycle actions, idle detection, and expiration warnings create backend notifications.
- VM expiration now stores `leaseDays` / `expiresAt` and is monitored by a backend lifecycle worker. Expired VMs are marked and notified; automatic Proxmox destruction is controlled by `VM_AUTO_DESTROY_EXPIRED`.
- Idle VM detection now runs in the backend lifecycle worker using `VM_IDLE_MINUTES`.
- Admin infrastructure health now calls a real API endpoint that checks Proxmox, Jenkins, MinIO, MongoDB, and the API.
- Subscriptions and payments remain simulated. The PFA describes subscription-aware validity and quotas; only basic plan limits exist in frontend logic.
- Frontend is a React wrapper around legacy HTML via `dangerouslySetInnerHTML`, so it is hard to maintain and hard to test.

## Infrastructure Gaps

- Secrets/defaults are unsafe in repo-level compose defaults: `JWT_SECRET=change-me`, MinIO default password, placeholder Jenkins credentials, and placeholder Proxmox token.
- Jenkins credentials need to be verified in Jenkins itself: `proxmox-api-token`, `minio-access-key`, and `minio-secret-key`.
- MinIO Terraform state bucket exists locally, but state consistency must be rechecked after the new destroy flow.
- The Ubuntu template ID `9100` exists, but its name is `temp-fix-vm`; this should be cleaned up to match the report and Terraform local map.
- Existing VMs are all stopped at the time of inspection. End-to-end provisioning still needs a real apply/destroy test after Jenkins credentials are confirmed.

## Local Fixes Started

- Hardened deploy identity handling in the API.
- Added lease/expiration fields to VM persistence.
- Aligned expected IP calculation with the Proxmox bridge subnet.
- Hardened Jenkins HTTP/HTTPS handling and CSRF crumb behavior.
- Updated Jenkinsfile to support `ACTION=destroy` and use the correct Proxmox provider endpoint base URL.
- Added persistent notifications, backend lifecycle monitoring, admin infrastructure health, and WebSocket SSH terminal support.

## Next Execution Steps

1. Push the local fixes to the VM or pull them on `/opt/voltcore`.
2. Rebuild/restart `voltcore-api` and reload the Jenkins job from the updated Jenkinsfile.
3. Verify Jenkins credentials and Terraform init against MinIO.
4. Run one real VM apply from the frontend/API.
5. Confirm VM appears in Proxmox, gets cloud-init SSH key, reports metrics, and can be destroyed through Jenkins without stale Terraform state.
6. Configure `VM_SSH_PRIVATE_KEY` or `VM_SSH_PASSWORD` for browser terminal access to provisioned VMs.
