import { Routes } from '@angular/router';

import { Home } from './home';
import { TableView } from './table-view';

export const routes: Routes = [
  { path: '', component: Home, title: 'Bot – Dati' },
  { path: ':schema/:table', component: TableView },
  { path: '**', redirectTo: '' }
];
