# tournaments-to-json
Grab tournament info for local parsing.

# Server Maintenance

## Determine what OS I'm running on
`lsb_release -a`

## Update Ubuntu 18.04 from command line
- `sudo apt update` to refresh package database
- Install/apply updates: `sudo apt upgrade`
- Reboot the system if kernel was updated by typing `sudo reboot`

### UPGRADE
- `sudo upt upgrade` will upgrade packages and system files, including kernel



# Development workflow on remote HOSTED server

1. Git pull
1. Make changes, commit
1. Build the Docker image and publish to dockerhub
- `docker login`
- 'docker image list`
- `docker image rm r2j` // to get rid of existing image before building a new one
- `docker build --rm -t t2j .`
- `docker image ls`
- `docker tag t2j geekjournal/t2j:latest`
- `docker tag t2j geekjournal/t2j:1.x`
- `docker push geekjournal/t2j:latest`
3 Stop currently running container
- `docker ps`
- `docker rm -f t2j`
- `docker ps`
4. Run the server
- `docker run -d --restart unless-stopped -p 3000:8080 --name t2j geekjournal/t2j:latest`
5. ssh to remote server
6. `docker login`
7. `docker pull t2j geekjournal/t2j:1.x`
8. `docker stop t2j`
9. `docker run -d --restart unless-stopped -p 3000:8080 --name t2j geekjournal/t2j:1.x`

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
- `docker login`
- `docker build --rm -t t2j .`
- `docker image ls`
- `docker tag t2j geekjournal/t2j:latest`
- `docker push geekjounal/t2j:latest`

## run in background with -d, exposes container port 8080 as port 80 on local machine
`docker run -d -p 80:8080 t2j`

## run from remote repository
`docker run -d --restart unless-stopped -p 80:8080 geekjournal/t2j:latest`

## run on server api.geekjournal.com behind an nginx loadbalancer
`docker run -d --restart unless-stopped -p 3000:8080 geekjournal/t2j:latest`

## stop the container
`docker container stop HASH`

# setup For App Engine on Google Cloud
NOTE:  Gcloud custom apps ONLY run when exposed and listening on port 8080

## Initialize right account and check to make sure on correct project
- `gcloud init`
- `gcloud info | grep project:`

## Deploy to App Engine
`gcloud app deploy`

# Get image locally so can put in source control for gcloud
1. `curl -b https://raw.githubusercontent.com/moby/moby/master/contrib/download-frozen-image-v2.sh`

1. `bash download-frozen-image-v2.sh t2jImgDir geekjournal/t2j:latest`

1. `tar -C 't2jImgDir' -cf 't2j.tar' .`

1. `mv t2j.tar t2j.img`

# Running let's encrypt
See:
https://medium.com/bros/enabling-https-with-lets-encrypt-over-docker-9cad06bdb82b

Also re run this command on api.geekjournal.com to renew the cert. You don't need to be root.

```
docker run --rm -it -v "/root/letsencrypt/log:/var/log/letsencrypt" -v "/var/www/html/shared:/var/www/" -v "/etc/letsencrypt:/etc/letsencrypt" -v "/root/letsencrypt/lib:/var/lib/letsencrypt" geekjournal/letsencrypt certonly --webroot --webroot-path /var/www --email admin@geekjournal.com -d api.geekjournal.com
```

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

But, NOTE the above command doesn't work for api.geekjournal.com since need to run inside a container

# setup auto-renewal via cron ... may need to make new dir /var/log/certbot and chmod 777 /var/log/cerbot in order to run the following since doesn't
# run as root
1. `sudo -i` to become root
1. `0 0 * * * docker run --rm -v "/root/letsencrypt/log:/var/log/letsencrypt" -v "/var/www/html/shared:/var/www/" -v "/etc/letsencrypt:/etc/letsencrypt" -v "/root/letsencrypt/lib:/var/lib/letsencrypt" geekjournal/letsencrypt renew >> /var/log/certbot/certbot.log 2>&1 && service nginx reload >> /var/log/certbot/certbot.log 2>&1`
