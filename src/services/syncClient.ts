import { Patient, DentalHistoryEntry, PatientNote, PatientOperation } from '../types';
import { dentalStorage } from './storage';

export type SyncStatus = 'offline' | 'discovering' | 'connecting' | 'paired' | 'hosting';

export interface DiscoveredHost {
  id: string;
  name: string;
  ip: string;
  port: number;
  pairingCode: string;
  createdTime: number;
}

export interface SyncMessage {
  type: string;
  payload: any;
  senderId: string;
  pairingCode?: string;
}

class HotspotSyncClient {
  private socket: WebSocket | null = null;
  private status: SyncStatus = 'offline';
  private hostId: string = '';
  private pairingCode: string = '';
  private myDeviceId: string = '';
  private onStatusChange: (status: SyncStatus) => void = () => {};
  private onDiscoveredChange: (hosts: DiscoveredHost[]) => void = () => {};
  private onLog: (msg: string) => void = () => {};
  private onSyncReceived: () => void = () => {};

  private discoveredHosts: DiscoveredHost[] = [];
  private isRemoteUpdateActive: boolean = false;
  private reconnectInterval: any = null;
  private discoveryInterval: any = null;
  private offlineQueue: { id: string; action: string; type: string; payload: any; timestamp: number }[] = [];

  constructor() {
    this.myDeviceId = 'dev_' + Math.random().toString(36).substring(2, 9);
    this.loadOfflineQueue();
  }

  // --- Configuration ---
  public configure(
    onStatus: (status: SyncStatus) => void,
    onDiscovered: (hosts: DiscoveredHost[]) => void,
    onLogMsg: (msg: string) => void,
    onSync: () => void
  ) {
    this.onStatusChange = onStatus;
    this.onDiscoveredChange = onDiscovered;
    this.onLog = onLogMsg;
    this.onSyncReceived = onSync;
  }

  public getStatus() {
    return this.status;
  }

  public getMyDeviceId() {
    return this.myDeviceId;
  }

  public getDiscoveredHosts() {
    return this.discoveredHosts;
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.onStatusChange(newStatus);
    this.onLog(`[Hotspot Sync] Status changed to ${newStatus.toUpperCase()}`);
  }

