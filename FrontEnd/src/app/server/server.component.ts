import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService } from '../modal';

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
  isDisabling = false;
  isDangerous = false;

  constructor(
    private route: ActivatedRoute,
    private serversService: ServersService,
    private router: Router,
    private userService: UserService,
    private modalService: ModalService
  ) { }

  ngOnInit() {
    this.loadServer();
    this.loadUser();
  }

  loadServer() {
    this.route.data.subscribe(
      (data: { server: Server }) => {
        this.server = data.server;
      }
    );
  }

  loadUser() {
    this.userService.currentUser.subscribe(
      (userData: User) => {
        this.currentUser = userData;
        this.canModify = (this.currentUser.username === this.server.author.username);
      }
    );
    this.userService.isAdmin.subscribe(
      (isAdmin) => {
        this.canModify = (this.canModify || isAdmin);
      }
    );

  }

  deleteServer() {
    this.isDeleting = true;
    this.modalService.open('pleaseWait2');
    this.serversService.destroy(this.server.slug)
      .subscribe(
        success => {
          this.modalService.close('pleaseWait2');
          this.router.navigateByUrl('/');
        }
      );
  }

  toggleServerStatus() {
    this.isDisabling = true;
    this.serversService.disable(this.server.slug)
      .subscribe(
        success => {
          this.router.navigateByUrl('/');
        }
      );
  }
  toggleDangerous() {
    this.isDangerous = !this.isDangerous;
  }

}
