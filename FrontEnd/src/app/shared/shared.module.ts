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
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    MatButtonModule,
    MatDialogModule,
    MatListModule,
    FlexLayoutModule,
    MatProgressBarModule
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
    ShowAdminDirective,
    MatButtonModule,
    MatDialogModule,
    MatListModule,
    FlexLayoutModule,
    MatProgressBarModule
  ]
})
export class SharedModule { }
