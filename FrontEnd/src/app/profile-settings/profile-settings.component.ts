import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { User, UserService, ProfilesService, Profile } from '../core';

@Component({
  selector: 'app-profile-settings-page',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  user: User = {} as User;
  userToModify: User = {} as User;
  userBase: User = {} as User;
  profileSettingsForm: FormGroup;
  errors: Object = {};
  isSubmitting = false;
  profile: Profile = {} as Profile;

  constructor(
    private router: Router,
    private userService: UserService,
    private profileService: ProfilesService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    // create form group using the form builder
    this.profileSettingsForm = this.fb.group({
      image: '',
      username: '',
      old_username: '',
      email: '',
      password: '',
      description: '',
      place: '',
      goal: '',
    });
    // Optional: subscribe to changes on the form
    // this.profileSettingsForm.valueChanges.subscribe(values => this.updateUser(values));
  }

  ngOnInit() {
    // Make a fresh copy of the current user's object to place in editable form fields
    Object.assign(this.user, this.userService.getCurrentUser());

    this.route.data.subscribe(
      (data: { profile: Profile }) => {
        this.profile = data.profile;
      }
    );

    this.profileService
      .getUser(this.profile.username)
      .subscribe(
        (userTM: any) => {
          Object.assign(this.userToModify, userTM);
          Object.assign(this.userBase, userTM);
        },
        (err: Object) => {
          this.errors = err;
        }
      );

    // Fill the form
    this.profileSettingsForm.patchValue(this.profile);
  }

  submitForm() {
    this.isSubmitting = true;

    // update the model
    this.updateUser(this.profileSettingsForm.value);

    this.userService
      .update(this.userToModify, this.userBase)
      .subscribe(
        (updatedUser: { username: string; }) => this.router.navigateByUrl('/profile/' + updatedUser.username),
        (err: Object) => {
          this.errors = err;
          this.isSubmitting = false;
        }
      );
  }

  updateUser(values: Object) {
    Object.assign(this.userToModify, values);
  }

  activateAccount() {
    this.userService
      .activateAccount(this.userToModify)
      .subscribe(
        (_success: any) =>
          this.router.navigateByUrl('/'),
        (err: Object) => {
          this.errors = err;
          this.isSubmitting = false;
        }
      );
  }
  authorizeAccount(){
    this.userService
      .authorizeAccount(this.userToModify)
      .subscribe(
        (_success: any) =>
          this.router.navigateByUrl('/'),
        (err: Object) => {
          this.errors = err;
          this.isSubmitting = false;
        }
      );
  }
}
