import { NgModule } from '@angular/core';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from './confirm-dialog.service';
import { SharedModule } from '../shared';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [CommonModule],
    declarations: [
        ConfirmDialogComponent,
    ],
    providers: [
        ConfirmDialogService
    ],
    exports: [ConfirmDialogComponent]

})
export class ConfirmDialogModule { }

