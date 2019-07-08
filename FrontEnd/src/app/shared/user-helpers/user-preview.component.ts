import { Component, Input } from '@angular/core';

import { User } from '../../core';

@Component({
  selector: 'app-user-preview',
  templateUrl: './user-preview.component.html'
})
export class UserPreviewComponent {
  @Input() user: User;
}
