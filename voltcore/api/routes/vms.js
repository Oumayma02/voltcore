const express = require('express');
const router  = express.Router();
const jenkins = require('../services/jenkins');
const proxmox = require('../services/proxmox');
const { validateDeploy } = require('../middleware/validate');
const { authRequired, adminRequired } = require('../middleware/auth');
const Vm = require('../models/Vm');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function terraformPlan(plan) {
  const key = String(plan || '').toLowerCase();
  if (key === 'starter') return 'basic';
  if (key === 'professional') return 'pro';
  if (key === 'enterprise') return 'enterprise';
  if (key === 'custom') return 'custom';
  return key || 'basic';
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value || fallback);
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : fallback));
}

async function findAuthorizedVm(req, vmId) {
  const vm = await Vm.findOne({ vmId: Number(vmId) });
  if (!vm) {
    const err = new Error('VM record not found');
    err.statusCode = 404;
    throw err;
  }
  if (req.user.role !== 'admin' && vm.user.toString() !== req.user._id.toString()) {
    const err = new Error('Not allowed to manage this VM');
    err.statusCode = 403;
    throw err;
  }
  return vm;
}

// Deploy
router.post('/deploy', authRequired, validateDeploy, async (req, res) => {
  try {
    const { vmName, clientId, clientEmail, clientSshPubkey, plan, os, cpuCores, ramMb, diskGb } = req.body;
    const tfPlan = terraformPlan(plan || req.user.plan);
    const safeCpuCores = clampNumber(cpuCores, 1, 2, 1);
    const safeRamMb = clampNumber(ramMb, 512, 1024, 1024);
    const safeDiskGb = clampNumber(diskGb, 20, 40, 40);
    const vmId = Math.floor(7000 + Math.random() * 1999);
    const { buildUrl, buildNumber } = await jenkins.triggerBuild({
      VM_NAME: vmName, VM_ID: String(vmId), CLIENT_ID: clientId,
      CLIENT_EMAIL: clientEmail, CLIENT_SSH_PUBKEY: clientSshPubkey,
      PLAN: tfPlan, OS: os || 'ubuntu-22.04',
      CPU_CORES: String(safeCpuCores), RAM_MB: String(safeRamMb),
      DISK_GB: String(safeDiskGb), ACTION: 'apply'
    });
    const vm = await Vm.create({
      vmId,
      name: vmName,
      user: req.user._id,
      userEmail: req.user.email,
      status: 'provisioning',
      os: os || 'ubuntu-22.04',
      plan: plan || req.user.plan || 'Professional',
      cpuCores: safeCpuCores,
      ramMb: safeRamMb,
      diskGb: safeDiskGb,
      buildUrl,
      buildNumber
    });
    res.status(202).json({ message: 'VM deployment triggered', vmId, vmName, buildUrl, buildNumber, status: 'provisioning', vm });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', authRequired, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    const vms = await Vm.find(query).sort({ createdAt: -1 });
    res.json(vms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/all', authRequired, adminRequired, async (req, res) => {
  try {
    const vms = await Vm.find().populate('user', 'name email role plan').sort({ createdAt: -1 });
    res.json(vms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Jenkins build status + IP
router.get('/status/:buildNumber', async (req, res) => {
  try {
    const status = await jenkins.getBuildStatus(req.params.buildNumber);
    const vm = await Vm.findOne({ buildNumber: Number(req.params.buildNumber) });
    if (vm) {
      vm.lastStatusCheckedAt = new Date();
      if (!status.building) vm.status = status.status === 'SUCCESS' ? 'running' : 'failed';
      if (status.ip) vm.ip = status.ip;
      await vm.save();
    }
    res.json(status);
  }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Stop VM (graceful then force)
router.post('/stop', authRequired, async (req, res) => {
  const { vmId } = req.body;
  if (!vmId) return res.status(400).json({ error: 'vmId required' });
  try {
    await findAuthorizedVm(req, vmId);
    await proxmox.stopVm(vmId);
    const vm = await Vm.findOneAndUpdate({ vmId: Number(vmId) }, { status: 'stopped' }, { new: true });
    res.json({ message: `VM ${vmId} stopped`, vmId, status: 'stopped', vm });
  } catch (err) { res.status(err.statusCode || 500).json({ error: err.message }); }
});

// Start VM
router.post('/start', authRequired, async (req, res) => {
  const { vmId } = req.body;
  if (!vmId) return res.status(400).json({ error: 'vmId required' });
  try {
    await findAuthorizedVm(req, vmId);
    await proxmox.startVm(vmId);
    const vm = await Vm.findOneAndUpdate({ vmId: Number(vmId) }, { status: 'running' }, { new: true });
    res.json({ message: `VM ${vmId} started`, vmId, status: 'running', vm });
  } catch (err) { res.status(err.statusCode || 500).json({ error: err.message }); }
});

// Destroy VM — delete from Proxmox + disk
router.post('/destroy', authRequired, async (req, res) => {
  const { vmId, vmName } = req.body;
  if (!vmId) return res.status(400).json({ error: 'vmId required' });
  try {
    await findAuthorizedVm(req, vmId);
    await proxmox.deleteVm(vmId);
    await Vm.findOneAndUpdate({ vmId: Number(vmId) }, { status: 'deleted', deletedAt: new Date() });
    res.json({ message: `VM ${vmId} deleted`, vmId, status: 'deleted' });
  } catch (err) {
    if (err.message.includes('does not exist') || err.message.includes('404')) {
      await Vm.findOneAndUpdate({ vmId: Number(vmId) }, { status: 'deleted', deletedAt: new Date() });
      return res.json({ message: `VM ${vmId} already gone`, vmId, status: 'deleted' });
    }
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Real-time Proxmox status
router.get('/:vmId/status', authRequired, async (req, res) => {
  try {
    await findAuthorizedVm(req, req.params.vmId);
    const d = await proxmox.getVmStatus(req.params.vmId);
    await Vm.findOneAndUpdate(
      { vmId: Number(req.params.vmId) },
      { status: d.status, lastStatusCheckedAt: new Date() }
    );
    res.json({ vmId: req.params.vmId, status: d.status, cpu: Math.round((d.cpu||0)*100), mem: d.mem, maxmem: d.maxmem, uptime: d.uptime });
  } catch (err) { res.status(err.statusCode || 500).json({ error: err.message }); }
});

// RRD metrics for graphs
router.get('/:vmId/metrics', authRequired, async (req, res) => {
  try {
    await findAuthorizedVm(req, req.params.vmId);
    const { timeframe = 'hour' } = req.query;
    const data = await proxmox.getVmMetrics(req.params.vmId, timeframe);
    res.json({
      vmId: req.params.vmId, timeframe,
      data: (data||[]).map(p => ({
        time:      p.time,
        cpu:       Math.round((p.cpu||0)*100),
        mem:       Math.round((p.mem||0)/1024/1024),
        netin:     Math.round((p.netin||0)/1024),
        netout:    Math.round((p.netout||0)/1024),
        diskread:  Math.round((p.diskread||0)/1024),
        diskwrite: Math.round((p.diskwrite||0)/1024)
      }))
    });
  } catch (err) { res.status(err.statusCode || 500).json({ error: err.message }); }
});

// List all VMs on node (admin)
router.get('/list', authRequired, adminRequired, async (req, res) => {
  try {
    const vms = await proxmox.listVms();
    res.json(vms.map(v => ({ vmId: v.vmid, name: v.name, status: v.status, cpu: Math.round((v.cpu||0)*100), mem: v.mem, maxmem: v.maxmem, uptime: v.uptime })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
