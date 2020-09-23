import { NgModule } from '@angular/core';

import { HelpComponent } from './help.component';
import { SharedModule } from '../shared';
import { HelpRoutingModule } from './help-routing.module';
import { ExpansionImgPanelsComponent }
from './expansion-img-panels/expansion-img-panels.component';

@NgModule({
  imports: [SharedModule, HelpRoutingModule],
  declarations:
  [
    HelpComponent,
    ExpansionImgPanelsComponent,
  ],
})

export class HelpModule { }
