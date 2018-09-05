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

## run in background with -d, exposes container port 8080 as port 80 on local machine
`docker run -d -p 80:8080 t2j`

## run from remote repository
`docker run -d --restart unless-stopped -p 80:8080 geekjournal/t2j:latest`

## stop the container
`docker container stop HASH`

# setup gcloud
NOTE:  Gcloud custom apps ONLY run when exposed and listening on port 8080

## Initialize right account and check to make sure on correct project
`gcloud init`
`gcloud info | grep project:`

## Deploy to App Engine
`gcloud app deploy`

# Get image locally so can put in source control for gcloud
1. `curl -b https://raw.githubusercontent.com/moby/moby/master/contrib/download-frozen-image-v2.sh`

1. `bash download-frozen-image-v2.sh t2jImgDir geekjournal/t2j:latest`

1. `tar -C 't2jImgDir' -cf 't2j.tar' .`

1. `mv t2j.tar t2j.img`

# Running let's encrypt

```
docker run --rm -it -v "/root/letsencrypt/log:/var/log/letsencrypt" -v "/var/www/html/shared:/var/www/" -v "/etc/letsencrypt:/etc/letsencrypt" -v "/root/letsencrypt/lib:/var/lib/letsencrypt" geekjournal/letsencrypt certonly --webroot --webroot-path /var/www --email admin@geekjournal.com -d api.geekjournal.com
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Plugins selected: Authenticator webroot, Installer None
Obtaining a new certificate
Performing the following challenges:
http-01 challenge for api.geekjournal.com
Using the webroot path /var/www for all unmatched domains.
Waiting for verification...
Cleaning up challenges

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/api.geekjournal.com/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/api.geekjournal.com/privkey.pem
   Your cert will expire on 2018-12-01. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le
```

# Certbot output
`certbot renew`   is the command to renew the cert

# setup auto-renewal via cron
1. `sudo -i` to become root
1. `0 0 * * * docker run --rm -v "/root/letsencrypt/log:/var/log/letsencrypt" -v "/var/www/html/shared:/var/www/" -v "/etc/letsencrypt:/etc/letsencrypt" -v "/root/letsencrypt/lib:/var/lib/letsencrypt" geekjournal/letsencrypt renew >> /var/log/certbot.log 2>&1 && service nginx reload >> /var/log/certbot.log 2>&1`
