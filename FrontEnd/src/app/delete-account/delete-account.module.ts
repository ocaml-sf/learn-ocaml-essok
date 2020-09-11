import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthGuard } from '../core';
import { SharedModule } from '../shared';
import { DeleteAccountComponent } from './delete-account.component';
import { DeleteAccountRoutingModule } from './delete-account-routing.module';

@NgModule({
  imports: [
    SharedModule,
    DeleteAccountRoutingModule
  ],
  declarations: [
    DeleteAccountComponent
  ]
})
export class DeleteAccountModule { }
