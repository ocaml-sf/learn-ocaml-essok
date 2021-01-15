import { Component, OnInit } from '@angular/core';
import { User, UserService } from '../../core';

import { BUTTONS } from './routerButtonHeader';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
    constructor(
        private userService: UserService
    ) { }
    currentUser: User;
    BUTTONS = BUTTONS;

    ngOnInit() {
        this.userService.currentUser.subscribe(
            (userData) => {
                this.currentUser = userData;
                // TODO: check why 2 responses instead of 1
                if(this.currentUser.username !== undefined) {
                    this.BUTTONS.REGULARUSERS =
                        this.BUTTONS.newREGULARUSERS(this.currentUser.username);
                    this.BUTTONS.ADMINUSERS =
                        this.BUTTONS.newADMINUSERS(this.currentUser.username);

                    console.log(this.BUTTONS);
                }
            }
        );
    }

    logout() {
        this.userService.purgeAuth();
    }
}
