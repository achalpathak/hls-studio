"use strict";
const path = require('path');
const {app} = require("electron");
const IS_PROD = process.env.NODE_ENV === "production";
const root = process.cwd();
const { isPackaged } = app;

const binariesPath =
  IS_PROD && isPackaged
    ? process.resourcesPath
    : path.join(root, "./external");

const execPath = path.join(binariesPath, "./ffmpeg");

module.exports = {execPath}