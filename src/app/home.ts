import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <div class="empty">
      <h1>Dati dei bot</h1>
      <p>Scegli una voce dal menu per vedere i dati della web api corrispondente.</p>
    </div>
  `,
  styles: `
    .empty { padding: 48px 32px; color: var(--muted); }
    h1 { margin: 0 0 8px; color: var(--text); font-size: 1.5rem; }
    p { margin: 0; }
  `
})
export class Home {}
