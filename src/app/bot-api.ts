import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

/** Una web api esposta da Bot_web_api (una per tabella del database). */
export interface TableInfo {
  schema: string;
  table: string;
  url: string;
  columns: string[];
}

export interface TablePage {
  schema: string;
  table: string;
  total: number;
  page: number;
  pageSize: number;
  rows: Record<string, unknown>[];
}

/** Indirizzo di Bot_web_api (che autorizza questa app via CORS). */
export const API_BASE_URL = 'http://localhost:5000';

@Injectable({ providedIn: 'root' })
export class BotApi {
  private readonly http = inject(HttpClient);

  /** Elenco delle web api disponibili: da qui nascono le voci di menu. */
  readonly tables$: Observable<TableInfo[]> = this.http
    .get<TableInfo[]>(`${API_BASE_URL}/api/tables`)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  rows(schema: string, table: string, page: number, pageSize: number): Observable<TablePage> {
    return this.http.get<TablePage>(`${API_BASE_URL}/api/${schema}/${table}`, { params: { page, pageSize } });
  }
}

/** "bot1" -> "Bot 1" */
export function schemaLabel(schema: string): string {
  return schema.replace(/^bot(\d+)$/i, 'Bot $1');
}

/** "bot1_operazioni_chiuse" -> "Operazioni chiuse" */
export function tableLabel(schema: string, table: string): string {
  const name = table.startsWith(schema + '_') ? table.slice(schema.length + 1) : table;
  const text = name.replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
