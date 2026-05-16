// api/middleware/validate.js

function validateDeploy(req, res, next) {
  const { vmName, clientSshPubkey, os, leaseDays, cpuCores, ramMb, diskGb } = req.body;

  if (!vmName)
    return res.status(400).json({ error: 'vmName is required' });

  if (!/^[a-z0-9][a-z0-9-]{0,30}$/.test(vmName))
    return res.status(400).json({ error: 'vmName must be lowercase letters, numbers and hyphens only' });

  if (!clientSshPubkey || !clientSshPubkey.startsWith('ssh-'))
    return res.status(400).json({ error: 'A valid SSH public key is required (must start with ssh-)' });

  const validOs = ['ubuntu-22.04', 'debian-12'];
  if (os && !validOs.includes(os))
    return res.status(400).json({ error: `OS must be one of: ${validOs.join(', ')}` });

  const numericChecks = [
    ['cpuCores', cpuCores, 1, 16],
    ['ramMb', ramMb, 512, 32768],
    ['diskGb', diskGb, 10, 1024],
    ['leaseDays', leaseDays, 1, 365]
  ];

  for (const [field, value, min, max] of numericChecks) {
    if (value === undefined || value === null || value === '') continue;
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
      return res.status(400).json({ error: `${field} must be between ${min} and ${max}` });
    }
  }

  next();
}

module.exports = { validateDeploy };
