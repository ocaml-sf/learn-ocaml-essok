import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService, User, Profile, UserListConfig, FilterService } from '../core';
import { concatMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  title: string;
  header: string;
  body: string;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private filterService: FilterService
  ) { }

  user: User = {} as User;

  isAdmin: boolean;
  isServer: boolean;
  isUser: boolean;
  isActive: boolean;
  isAuthorized: boolean;

  ngOnInit() {
    Object.assign(this.user, this.userService.getCurrentUser());
    this.isUser = true;
    this.isServer = false;
    this.isActive = false;
    this.isAuthorized = true;
    this.filterService.getActive(this.isActive);
    this.filterService.getAuthorized(this.isAuthorized);

  }

  getServer() {
    this.isServer = true;
    this.isUser = false;
  }

  getUser() {
    this.isServer = false;
    this.isUser = true;
  }
  getActived() {
    this.isActive = !this.isActive;
    this.isAuthorized = false;
    this.filterService.getActive(this.isActive);
  }
  getAuthorized() {
    this.isAuthorized = !this.isAuthorized;
    this.isActive = false;
    this.filterService.getAuthorized(this.isAuthorized);
  }
}
