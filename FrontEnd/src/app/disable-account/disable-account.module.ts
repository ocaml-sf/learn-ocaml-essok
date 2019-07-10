import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthGuard } from '../core';
import { SharedModule } from '../shared';
import { DisableAccountRoutingModule } from './disable-account-routing.module';
import { DisableAccountComponent } from './disable-account.component';

@NgModule({
  imports: [
    SharedModule,
    DisableAccountRoutingModule
  ],
  declarations: [
    DisableAccountComponent
  ]
})
export class DisableAccountModule { }
