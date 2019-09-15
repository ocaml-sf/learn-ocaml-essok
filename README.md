### Getting started

## Installation from scratch

## Install nodejs

Make sure you have [nodejs](https://nodejs.org/en/)
You can download it from the offical website or with aptitude : `sudo apt install nodejs`

## Install npm

npm is distributed with Node.js- which means that when you download Node.js, you automatically get npm installed on your computer.
Make sure you have [nodejs](https://nodejs.org/en/)
You can download it from the offical website or with aptitude : `sudo apt install npm`

## Install angular/cli

upgrade to the latest version of npm :  `sudo npm i npm@latest -g` - make sure you have the permission
then install angular/cli : `sudo npm i @angular/cli -g`
Make sure you have the [Angular CLI](https://github.com/angular/angular-cli#installation) installed globally.

## Install mongodb

Make sure you have [mongodb](https://www.mongodb.com/download-center/community)
You can download it from the offical website or with aptitude : `sudo apt install mongodb`
Don't forget to start the service : `sudo service mongodb start`

## Install yarn

We use [Yarn](https://yarnpkg.com) to manage the dependencies, so we strongly recommend you to use it. you can install it from [Here](https://yarnpkg.com/en/docs/install) or from here : `sudo apt install yarn`, then run `yarn install` to resolve all dependencies (might take a minute).

## Install ng

make sure you have the lastest version of npm,
then install ng : `sudo npm i ng -g`

## Update your dependencies (npm only)

Run `npm update` for a dev server.

## Update your file BackEnd/Client/os.js

Rename it OS.js and fill the blank with your OVH config

## Update your file BackEnd/app.js

Verify the binding of all the settings with your env settings.

For example : port of your mongodb docker/server.

## Run FrontEnd

Run `ng serve` for a dev server.
Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Run Backend

Run `npm run dev` for a dev server.
