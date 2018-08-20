# tournaments-to-json
Grab tournament info for local parsing.

# Start the app
run `npm start`

# API

## Force scraping to happen
`curl http://localhost:8080/scrape`

## Get tournaments
`curl http://localhost:8080/tournaments`

## Get tournament by ID (accepts either webLink ID or tournament ID)
`curl http://localhost:8080/tournament/:ID`

# Docker Commands

## Build the docker image and publish to dockerhub
`docker login`
`docker build -t t2j .`
`docker image ls`
`docker tag t2j geekjournal/t2j:latest`
`docker push geekjounal/t2j:latest`

## run in background with -d, exposes container port 8081 as port 80 on local machine
`docker run -d -p 8080:8080 t2j`

## run from remote repository
`docker run -p 8080:8080 geekjournal/t2j:latest`

## stop the container
`docker container stop HASH`

# setup gcloud
NOTE:  Gcloud custom apps ONLY run when exposed and listening on port 8080

## Initialize right account and check to make sure on correct project
`gcloud init`
`gcloud info | grep project:`

## Deploy to App Engine
`gcloud app deploy`


