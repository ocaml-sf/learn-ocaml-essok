import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Server,
  ServersService,
  User,
  UserService
} from '../core';

@Component({
  selector: 'app-server-page',
  templateUrl: './server.component.html'
})
export class ServerComponent implements OnInit {
  server: Server;
  currentUser: User;
  canModify: boolean;
  isSubmitting = false;
  isDeleting = false;

  constructor(
    private route: ActivatedRoute,
    private serversService: ServersService,
    private router: Router,
    private userService: UserService,
  ) { }

  ngOnInit() {
    // Retreive the prefetched server
    this.route.data.subscribe(
      (data: { server: Server }) => {
        this.server = data.server;

      }
    );

    // Load the current user's data
    this.userService.currentUser.subscribe(
      (userData: User) => {
        this.currentUser = userData;

        this.canModify = (this.currentUser.username === this.server.author.username);
      }
    );
  }

  deleteServer() {
    this.isDeleting = true;

    this.serversService.destroy(this.server.slug)
      .subscribe(
        success => {
          this.router.navigateByUrl('/');
        }
      );
  }

}
