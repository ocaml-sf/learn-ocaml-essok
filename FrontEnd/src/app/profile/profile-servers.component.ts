import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ServerListConfig, Profile } from '../core';

@Component({
  selector: 'app-profile-servers',
  templateUrl: './profile-servers.component.html'
})
export class ProfileServersComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }
  profile: Profile;

  serversConfig: ServerListConfig = {
    type: 'all',
    filters: {}
  };

  ngOnInit() {
    this.route.parent.data.subscribe(
      (data: { profile: Profile }) => {
        this.profile = data.profile;
        this.serversConfig = {
          type: 'all',
          filters: {
            author: this.profile.username,
            active: true
          }
        };
      }
    );
  }

}
