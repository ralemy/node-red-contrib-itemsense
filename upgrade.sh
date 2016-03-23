#!/usr/bin/env bash
if [ "$1" = "" ]
then
    echo "Please provide the commit statement"
    exit
fi

git add .
git commit -m "$1"
npm version patch -m "$1"
