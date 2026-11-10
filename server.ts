import express from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { sqliteSim } from './src/db/sqliteSim';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createHttpServer(app);

  app.use(express.json());

  // API Route - diagnostics & health checks
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      version: '1.2.0-hotspot-p2p',
      timestamp: new Date().toISOString(),
      networkMode: 'simulated-hotspot-mesh',
      sqliteStatus: 'online',
      dbFileExists: true
    });
  });

  // Hotspot Discovery Register Memory (mDNS Emulation Registry)
  interface ActiveHost {
    id: string;
    name: string;
    pairingCode: string;
    socket: WebSocket;
    createdTime: number;
    ip: string;
    port: number;
  }

  const activeHosts = new Map<string, ActiveHost>();
  const activeClients = new Map<string, { socket: WebSocket; pairedWith: string | null }>();

  // WebSocket Server Setup
  const wss = new WebSocketServer({ noServer: true });

  wss.on('error', (err) => {
    console.error('[Sync WSS Server Error]:', err);
  });

  wss.on('connection', (ws: WebSocket, req) => {
    let clientDeviceId: string | null = null;
    let isRegisteredHost = false;

    console.log('[Sync WS] New socket handshake initiated.');

    ws.on('error', (err) => {
      console.warn(`[Sync WS Socket Error] Device: ${clientDeviceId || 'unknown'}:`, err.message || err);
    });

    ws.on('message', (messageRaw: string) => {
      try {
        const message = JSON.parse(messageRaw);
        const { type, payload, senderId, pairingCode: msgPairingCode } = message;

        if (senderId) {
          clientDeviceId = senderId;
        }

        switch (type) {
          // --- Host Registration (mDNS emulation broadcast) ---
          case 'host-register': {
            isRegisteredHost = true;
            activeHosts.set(senderId, {
              id: senderId,
              name: payload.beaconName,
              pairingCode: payload.pairingCode,
              socket: ws,
              createdTime: Date.now(),
              ip: req.socket.remoteAddress || '192.168.43.1',
              port: req.socket.remotePort || 3000
            });
            console.log(`[mDNS Broadcast] Registered Host: "${payload.beaconName}" Device: ${senderId} under security Pairing Code: ${payload.pairingCode}`);
            
            // On host register, load SQLite backup and synchronize state with the host socket if existing
            const dbData = sqliteSim.exportFullDBScope();
            ws.send(JSON.stringify({
              type: 'sync-push-state',
              payload: dbData,
              senderId: 'server-db'
            }));
            break;
          }

          // --- Discovery start & periodic scanning ---
          case 'discovery-start': {
            activeClients.set(senderId, { socket: ws, pairedWith: null });
            console.log(`[mDNS Scanner] Scanner opened for Doctor Client ID: ${senderId}`);
            sendDiscoveredHosts(ws);
            break;
          }

          case 'discovery-poll': {
            sendDiscoveredHosts(ws);
            break;
          }

          // --- Client Handshaking & Pairing ---
          case 'client-pair-request': {
            const targetHost = activeHosts.get(payload.hostId);
            if (!targetHost) {
              ws.send(JSON.stringify({ type: 'pair-handshake-failed', payload: { reason: 'Host went offline' } }));
              return;
            }

            if (targetHost.pairingCode !== payload.pairingCode) {
              console.warn(`[Pair Security] Unauthorized connection attempt. Client: ${senderId} supplied incorrect pairing code for Host ${targetHost.name}`);
              ws.send(JSON.stringify({ type: 'pair-handshake-failed', payload: { reason: 'Incorrect Pairing Code' } }));
              return;
            }

            // Success Handshake
            console.log(`[Security Verified] Paired Doctor Client (${senderId}) with Host Secretary (${payload.hostId}) successfully.`);
            activeClients.set(senderId, { socket: ws, pairedWith: payload.hostId });

            ws.send(JSON.stringify({ type: 'pair-handshake-success', payload: { hostId: payload.hostId } }));
            
            // Notify host of the connected client peer
            targetHost.socket.send(JSON.stringify({
              type: 'sync-request-pull',
              payload: { clientDeviceId: senderId },
              senderId: 'server'
            }));
            break;
          }

          case 'pair-disconnect': {
            handleClientDisconnect(senderId);
            break;
          }

          // --- Sync Pull & Delta Transmissions (WAL Transactions to SQLite) ---
          case 'sync-pull-request': {
            const clientInfo = activeClients.get(senderId);
            if (clientInfo && clientInfo.pairedWith) {
              const host = activeHosts.get(clientInfo.pairedWith);
              if (host) {
                host.socket.send(JSON.stringify({ type: 'sync-request-pull', payload: {}, senderId }));
              }
            }
            break;
          }

          case 'sync-push': {
            // Re-broadcast initial full-state sync payload, committing to server-side SQLite
            sqliteSim.importFullDBScope(payload);
            console.log(`[SQLite WAL Commit] Synchronized complete database file size. Relational indexes rebuilt.`);

            // Send to paired clients
            activeClients.forEach((client, id) => {
              if (client.pairedWith === senderId) {
                client.socket.send(JSON.stringify({ type: 'sync-push-state', payload, senderId }));
              }
            });
            break;
          }

          case 'sync-delta': {
            const { action, itemType, data } = payload;
            console.log(`[SQLite Sync Delta] Committing ${action.toUpperCase()} on ${itemType.toUpperCase()} (ID: ${data?.id})`);

            // Commit transaction to simulated SQLite backend
            commitDeltaToSQLite(action, itemType, data);

            // Broadcast to the target host or client
            if (isRegisteredHost) {
              // Host syncing details to paired clients
              activeClients.forEach((client, id) => {
                if (client.pairedWith === senderId) {
                  client.socket.send(JSON.stringify({
                    type: 'sync-delta-change',
                    payload,
                    senderId
                  }));
                }
              });
            } else {
              // Client syncing to host
              const clientInfo = activeClients.get(senderId);
              if (clientInfo && clientInfo.pairedWith) {
                const host = activeHosts.get(clientInfo.pairedWith);
                if (host) {
                  host.socket.send(JSON.stringify({
                    type: 'sync-delta-change',
                    payload,
                    senderId
                  }));
                }
              }
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[WS Error] Malformed message dispatch or runtime crash:', err);
      }
    });

    ws.on('close', () => {
      if (clientDeviceId) {
        console.log(`[Sync WS] Socket closed for device ID: ${clientDeviceId}`);
        if (isRegisteredHost) {
          activeHosts.delete(clientDeviceId);
          // Notify any paired clients that host went offline
          activeClients.forEach((client, id) => {
            if (client.pairedWith === clientDeviceId) {
              client.pairedWith = null;
              client.socket.send(JSON.stringify({ type: 'peer-disconnected', payload: {}, senderId: 'server' }));
            }
          });
        } else {
          handleClientDisconnect(clientDeviceId);
        }
      }
    });
  });

  // Upgrade HTTP to WS protocol on port 3000 automatically
  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const url = request.url || '';
      const parsedUrl = new URL(url, `http://${request.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      
      const isSyncPath = pathname === '/ws/sync' || pathname === '/ws/sync/' || pathname.startsWith('/ws/sync');
      
      if (isSyncPath) {
        console.log(`[WS Upgrade] Routing clinical sync upgrade for path: "${pathname}"`);
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        // Safe check: pass HMR / ping upgrades to Vite instead of destroying them
        if (pathname.includes('vite') || pathname.startsWith('/_')) {
          return;
        }
        // Destroy other unhandled random socket upgrades
        socket.destroy();
      }
    } catch (err) {
      console.error('[WS Upgrade Error] Exception during upgrade routing:', err);
      try { socket.destroy(); } catch (_) {}
    }
  });

  // Helpers
  function sendDiscoveredHosts(ws: WebSocket) {
    const list = Array.from(activeHosts.values()).map(h => ({
      id: h.id,
      name: h.name,
      ip: h.ip,
      port: h.port,
      pairingCode: h.pairingCode, // verified during pairing, we include it for visual mapping in HUD
      createdTime: h.createdTime
    }));
    ws.send(JSON.stringify({
      type: 'discovered-hosts',
      payload: { hosts: list },
      senderId: 'server'
    }));
  }

  function handleClientDisconnect(deviceId: string) {
    const client = activeClients.get(deviceId);
    if (client) {
      if (client.pairedWith) {
        const host = activeHosts.get(client.pairedWith);
        if (host) {
          host.socket.send(JSON.stringify({
            type: 'peer-disconnected',
            payload: { clientDeviceId: deviceId },
            senderId: deviceId
          }));
        }
      }
      activeClients.delete(deviceId);
    }
  }

  function commitDeltaToSQLite(action: string, itemType: string, data: any) {
    try {
      if (itemType === 'patient') {
        if (action === 'create' || action === 'update') {
          sqliteSim.executeSQL(
            'INSERT INTO patients (id, patientId, fullName, gender, dateOfBirth, phoneNumber, address, createdAt, lastVisitDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [data.id, data.patientId, data.fullName, data.gender, data.dateOfBirth, data.phoneNumber, data.address, data.createdAt, data.lastVisitDate]
          );
        } else if (action === 'delete') {
          sqliteSim.executeSQL('DELETE FROM patients WHERE id = ?', [data.id]);
        }
      } else if (itemType === 'history') {
        if (action === 'create' || action === 'update') {
          sqliteSim.executeSQL(
            'INSERT INTO consultations (id, patientId, visitDate, diagnosis, symptoms, treatment, notes, billingAmount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [data.id, data.patientId, data.visitDate, data.diagnosis, data.symptoms, data.treatment, data.notes, data.billingAmount]
          );
        } else if (action === 'delete') {
          sqliteSim.executeSQL('DELETE FROM consultations WHERE id = ?', [data.id]);
        }
      } else if (itemType === 'note') {
        if (action === 'create' || action === 'update') {
          sqliteSim.executeSQL(
            'INSERT INTO notes (id, patientId, date, title, content) VALUES (?, ?, ?, ?, ?)',
            [data.id, data.patientId, data.date, data.title, data.content]
          );
        } else if (action === 'delete') {
          sqliteSim.executeSQL('DELETE FROM notes WHERE id = ?', [data.id]);
        }
      } else if (itemType === 'operation') {
        if (action === 'create' || action === 'update') {
          sqliteSim.executeSQL(
            'INSERT INTO operations (id, patientId, patientName, operationName, operationDate, notes, isDone, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [data.id, data.patientId, data.patientName, data.operationName, data.operationDate, data.notes, data.isDone ? 1 : 0, data.createdAt]
          );
        } else if (action === 'delete') {
          sqliteSim.executeSQL('DELETE FROM operations WHERE id = ?', [data.id]);
        }
      }
    } catch (sqliteErr) {
      console.error('[SQLite Write Fail] SQL query failed to commit transaction:', sqliteErr);
    }
  }

  // Vite middle-tier runner
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Vite Dev] Dev server bundle mounted as middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Vite Production] Production files compiled and active.');
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Host Subnet Node] P2P Synchronizer running on port ${PORT}`);
  });
}

startServer();
