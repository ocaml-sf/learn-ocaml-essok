import {
    Directive,
    Input,
    OnInit,
    TemplateRef,
    ViewContainerRef
  } from '@angular/core';
  
  import { UserService } from '../core';
  
  @Directive({ selector: '[appShowAdmin]' })
  export class ShowAdminDirective implements OnInit {
    constructor(
      private templateRef: TemplateRef<any>,
      private userService: UserService,
      private viewContainer: ViewContainerRef
    ) { }
  
    condition: boolean;
  
    ngOnInit() {
      this.userService.isAdmin.subscribe(
        (isAdmin) => {
          if (isAdmin && this.condition || !isAdmin && !this.condition) {
            this.viewContainer.createEmbeddedView(this.templateRef);
          } else {
            this.viewContainer.clear();
          }
        }
      );
    }
  
    @Input() set appShowAdmin(condition: boolean) {
      this.condition = condition;
    }
  
  }
  