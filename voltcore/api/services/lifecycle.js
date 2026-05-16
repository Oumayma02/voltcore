const Vm = require('../models/Vm');
const { notify } = require('./notifications');
const proxmox = require('./proxmox');

const IDLE_MINUTES = Number(process.env.VM_IDLE_MINUTES || 5);
const EXPIRY_WARNING_DAYS = Number(process.env.VM_EXPIRY_WARNING_DAYS || 3);
const AUTO_DESTROY_EXPIRED = process.env.VM_AUTO_DESTROY_EXPIRED === 'true';

async function inspectLifecycle() {
  const now = new Date();
  const warningAfter = new Date(now.getTime() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
  const idleBefore = new Date(now.getTime() - IDLE_MINUTES * 60 * 1000);

  const expiring = await Vm.find({
    status: { $nin: ['deleted', 'expired', 'failed'] },
    expiresAt: { $ne: null, $lte: warningAfter },
    expirationNoticeSentAt: null
  });

  for (const vm of expiring) {
    const expired = vm.expiresAt <= now;
    vm.expirationNoticeSentAt = now;
    if (expired) vm.status = 'expired';
    await vm.save();
    await notify({
      user: vm.user,
      vm: vm._id,
      vmId: vm.vmId,
      type: expired ? 'error' : 'warning',
      title: expired ? 'VM expired' : 'VM expiring soon',
      detail: expired ? `${vm.name} has reached its lease end.` : `${vm.name} expires before ${vm.expiresAt.toLocaleDateString()}.`
    });

    if (expired && AUTO_DESTROY_EXPIRED) {
      try {
        await proxmox.deleteVm(vm.vmId);
        await notify({
          user: vm.user,
          vm: vm._id,
          vmId: vm.vmId,
          type: 'info',
          title: 'Expired VM removed',
          detail: `${vm.name} was removed from Proxmox after expiration.`
        });
      } catch (err) {
        await notify({
          user: vm.user,
          vm: vm._id,
          vmId: vm.vmId,
          type: 'error',
          title: 'Expired VM removal failed',
          detail: `${vm.name}: ${err.message}`
        });
      }
    }
  }

  const idle = await Vm.find({
    status: 'running',
    idleNoticeSentAt: null,
    lastStatusCheckedAt: { $ne: null, $lte: idleBefore }
  });

  for (const vm of idle) {
    vm.idleNoticeSentAt = now;
    await vm.save();
    await notify({
      user: vm.user,
      vm: vm._id,
      vmId: vm.vmId,
      type: 'warning',
      title: 'VM inactive',
      detail: `${vm.name} has not reported dashboard activity for ${IDLE_MINUTES}+ minutes.`
    });
  }
}

function startLifecycleMonitor() {
  const intervalMs = Number(process.env.LIFECYCLE_INTERVAL_MS || 60000);
  setTimeout(() => inspectLifecycle().catch((err) => console.error('Lifecycle monitor failed:', err.message)), 5000);
  setInterval(() => inspectLifecycle().catch((err) => console.error('Lifecycle monitor failed:', err.message)), intervalMs);
}

module.exports = { inspectLifecycle, startLifecycleMonitor };
