import { Component, inject } from '@angular/core';
import { ProductsAppliedViewComponent } from '../components/products-applied-view.component';
import { ProductsAppliedStateService } from '../../../core/services/products-applied-state.service';
import { ModalStateService } from '../../../core/services/modal-state.service';

@Component({
  selector: 'app-products-applied-page',
  standalone: true,
  imports: [ProductsAppliedViewComponent],
  template: `
    <app-products-applied-view
      [records]="productsAppliedState.pagedRecords()"
      [totalResults]="productsAppliedState.filtered().length"
      [statusFilters]="productsAppliedState.statusFilters"
      [activeStatusFilter]="productsAppliedState.statusFilter()"
      [searchTerm]="productsAppliedState.searchTerm()"
      [page]="productsAppliedState.page()"
      [totalPages]="productsAppliedState.totalPages()"
      (statusFilterChange)="productsAppliedState.setStatusFilter($event)"
      (searchTermChange)="productsAppliedState.setSearchTerm($event)"
      (pageChange)="productsAppliedState.setPage($event)"
      (openPet)="modalState.openPetModal($event)"
    />
  `
})
export class ProductsAppliedPageComponent {
  readonly productsAppliedState = inject(ProductsAppliedStateService);
  readonly modalState = inject(ModalStateService);
}
