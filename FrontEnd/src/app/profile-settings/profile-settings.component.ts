import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { User, UserService } from '../core';

@Component({
  selector: 'app-profile-settings-page',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  user: User = {} as User;
  profileSettingsForm: FormGroup;
  errors: Object = {};
  isSubmitting = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    // create form group using the form builder
    this.profileSettingsForm = this.fb.group({
      image: '',
      username: '',
      email: '',
      password: '',
      description: '',
      place: '',
      goal: '',
      password_verification: ''
    });
    // Optional: subscribe to changes on the form
    // this.profileSettingsForm.valueChanges.subscribe(values => this.updateUser(values));
  }

  ngOnInit() {
    // Make a fresh copy of the current user's object to place in editable form fields
    Object.assign(this.user, this.userService.getCurrentUser());
    // Fill the form
    this.profileSettingsForm.patchValue(this.user);
  }

  submitForm() {
    this.isSubmitting = true;

    // update the model
    this.updateUser(this.profileSettingsForm.value);

    this.userService
      .update(this.user)
      .subscribe(
        updatedUser => this.router.navigateByUrl('/profile/' + updatedUser.username),
        err => {
          this.errors = err;
          this.isSubmitting = false;
        }
      );
  }

  updateUser(values: Object) {
    Object.assign(this.user, values);
  }

}