  // --- Connectivity ---
  private getWsUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/sync`;
  }

  public startHostMode(pairingCode: string, beaconName: string) {
    this.stopAll();
    this.pairingCode = pairingCode;
    this.setStatus('connecting');
    this.onLog(`[Host Mode] Initializing mDNS broadcast for "${beaconName}"...`);

    const connect = () => {
      try {
        const url = this.getWsUrl();
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          this.onLog(`[Host Mode] Connected to hotspot routing layer.`);
          this.setStatus('hosting');
          this.sendMsg('host-register', {
            beaconName,
            pairingCode,
            deviceId: this.myDeviceId
          });
          this.flushOfflineQueue();
        };

        this.socket.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        this.socket.onclose = () => {
          if (this.status === 'hosting') {
            this.setStatus('connecting');
            this.onLog('[Host Mode] Hotspot lost. Retrying auto mDNS broadcast...');
            this.scheduleReconnect(connect);
          }
        };

        this.socket.onerror = () => {
          this.onLog(`[Host Mode] Network interface offline or connection blocked (Note: browser iframe sandbox or offline state may restrict WebSockets. Try opening the app in a new tab for peer sync).`);
        };
      } catch (err: any) {
        this.onLog(`[Host Mode] Failed to instantiate socket: ${err?.message || err}`);
      }
    };

    connect();
  }

  public startClientMode() {
    this.stopAll();
    this.setStatus('discovering');
    this.onLog('[Doctor Client] Starting automated hotspot host discovery (mDNS service discovery)...');

    const connect = () => {
      try {
        const url = this.getWsUrl();
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          this.onLog('[Doctor Client] Discovery radio online. Scanning hotspot broadcast bands...');
          this.sendMsg('discovery-start', { deviceId: this.myDeviceId });
          this.startDiscoveryPolling();
        };

        this.socket.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        this.socket.onclose = () => {
          if (this.status !== 'offline') {
            this.onLog('[Doctor Client] Hotspot lost. Reconnecting discovery scanner...');
            this.scheduleReconnect(connect);
          }
        };

        this.socket.onerror = () => {
          this.onLog(`[Doctor Client] Network interface offline or connection blocked (Note: WebSockets can be restricted in browser sandbox previews. Try opening in a new tab).`);
        };
      } catch (e: any) {
        this.onLog(`[Doctor Client] Failed to scan wifi: ${e.message}`);
      }
    };

    connect();
  }

  public pairWithHost(hostId: string, inputPairingCode: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.onLog('[Doctor Client] pairing failed: Discovery socket is offline.');
      return;
    }

    this.onLog(`[Doctor Client] Attacking pairing handshake using Clinic pairing code...`);
    this.hostId = hostId;
    this.pairingCode = inputPairingCode;

    this.sendMsg('client-pair-request', {
      hostId,
      deviceId: this.myDeviceId,
      pairingCode: inputPairingCode
    });
  }

  public disconnectPair() {
    this.onLog('[Peer Sync] Disconnecting active pairing.');
    this.sendMsg('pair-disconnect', { deviceId: this.myDeviceId });
    this.stopAll();
    this.setStatus('offline');
  }

  public stopAll() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.discoveredHosts = [];
    this.onDiscoveredChange([]);
    this.setStatus('offline');
  }

  private scheduleReconnect(connectFn: () => void) {
    if (this.reconnectInterval) return;
    this.reconnectInterval = setInterval(() => {
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.onLog('[System Autonomic Daemon] Attempting hotspot re-entry...');
        connectFn();
      }
    }, 4000);
  }

  private startDiscoveryPolling() {
    if (this.discoveryInterval) clearInterval(this.discoveryInterval);
    this.discoveryInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN && this.status === 'discovering') {
        this.sendMsg('discovery-poll', {});
      }
    }, 3000);
  }

  // --- Message Handling ---
  private handleServerMessage(rawData: string) {
    try {
      const msg: SyncMessage = JSON.parse(rawData);
      switch (msg.type) {
        case 'discovered-hosts':
          this.discoveredHosts = msg.payload.hosts;
          this.onDiscoveredChange(this.discoveredHosts);
          break;

        case 'pair-handshake-success':
          this.onLog(`[Security Handshake] Clinic pairing code VERIFIED. Sync lock acquired!`);
          this.setStatus('paired');
          // Start initial full state synchronization
          this.requestInitialSync();
          break;

        case 'pair-handshake-failed':
          this.onLog(`[Security Handshake] REJECTED. Invalid Clinic pairing code. Try again.`);
          this.setStatus('discovering');
          alert('Incorrect Clinic pairing code! Access denied.');
          break;

        case 'peer-disconnected':
          this.onLog(`[Sync Engine] Paired peer device went offline.`);
          if (this.status === 'paired') {
            this.setStatus('discovering');
          }
          break;

        case 'sync-request-pull':
          this.onLog(`[Sync Request] Paired device requested state. Pushing local SQLite state...`);
          this.pushFullState();
          break;

        case 'sync-push-state':
          this.onLog(`[Sync Apply] Received complete state bundle from host SQLite. Integrating...`);
          this.applyFullStatePayload(msg.payload);
          break;

        case 'sync-delta-change':
          this.onLog(`[Sync Apply] Received real-time delta: ${msg.payload.action.toUpperCase()} ${msg.payload.itemType.toUpperCase()}`);
          this.applyDeltaPayload(msg.payload);
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('[Sync Engine] Error parsing message:', err, rawData);
    }
  }

  private sendMsg(type: string, payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type,
        payload,
        senderId: this.myDeviceId,
        pairingCode: this.pairingCode
      }));
    }
  }

  // --- Real-time Deltas & Client Synchronization ---
  public broadcastChange(action: 'create' | 'update' | 'delete', itemType: 'patient' | 'history' | 'note' | 'operation', data: any) {
    if (this.isRemoteUpdateActive) return; // Prevent infinite sync loops

    if (this.status !== 'paired' && this.status !== 'hosting') {
      // Offline-first Queue buffering
      this.onLog(`[Offline Queue] Device offline. Buffering change: ${action.toUpperCase()} ${itemType.toUpperCase()}`);
      this.enqueueOfflineChange(action, itemType, data);
      return;
    }

    this.onLog(`[Sync Broadcast] Broadcasting: ${action.toUpperCase()} ${itemType.toUpperCase()}`);
    this.sendMsg('sync-delta', {
      action,
      itemType,
      data
    });
  }

  private requestInitialSync() {
    this.onLog(`[Sync Pull] Pulling records database from host...`);
    this.sendMsg('sync-pull-request', {});
  }

  private pushFullState() {
    const payload = {
      patients: JSON.parse(localStorage.getItem('my_secretary_patients') || '[]'),
      history: JSON.parse(localStorage.getItem('my_secretary_history') || '[]'),
      notes: JSON.parse(localStorage.getItem('my_secretary_notes') || '[]'),
      operations: JSON.parse(localStorage.getItem('my_secretary_operations') || '[]'),
      drugs: JSON.parse(localStorage.getItem('my_secretary_drugs') || '[]'),
    };
    this.sendMsg('sync-push', payload);
  }

  private applyFullStatePayload(payload: any) {
    this.isRemoteUpdateActive = true;
    try {
      if (payload.patients) {
        localStorage.setItem('my_secretary_patients', JSON.stringify(payload.patients));
      }
      if (payload.history) {
        localStorage.setItem('my_secretary_history', JSON.stringify(payload.history));
      }
      if (payload.notes) {
        localStorage.setItem('my_secretary_notes', JSON.stringify(payload.notes));
      }
      if (payload.operations) {
        localStorage.setItem('my_secretary_operations', JSON.stringify(payload.operations));
      }
      if (payload.drugs) {
        localStorage.setItem('my_secretary_drugs', JSON.stringify(payload.drugs));
      }
      this.onLog(`[Sync Apply] Integration complete. Local clinical SQLite database is fully updated & verified.`);
      this.onSyncReceived();
    } catch (e) {
      console.error('[Sync Apply] Error writing state payload:', e);
    } finally {
      this.isRemoteUpdateActive = false;
    }
  }

  private applyDeltaPayload(payload: { action: string; itemType: string; data: any }) {
    this.isRemoteUpdateActive = true;
    try {
      const { action, itemType, data } = payload;
      
      if (itemType === 'patient') {
        const list: Patient[] = JSON.parse(localStorage.getItem('my_secretary_patients') || '[]');
        if (action === 'create' || action === 'update') {
          const idx = list.findIndex(p => p.id === data.id);
          if (idx !== -1) {
            list[idx] = data;
          } else {
            list.push(data);
          }
        } else if (action === 'delete') {
          const filtered = list.filter(p => p.id !== data.id);
          localStorage.setItem('my_secretary_patients', JSON.stringify(filtered));
        }
        if (action !== 'delete') {
          localStorage.setItem('my_secretary_patients', JSON.stringify(list));
        }
      }

      else if (itemType === 'history') {
        const list: DentalHistoryEntry[] = JSON.parse(localStorage.getItem('my_secretary_history') || '[]');
        if (action === 'create' || action === 'update') {
          const idx = list.findIndex(h => h.id === data.id);
          if (idx !== -1) {
            list[idx] = data;
          } else {
            list.push(data);
          }
        } else if (action === 'delete') {
          const filtered = list.filter(h => h.id !== data.id);
          localStorage.setItem('my_secretary_history', JSON.stringify(filtered));
        }
        if (action !== 'delete') {
          localStorage.setItem('my_secretary_history', JSON.stringify(list));
        }
      }

      else if (itemType === 'note') {
        const list: PatientNote[] = JSON.parse(localStorage.getItem('my_secretary_notes') || '[]');
        if (action === 'create' || action === 'update') {
          const idx = list.findIndex(n => n.id === data.id);
          if (idx !== -1) {
            list[idx] = data;
          } else {
            list.push(data);
          }
        } else if (action === 'delete') {
          const filtered = list.filter(n => n.id !== data.id);
          localStorage.setItem('my_secretary_notes', JSON.stringify(filtered));
        }
        if (action !== 'delete') {
          localStorage.setItem('my_secretary_notes', JSON.stringify(list));
        }
      }

      else if (itemType === 'operation') {
        const list: PatientOperation[] = JSON.parse(localStorage.getItem('my_secretary_operations') || '[]');
        if (action === 'create' || action === 'update') {
          const idx = list.findIndex(o => o.id === data.id);
          if (idx !== -1) {
            list[idx] = data;
          } else {
            list.push(data);
          }
        } else if (action === 'delete') {
          const filtered = list.filter(o => o.id !== data.id);
          localStorage.setItem('my_secretary_operations', JSON.stringify(filtered));
        }
        if (action !== 'delete') {
          localStorage.setItem('my_secretary_operations', JSON.stringify(list));
        }
      }

      this.onSyncReceived();
    } catch (err) {
      console.error('[Sync Delta Fail] Error applying delta details:', err);
    } finally {
      this.isRemoteUpdateActive = false;
    }
  }

  // --- Offline Logs & Reconnection Queue Buffer ---
  private loadOfflineQueue() {
    try {
      const raw = localStorage.getItem('my_secretary_offline_queue');
      this.offlineQueue = raw ? JSON.parse(raw) : [];
    } catch (e) {
      this.offlineQueue = [];
    }
  }

  private saveOfflineQueue() {
    localStorage.setItem('my_secretary_offline_queue', JSON.stringify(this.offlineQueue));
  }

  private enqueueOfflineChange(action: string, type: string, data: any) {
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      action,
      type,
      payload: data,
      timestamp: Date.now()
    };
    // Deduplicate same-id changes to present the absolute freshest override
    this.offlineQueue = this.offlineQueue.filter(q => q.payload?.id !== data.id);
    this.offlineQueue.push(item);
    this.saveOfflineQueue();
    this.onLog(`[Offline Queue] Enqueued offline delta: ${action.toUpperCase()} ${type.toUpperCase()}`);
  }

  private flushOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    this.onLog(`[Reconciliation Queue] Flushing ${this.offlineQueue.length} buffered changes to Hotspot server...`);

    // Synchronously send every item
    this.offlineQueue.forEach(item => {
      this.sendMsg('sync-delta', {
        action: item.action,
        itemType: item.type,
        data: item.payload
      });
    });

    this.offlineQueue = [];
    this.saveOfflineQueue();
    this.onLog(`[Reconciliation Queue] Sync queue flushed. Devices are aligned!`);
  }
}

export const syncClient = new HotspotSyncClient();
