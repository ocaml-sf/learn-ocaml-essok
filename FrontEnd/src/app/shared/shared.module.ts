import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { ServerListComponent, ServerMetaComponent, ServerPreviewComponent } from './server-helpers';
import { ListErrorsComponent } from './list-errors.component';
import { ShowAuthedDirective } from './show-authed.directive';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule
  ],
  declarations: [
    ServerListComponent,
    ServerMetaComponent,
    ServerPreviewComponent,
    ListErrorsComponent,
    ShowAuthedDirective
  ],
  exports: [
    ServerListComponent,
    ServerMetaComponent,
    ServerPreviewComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ListErrorsComponent,
    RouterModule,
    ShowAuthedDirective
  ]
})
export class SharedModule { }
