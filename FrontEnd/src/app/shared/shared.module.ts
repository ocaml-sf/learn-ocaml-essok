import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { ServerListComponent, ServerMetaComponent, ServerPreviewComponent } from './server-helpers';
import { ListErrorsComponent } from './list-errors.component';
import { ShowAuthedDirective } from './show-authed.directive';
import { ShowAdminDirective } from './show-admin.directive';
import { UserListComponent, UserPreviewComponent } from './user-helpers';

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
    UserListComponent,
    UserPreviewComponent,
    ListErrorsComponent,
    ShowAuthedDirective,
    ShowAdminDirective

  ],
  exports: [
    ServerListComponent,
    ServerMetaComponent,
    ServerPreviewComponent,
    UserListComponent,
    UserPreviewComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ListErrorsComponent,
    RouterModule,
    ShowAuthedDirective,
    ShowAdminDirective
  ]
})
export class SharedModule { }
