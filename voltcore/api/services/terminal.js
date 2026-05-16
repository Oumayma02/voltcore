const { WebSocketServer } = require('ws');
const { Client } = require('ssh2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vm = require('../models/Vm');
const { JWT_SECRET } = require('../middleware/auth');
const fs = require('fs');

function configuredPrivateKey() {
  if (process.env.VM_SSH_PRIVATE_KEY_FILE) {
    try {
      return fs.readFileSync(process.env.VM_SSH_PRIVATE_KEY_FILE, 'utf8');
    } catch {
      return null;
    }
  }
  return process.env.VM_SSH_PRIVATE_KEY || process.env.SSH_PRIVATE_KEY || null;
}

async function userFromRequest(reqUrl) {
  const url = new URL(reqUrl, 'http://localhost');
  const token = url.searchParams.get('token');
  const vmId = Number(url.searchParams.get('vmId'));
  if (!token || !vmId) throw new Error('token and vmId are required');
  const payload = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(payload.sub);
  if (!user) throw new Error('Invalid session');
  const query = user.role === 'admin' ? { vmId } : { vmId, user: user._id };
  const vm = await Vm.findOne(query);
  if (!vm) throw new Error('VM not found or not allowed');
  return { user, vm };
}

function attachTerminalServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (!req.url || !req.url.startsWith('/api/terminal')) return;
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', async (ws, req) => {
    let ssh = null;
    try {
      const { vm } = await userFromRequest(req.url);
      const host = vm.ip;
      const username = process.env.VM_SSH_USER || 'voltcore';
      const privateKey = configuredPrivateKey();
      const password = process.env.VM_SSH_PASSWORD || process.env.SSH_PASSWORD;
      if (!host || host === 'Pending IP') throw new Error('VM IP is not ready yet');
      if (!privateKey && !password) throw new Error('Configure VM_SSH_PRIVATE_KEY or VM_SSH_PASSWORD on the API');

      ssh = new Client();
      ssh.on('ready', () => {
        ws.send(`Connected to ${vm.name} (${host})\r\n`);
        ssh.shell({ term: 'xterm-color', cols: 100, rows: 30 }, (err, stream) => {
          if (err) {
            ws.send(`Terminal error: ${err.message}\r\n`);
            ws.close();
            return;
          }
          stream.on('data', (data) => ws.readyState === 1 && ws.send(data.toString('utf8')));
          stream.stderr.on('data', (data) => ws.readyState === 1 && ws.send(data.toString('utf8')));
          stream.on('close', () => ws.close());
          ws.on('message', (message) => stream.write(message));
        });
      });
      ssh.on('error', (err) => {
        if (ws.readyState === 1) ws.send(`SSH error: ${err.message}\r\n`);
        ws.close();
      });
      ssh.connect({
        host,
        port: Number(process.env.VM_SSH_PORT || 22),
        username,
        privateKey,
        password,
        readyTimeout: 12000
      });
    } catch (err) {
      if (ws.readyState === 1) ws.send(`Terminal unavailable: ${err.message}\r\n`);
      ws.close();
    }
    ws.on('close', () => {
      if (ssh) ssh.end();
    });
  });
}

module.exports = { attachTerminalServer };
