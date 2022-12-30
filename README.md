# This is a Profile Picture

![up](https://img.shields.io/website?down_color=red&down_message=offline&style=plastic&up_color=green&up_message=online&url=https%3A%2F%2Fthisisaprofilepicture.com)
![v](https://img.shields.io/github/package-json/v/codenamesui/thisisaprofilepicture/main?style=plastic)
![l](https://img.shields.io/github/license/codenamesui/thisisaprofilepicture?style=plastic)

This is the source code for the website [TIAPFP](https://thisisaprofilepicture.com), this was inspired by [TPDNE](https://thispersondoesnotexist.com) but instead of AI generated pictures, it gets the genetric online profile picture you'd see on Instagram, Discord, etc.


How this works, it uses `duckduckdo-images-api` to index images based on the keywords in `keywords.json`. It stores the information such as title, source, url, width, height in a SQLLite database then downloads the image and converts it into 'webp' to preserve space.

## Web Application

* `/` - Returns a random entry
* `/api` - Returns a random entry as a JSON object
* `/api/sources` - Returns URLs where images were sourced from

## Setup

* Get Node.js and install dependencies `npm i`
* Run `node task.js`, to set up the Database and tables.
* Install and configure `nginx`
* Use `crontab` to run `task.js` automatically to index Profile Pictures. 

**Crontab Setup**

`crontab -e`

```
*/5 * * * * cd path/to/project && node task.js
```

(See this website for information about crontab [crontab.guru](https://crontab.guru/).)

**NGINX Configuration**

```
server {

    listen 80;
    listen [::]:80;

    server_name pfp.example.org www.pfp.example.org;

    location / {
        proxy_pass http://localhost:5813;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```