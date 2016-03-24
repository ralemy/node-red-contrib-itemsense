#!/usr/bin/env bash
if [ "$1" = "" ]
then
    "Please provide the commit statement"
    exit
fi

git add .
git commit -m "$1"

if [ "$2" = "" ]
then
    npm version patch -m "$1"
    exit
fi

npm version $2 -m "$1"

