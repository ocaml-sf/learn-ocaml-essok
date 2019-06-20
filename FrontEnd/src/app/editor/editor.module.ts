import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { EditorComponent } from './editor.component';
import { AuthGuard } from '../core';
import { SharedModule } from '../shared';
import { EditorRoutingModule } from './editor-routing.module';

@NgModule({
  imports: [SharedModule, EditorRoutingModule],
  declarations: [EditorComponent]
})
export class EditorModule { }
