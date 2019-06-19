import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { HelpComponent } from './help.component';
import { AuthGuard } from '../core';
import { SharedModule } from '../shared';
import { HelpRoutingModule } from './help-routing.module';

@NgModule({
  imports: [SharedModule, HelpRoutingModule],
  declarations: [HelpComponent]

})
export class HelpModule {}
