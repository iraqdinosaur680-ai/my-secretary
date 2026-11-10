import * as fs from 'fs';
import * as path from 'path';

// Highly-polished Relational Simulation of SQLite backing the Host Hotspot device
export interface SQLiteTable {
  columns: string[];
  rows: Record<string, any>[];
}

class SQLiteSimulation {
  private dbPath: string;
  private tables: Record<string, SQLiteTable> = {};

  constructor() {
    this.dbPath = path.join(process.cwd(), 'clinic_records_sqlite.db');
    this.loadDatabase();
  }

  private loadDatabase() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const rawJson = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(rawJson);
        this.tables = parsed.tables || {};
        console.log(`[SQLITE SIM] Loaded sqlite.db located at ${this.dbPath}. Synchronized with SQLite tables: ${Object.keys(this.tables).join(', ')}`);
      } else {
        this.bootstrap();
      }
    } catch (e) {
      console.warn('[SQLITE SIM] Failed to load server database. Bootstrapping new file...', e);
      this.bootstrap();
    }
  }

  private saveDatabase() {
    try {
      const data = {
        meta: {
          engine: "SQLite 3.45.0 (Simulated Virtual Engine)",
          journalMode: "WAL (Write-Ahead Logging)",
          updatedAt: new Date().toISOString()
        },
        tables: this.tables
      };
      
      // Perform write atomic-safely like an SQLite WAL cycle
      const tempPath = this.dbPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      
      if (fs.existsSync(this.dbPath)) {
        fs.renameSync(tempPath, this.dbPath); // Atomic replace
      } else {
        fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
        try { fs.unlinkSync(tempPath); } catch {}
      }
    } catch (err) {
      console.error('[SQLITE SIM] Failed writing changes to sqlite.db transaction storage:', err);
    }
  }

  private bootstrap() {
    this.tables = {
      patients: {
        columns: ['id', 'patientId', 'fullName', 'gender', 'dateOfBirth', 'phoneNumber', 'address', 'createdAt', 'lastVisitDate'],
        rows: []
      },
      consultations: {
        columns: ['id', 'patientId', 'visitDate', 'diagnosis', 'symptoms', 'treatment', 'notes', 'billingAmount'],
        rows: []
      },
      notes: {
        columns: ['id', 'patientId', 'date', 'title', 'content'],
        rows: []
      },
      operations: {
        columns: ['id', 'patientId', 'patientName', 'operationName', 'operationDate', 'notes', 'isDone', 'createdAt'],
        rows: []
      },
      drugs: {
        columns: ['id', 'tradeName', 'scientificName', 'dosageForm', 'strength', 'instructions'],
        rows: []
      }
    };
    this.saveDatabase();
    console.log(`[SQLITE SIM] Instantiated offline database backing file: clinic_records_sqlite.db`);
  }

  // --- SQL DDL / DML Simulated APIs ---
  public executeSQL(statement: string, params: any[] = []): any {
    const query = statement.trim().replace(/\s+/g, ' ');
    const lowerQuery = query.toLowerCase();

    // 1. SELECT Query Parser
    if (lowerQuery.startsWith('select')) {
      const tableMatch = query.match(/from\s+([a-zA-Z_]+)/i);
      if (!tableMatch) return [];
      const tableName = tableMatch[1].toLowerCase();
      const table = this.tables[tableName];
      if (!table) return [];

      let result = [...table.rows];

      // Support basic WHERE parameters filtering (e.g. patientId = ?)
      const whereMatch = query.match(/where\s+([a-zA-Z_]+)\s*=\s*\?/i);
      if (whereMatch && params.length > 0) {
        const col = whereMatch[1];
        const val = params[0];
        result = result.filter(row => String(row[col]) === String(val));
      }

      return result;
    }

    // 2. INSERT INTO Query Parser
    if (lowerQuery.startsWith('insert')) {
      const tableMatch = query.match(/insert\s+into\s+([a-zA-Z_]+)/i);
      if (!tableMatch) return false;
      const tableName = tableMatch[1].toLowerCase();
      const table = this.tables[tableName];
      if (!table) return false;

      // Extract raw keys and values
      if (params.length > 0) {
        // Prepare row insertion
        const newRow: Record<string, any> = {};
        table.columns.forEach((col, idx) => {
          if (idx < params.length) {
            newRow[col] = params[idx];
          }
        });
        
        // Relational safety block: Ensure UUID id is present
        if (!newRow.id) {
          newRow.id = params[0] || Math.random().toString(36).substring(2,9);
        }

        // Check if ID already exists, overwrite if matching (Idempotency)
        const existingIdx = table.rows.findIndex(r => r.id === newRow.id);
        if (existingIdx !== -1) {
          table.rows[existingIdx] = { ...table.rows[existingIdx], ...newRow };
        } else {
          table.rows.push(newRow);
        }
        
        this.saveDatabase();
        return true;
      }
    }

    // 3. UPDATE Query Parser
    if (lowerQuery.startsWith('update')) {
      const tableMatch = query.match(/update\s+([a-zA-Z_]+)/i);
      if (!tableMatch) return false;
      const tableName = tableMatch[1].toLowerCase();
      const table = this.tables[tableName];
      if (!table) return false;

      const whereMatch = query.match(/where\s+([a-zA-Z_]+)\s*=\s*\?/i);
      if (whereMatch && params.length >= 2) {
        const setColName = query.match(/set\s+([a-zA-Z_]+)/i)?.[1];
        if (!setColName) return false;

        const whereCol = whereMatch[1];
        
        // For simple single UPDATE sets
        const setVal = params[0];
        const targetId = params[1];

        table.rows = table.rows.map(row => {
          if (String(row[whereCol]) === String(targetId)) {
            return { ...row, [setColName]: setVal };
          }
          return row;
        });

        this.saveDatabase();
        return true;
      }
    }

    // 4. DELETE Query Parser
    if (lowerQuery.startsWith('delete')) {
      const tableMatch = query.match(/from\s+([a-zA-Z_]+)/i);
      if (!tableMatch) return false;
      const tableName = tableMatch[1].toLowerCase();
      const table = this.tables[tableName];
      if (!table) return false;

      const whereMatch = query.match(/where\s+([a-zA-Z_]+)\s*=\s*\?/i);
      if (whereMatch && params.length > 0) {
        const col = whereMatch[1];
        const val = params[0];

        const prevLength = table.rows.length;
        table.rows = table.rows.filter(row => String(row[col]) !== String(val));
        
        if (table.rows.length !== prevLength) {
          this.saveDatabase();
          return true;
        }
      }
    }

    return false;
  }

  // --- Batch State Alignment Sync ---
  public importFullDBScope(payload: any) {
    if (payload.patients) this.tables.patients.rows = payload.patients;
    if (payload.history) this.tables.consultations.rows = payload.history;
    if (payload.notes) this.tables.notes.rows = payload.notes;
    if (payload.operations) this.tables.operations.rows = payload.operations;
    if (payload.drugs) this.tables.drugs.rows = payload.drugs;
    this.saveDatabase();
  }

  public exportFullDBScope() {
    return {
      patients: this.tables.patients.rows,
      history: this.tables.consultations.rows,
      notes: this.tables.notes.rows,
      operations: this.tables.operations.rows,
      drugs: this.tables.drugs.rows
    };
  }
}

export const sqliteSim = new SQLiteSimulation();
