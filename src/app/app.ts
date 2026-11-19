import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, filter, map, of } from 'rxjs';

import { BotApi, TableInfo, schemaLabel, tableLabel } from './bot-api';

interface MenuBot {
  schema: string;
  label: string;
  items: { label: string; link: string[] }[];
}

interface MenuSection {
  label: string;
  bots: MenuBot[];
}

/** Sezione di menu di un bot: Crypto = bot 1-10, USA = bot 11 e successivi (11-13), il resto in "Altro". */
function sectionOf(schema: string): string {
  const n = Number(/^bot(\d+)$/i.exec(schema)?.[1]);
  if (!n) return 'Altro';
  return n <= 10 ? 'Crypto' : 'USA';
}

const SECTION_ORDER = ['Crypto', 'USA', 'Altro'];

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

  private readonly router = inject(Router);

  /** Schema (es. "bot11") della pagina aperta: serve a tenere aperte le voci di menu corrispondenti. */
  protected readonly currentSchema = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url.split('/')[1] ?? '')
    ),
    { initialValue: this.router.url.split('/')[1] ?? '' }
  );

  /** Menu a tre livelli: sezione (Crypto / USA) > bot > tabelle. */
  protected readonly menu = computed<MenuSection[]>(() => {
    const bots = new Map<string, MenuBot>();
    for (const t of this.state()?.tables ?? []) {
      let bot = bots.get(t.schema);
      if (!bot) bots.set(t.schema, (bot = { schema: t.schema, label: schemaLabel(t.schema), items: [] }));
      bot.items.push({ label: tableLabel(t.schema, t.table), link: ['/', t.schema, t.table] });
    }
    const sections = new Map<string, MenuSection>();
    for (const bot of bots.values()) {
      const label = sectionOf(bot.schema);
      let section = sections.get(label);
      if (!section) sections.set(label, (section = { label, bots: [] }));
      section.bots.push(bot);
    }
    return [...sections.values()].sort((a, b) => SECTION_ORDER.indexOf(a.label) - SECTION_ORDER.indexOf(b.label));
  });

  protected isOpen(section: MenuSection): boolean {
    return section.bots.some(b => b.schema === this.currentSchema());
  }
}
