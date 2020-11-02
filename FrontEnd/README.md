# FrontEnd

# Getting started

Make sure you have the [Angular CLI](https://github.com/angular/angular-cli#installation) installed globally. We use [Yarn](https://yarnpkg.com) to manage the dependencies, so we strongly recommend you to use it. You can install it from [Here](https://yarnpkg.com/en/docs/install), then run `yarn install` to resolve all dependencies (might take a minute).

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Building the project
Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build (strongly recommended for optimization). 

**General functionality:**

- Authenticate users via JWT (login/signup pages + logout button on settings page)
- CRUD users (sign up & settings page, password change, disable & unactive mode, admin panel)
- CRUD Servers (upload & download content, state of your server, teacher token retrieve)
- GET and display paginated lists of servers and users
- GDPR respectful, read it here(https://gdpr-info.eu/)
- Up to date - HELP & CONTACT pages

`CRUD (create, read, update and delete)`

**The general page breakdown looks like this:**

- Home page (URL: /#/ )
    - List of servers pulled from either Global
    - Pagination for list of servers
- Sign in/Sign up pages (URL: /#/login, /#/register )
    - Uses JWT (store the token in localStorage)
    - Authentication can be easily switched to session/cookie based
- Settings page (URL: /#/settings )
- Help page (URL: /#/help )
- Contact page (URL: /#/contact )
- Change password page (URL: /#/reset-password)
- Disable user page (URL: /#/disable-account)
- Delete user page (URL: /#/delete-account)
- Admin page (URL: /#/admin)
    - Only show if you are an admin
    - Users and servers management
    - Filters 
- Editor page to create/edit servers (URL: /#/editor, /#/editor/server-slug-here )
- Server page (URL: /#/server/server-slug-here )
    - Manage server button (only shown to server's author)
    - Delete server button (only shown to server's author)
    - Render markdown from server client side
