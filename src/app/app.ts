import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { BotApi, TableInfo, schemaLabel, tableLabel } from './bot-api';

interface MenuGroup {
  label: string;
  items: { label: string; link: string[] }[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly api = inject(BotApi);

  private readonly state = toSignal(
    this.api.tables$.pipe(
      map(tables => ({ tables, error: false })),
      catchError(() => of({ tables: [] as TableInfo[], error: true }))
    )
  );

  protected readonly loading = computed(() => this.state() === undefined);
  protected readonly error = computed(() => this.state()?.error ?? false);

  /** Una voce di menu per ogni web api, raggruppate per bot. */
  protected readonly menu = computed<MenuGroup[]>(() => {
    const groups = new Map<string, MenuGroup>();
    for (const t of this.state()?.tables ?? []) {
      let group = groups.get(t.schema);
      if (!group) groups.set(t.schema, (group = { label: schemaLabel(t.schema), items: [] }));
      group.items.push({ label: tableLabel(t.schema, t.table), link: ['/', t.schema, t.table] });
    }
    return [...groups.values()];
  });
}
