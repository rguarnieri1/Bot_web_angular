import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, scan, startWith, switchMap } from 'rxjs';

import { BotApi, TablePage, schemaLabel, tableLabel } from './bot-api';

interface ViewState {
  loading: boolean;
  error: string | null;
  data: TablePage | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const dateFormat = new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'medium' });
const numberFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 8 });

@Component({
  selector: 'app-table-view',
  templateUrl: './table-view.html',
  styleUrl: './table-view.css'
})
export class TableView {
  private readonly api = inject(BotApi);

  /** Parametri di rotta (:schema/:table), collegati dal router. */
  readonly schema = input.required<string>();
  readonly table = input.required<string>();

  protected readonly pageSizes = [25, 50, 100, 500];
  protected readonly pageSize = signal(50);
  /** Torna a pagina 1 quando cambia tabella o dimensione pagina. */
  protected readonly page = linkedSignal({
    source: () => `${this.schema()}/${this.table()}/${this.pageSize()}`,
    computation: () => 1
  });
  private readonly reload = signal(0);

  private readonly query = computed(() => ({
    schema: this.schema(),
    table: this.table(),
    page: this.page(),
    pageSize: this.pageSize(),
    reload: this.reload()
  }));

  protected readonly state = toSignal(
    toObservable(this.query).pipe(
      switchMap(q =>
        this.api.rows(q.schema, q.table, q.page, q.pageSize).pipe(
          map((data): ViewState => ({ loading: false, error: null, data })),
          catchError(err =>
            of<ViewState>({
              loading: false,
              data: null,
              error: err.status === 404 ? 'Web api non trovata.' : 'Web api non raggiungibile su http://localhost:5000.'
            })
          ),
          startWith<ViewState>({ loading: true, error: null, data: null })
        )
      ),
      // Durante il caricamento tiene a schermo i dati precedenti della stessa tabella.
      scan((prev, cur) =>
        cur.loading && prev.data?.table === this.table() ? { ...cur, data: prev.data } : cur
      )
    ),
    { initialValue: { loading: true, error: null, data: null } as ViewState }
  );

  protected readonly title = computed(() => `${schemaLabel(this.schema())} · ${tableLabel(this.schema(), this.table())}`);
  protected readonly rows = computed(() => this.state().data?.rows ?? []);
  protected readonly total = computed(() => this.state().data?.total ?? 0);
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly columns = computed(() => (this.rows().length ? Object.keys(this.rows()[0]) : []));
  protected readonly range = computed(() => {
    const first = (this.page() - 1) * this.pageSize() + 1;
    return { first, last: first + this.rows().length - 1 };
  });

  protected refresh(): void {
    this.reload.update(n => n + 1);
  }

  protected goTo(page: number): void {
    this.page.set(Math.min(Math.max(page, 1), this.pageCount()));
  }

  protected setPageSize(value: string): void {
    this.pageSize.set(Number(value));
  }

  protected header(column: string): string {
    return column.charAt(0).toUpperCase() + column.slice(1);
  }

  protected isNumber(value: unknown): boolean {
    return typeof value === 'number';
  }

  protected format(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Sì' : 'No';
    if (typeof value === 'number') return numberFormat.format(value);
    if (typeof value === 'string' && ISO_DATE.test(value)) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : dateFormat.format(date);
    }
    return String(value);
  }
}
