const {image_search } = require("duckduckgo-images-api");
const data = require("./data.json");
const sqlite3 = require('sqlite3');
const sharp = require('sharp');
const axios = require('axios');
const moment = require('moment');
const UserAgent = require("user-agents");
const userAgent = new UserAgent();
const randomstring = require("randomstring");
const db = new sqlite3.Database('./pfp.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err && err.code == "SQLITE_CANTOPEN") {
        createDatabase();
        return;
        } else if (err) {
            console.log("Getting error " + err);
            process.exit(1);
    }
    collectImages();
});

function createDatabase() {
    var newdb = new sqlite3.Database('pfp.db', (err) => {
        if (err) {
            console.log("Getting error " + err);
            process.exit(1);
    }
        createTables(newdb);
    });
}

function createTables(newdb) {
    newdb.exec(`create table pfp (
    id INTEGER PRIMARY KEY not null,
    source text not null,
    title text not null,
    url text not null,
    src text not null,
    height text not null,
    width text not null,
    date text not null,
    unique (src)
    );
    create table logs (
    id INTEGER PRIMARY KEY not null,
    type text not null,
    msg text not null,
    date text not null
    );
    `, ()  => {
            console.log("First time run: created database and tables, please rerun this then start 'main.js'");
            process.exit(1);
    });
}

function search(){
    let q = [`${rand(data['colors'])}`, `${rand(data['term'])}`,`${rand(data['terms'])}`, `${rand(data['obj'])}`,`${rand(data['src'])}`,`${rand(data['social'])}`];
    return shuffle(q).join(' ');
}

function rand(items) {
    return items[~~(items.length * Math.random())];
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function collectImages() {
    image_search({ query: search(), moderate: true ,iterations :5, retries:10 }).then(
    r => {  
    for (let resultSet of r){
	        if(resultSet['width'] >= 128 && resultSet['height'] >= 128 && resultSet['width'] <= 1028 && resultSet['height'] <= 1028 && resultSet['width'] == resultSet['height']) {
            save(db, [resultSet['source'], resultSet['title'], resultSet['image'], resultSet['height'], resultSet['width'], moment().unix()]);
        }
    }
    })
}

function log(db, type, msg) {
    sql = `insert into logs (type, msg, date) VALUES (?, ?, ?)`;
    db.run(sql, [type, msg, moment.unix()], (err) => {
        if(err) {
           return console.log("tiapfp : log insert error " + err);
        }
    })
}

function save(db, params) {
    let url = params[2];
    axios({url: url, responseType: "arraybuffer", headers: { 'User-Agent': userAgent.toString() }})
    .then(function(response) {
        try {
            if(response.status == 200) {
                let src = `${randomstring.generate(20)}.webp`;

                sharp(Buffer.from(response.data))
                .webp({
                    quality: 60
                })
                .toFile(`./public/pix/${src}`, (err, info) => {
                    sql = `insert or replace into pfp (source, title, url, src, height, width, date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    db.run(sql, [params[0], params[1], url, src, params[3], params[4], params[5]], (err) => {
                        if(err) { log(db, "db insert error", err.message) }
                    });
                    if(err) { log(db, "db insert error", err.message) }

                 }); 
            }
        }
        catch (err) { log(db, "axios error", err) }
    });
    
}
