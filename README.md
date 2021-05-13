# game-engine

## How to

1. [Download node](https://nodejs.org/en/)

2. clone repo

3. Run `npm install` to install packages listed in `package.json` into `./node_modules`

4. Run `npm start` to start the native application

## Folders & Files

* `/src/main.js` is the script that starts electron

* `/src/app` contains the "front end" stuff

* `/src/assets` contains static files used in the game

## About

This game engine is priarily made of two parts.

1. webGL

2. electron

Electron has proven to improve the framerate greatly, especially with the ability to run a node environment on the desktop instead of strictly running on top of chrome.

## Plans

* Keep improving engine features (Lighting, models, textures, collision, etc..)

* Logically seperate code

* Keep this readme up to date and try to document stuff

* Custom file types and data structures that stay true to OpenGL's low level logic

* Implement tools such as level editors
