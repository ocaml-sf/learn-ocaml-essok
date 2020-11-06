import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';


import { ExpansionImgPanelsComponent }
from './expansion-img-panels/expansion-img-panels.component';
import { ListErrorsComponent } from './list-errors.component';
import {
  ServerListComponent,
  ServerMetaComponent,
  ServerPreviewComponent
} from './server-helpers';
import { UserListComponent, UserPreviewComponent } from './user-helpers';
import { ShowAuthedDirective } from './show-authed.directive';
import { ShowAdminDirective } from './show-admin.directive';

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatStepperModule,
    ReactiveFormsModule,
    ScrollingModule,
  ],
  declarations: [
    ShowAuthedDirective,
    ExpansionImgPanelsComponent,
    ListErrorsComponent,
    ServerListComponent,
    ServerMetaComponent,
    ServerPreviewComponent,
    UserListComponent,
    UserPreviewComponent,
    ShowAdminDirective,
  ],
  exports: [
    CommonModule,
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    ListErrorsComponent,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatStepperModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    RouterModule,
    ExpansionImgPanelsComponent,
    ScrollingModule,
    ServerListComponent,
    ServerMetaComponent,
    ServerPreviewComponent,
    UserListComponent,
    UserPreviewComponent,
    ShowAuthedDirective,
    ShowAdminDirective,
  ]
})
export class SharedModule { }
