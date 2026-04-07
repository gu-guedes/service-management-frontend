import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard-view">
      <div class="stats-grid">
        <article *ngFor="let stat of statItems" class="stat-card">
          <div>
            <p class="label">{{ stat.label }}</p>
            <h2>{{ stat.value }}</h2>
            <p class="delta">{{ stat.delta }}</p>
          </div>
          <span class="stat-icon" [ngClass]="stat.iconClass">{{ stat.icon }}</span>
        </article>
      </div>

      <div class="content-grid">
        <article class="card">
          <header class="card-header">
            <div>
              <h3>Agenda de Hoje</h3>
              <p>Atendimentos previstos no periodo</p>
            </div>
          </header>

          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Pet</th>
                <th>Procedimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of appointments">
                <td>{{ row.time }}</td>
                <td>
                  <p class="strong">{{ row.pet }}</p>
                  <p class="sub">{{ row.tutor }}</p>
                </td>
                <td>{{ row.procedure }}</td>
                <td>
                  <span class="badge" [ngClass]="row.statusClass">{{ row.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </article>

        <aside class="side-column">
          <article class="card">
            <header class="card-header">
              <h3>Acoes Rapidas</h3>
            </header>
            <div class="quick-actions">
              <button type="button" (click)="newPet.emit()">Novo Pet</button>
              <button type="button" (click)="newTutor.emit()">Novo Tutor</button>
              <button type="button">Agendar</button>
              <button type="button">Vacinas</button>
            </div>
          </article>

          <article class="card">
            <header class="card-header">
              <h3>Vacinas Vencendo</h3>
            </header>
            <div class="alerts-list">
              <div class="alert-item" *ngFor="let alert of vaccineAlerts">
                <div>
                  <p class="strong">{{ alert.pet }}</p>
                  <p class="sub">{{ alert.detail }}</p>
                </div>
                <span class="badge" [ngClass]="alert.urgencyClass">{{ alert.urgency }}</span>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </section>
  `
})
export class DashboardViewComponent {
  @Input() statItems: Array<{ label: string; value: string; delta: string; icon: string; iconClass: string }> = [];
  @Input() appointments: Array<{ time: string; pet: string; tutor: string; procedure: string; status: string; statusClass: string }> = [];
  @Input() vaccineAlerts: Array<{ pet: string; detail: string; urgency: string; urgencyClass: string }> = [];

  @Output() newPet = new EventEmitter<void>();
  @Output() newTutor = new EventEmitter<void>();
}
