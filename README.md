### Getting started

## Installation from scratch

## Install nodejs

Make sure you have [nodejs](https://nodejs.org/en/)
You can download it from the offical website or with aptitude :

`sudo apt install nodejs`

## Install npm

npm is distributed with Node.js- which means that when you download Node.js, you automatically get npm installed on your computer.
Make sure you have [nodejs](https://nodejs.org/en/)
You can download it from the offical website or with aptitude : 

`sudo apt install npm`

## Install angular/cli

upgrade to the latest version of npm :  

`sudo npm i npm@latest -g` /make sure you have the permission/

then install angular/cli : 

`sudo npm i @angular/cli -g`

Make sure you have the [Angular CLI](https://github.com/angular/angular-cli#installation) installed globally.

## Install mongodb

Make sure you have [mongodb](https://www.mongodb.com/download-center/community)
You can download it from the offical website or with aptitude : 

`sudo apt install mongodb`

Don't forget to start the service : 

`sudo service mongodb start`

## Install yarn

We use [Yarn](https://yarnpkg.com) to manage the dependencies, so we strongly recommend you to use it. you can install it from [Here](https://yarnpkg.com/en/docs/install) or from here :

`sudo apt install yarn`

Then run 

`yarn install` 

to resolve all dependencies (might take a minute).

## Install Kubectl 

Kubectl is the (Linux ?) Kubernetes command line client ! So go [there](https://kubernetes.io/docs/tasks/tools/install-kubectl) and may the force be with you !
After installing Kubectl we need to setup our config, so make this 

`mkdir ~/.kube`

Then put your kubernetes config file in this reposotory.
Hopefully you can retrieve your config file from OVH go to your `project pannel` then search for your config setup in `Containers & Orchestration` section then `Managed Kubernetes Service` then click on your project name, then scroll down and click on `kubeconfig`. Wait the file creation and download the config file, rename it as "config" (no extension, just config) then past it inside the .kube repository in your HOME. Well done !

Tips : your OVH project administrator and/or your Kubernetes expert will help you a lot if this step is too harsh for you !

## Install ng

make sure you have the lastest version of npm,
then install ng : 

`sudo npm i ng -g`

## Install your dependencies

Run 

`npm install` 

In your FrontEnd and in your BackEnd.

Or

Run 

`yarn install`

In your FrontEnd and in your BackEnd.

## Update your file BackEnd/Client/os.js

Rename it OS.js and fill the blank with your OVH config

## Update your file BackEnd/app.js

Verify the binding of all the settings with your env settings.

For example : port of your mongodb docker/server.

## Prepare your BackEnd

Create two repositories at the root of your BackEnd : uploads and downloads

`mkdir uploads && mkdir downloads`

## Run FrontEnd

Run 

`ng serve`

For a dev server.

Run 

`ng build --prod`

For a prod server. The production files will be generated in dist/ folder.

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Run Backend

Run

`npm run dev`

For a dev server.

Run 

`sudo npm install pm2 -g && npm run start`

For a prod server

## Optionnal steps : 

## Install OpenStack Swift Client

Install OpenStack Swift Client locally to manage your disk with the command line client.

`sudo apt install swift` 

Then follow the instructions and this helpful [guide](https://www.systutorials.com/docs/linux/man/1-swift/#lbAG)