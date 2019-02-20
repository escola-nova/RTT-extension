#!/bin/sh

cd package && npm i
cd ../ && zip -r package.zip package/
