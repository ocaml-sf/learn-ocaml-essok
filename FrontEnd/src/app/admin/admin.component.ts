import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService, User, Profile, UserListConfig } from '../core';
import { concatMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  usersConfig: UserListConfig = {
    type: 'all',
    filters: {}
  };
  title: string;
  header: string;
  body: string;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) { }

  user: User = {} as User;

  isAdmin: boolean;
  isServer: boolean;
  isUser: boolean;

  ngOnInit() {
    Object.assign(this.user, this.userService.getCurrentUser());
    this.isUser = true;
    this.isServer = false;
  }

  getServer() {
    this.isServer = true;
    this.isUser = false;
  }

  getUser() {
    this.isServer = false;
    this.isUser = true;
  }

}
