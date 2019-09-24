import { Component, Input, OnInit } from '@angular/core';

import { User, UserService } from '../../core';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() ocamlsfPath : string = 'assets/ocamlsf-logo/';
  smallLogoImg : string = 'small_logo.svg';

  constructor(
    private userService: UserService
  ) { }

  currentUser: User;

  ngOnInit() {
    this.userService.currentUser.subscribe(
      (userData) => {
        this.currentUser = userData;
      }
    );
  }

  logout() {
    this.userService.purgeAuth();
  }
}
