const {image_search } = require("duckduckgo-images-api");
const keywords = require("./keywords.json");
const sqlite3 = require('sqlite3');
const download = require('image-downloader');
const webp = require('webp-converter');
const fs = require('fs');
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
    width text not null
    );`, ()  => {
        console.log("First time run: created database and tables, please rerun this then start 'main.js'");
        process.exit(1);
    });
}

function search(){
    let q = [`${rand(keywords['colors'])}`, `${rand(keywords['term'])}`,`${rand(keywords['terms'])}`, `${rand(keywords['obj'])}`,`${rand(keywords['src'])}`,`${rand(keywords['social'])}`];
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
            save(db, [resultSet['source'], resultSet['title'], resultSet['image'], resultSet['height'], resultSet['width']]);
        }
    }
    })
}

function parseFilename(filename) {
    let f = filename.split("/");
    return f[f.length - 1]
}

function save(db, params) {
    let url = params[2];
    options = {
        url: url,
        dest: `../../public/pix/`
      };

      download.image(options)
        .then(({ filename }) => {
            let f = parseFilename(`${filename.split(".")[0]}.webp`);

            sql = `insert into pfp (source, title, url, src, height, width) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(sql, [params[0], params[1], url, f, params[3], params[4]], (err) => {
                if(err) return console.log(err.message);
            });
            convertImage(filename)
        })
        .catch((err) => console.log(`Error getting image ${url} not saved.`));
}

function convertImage(img) {
    let i = img.split(".");

    if(i[1] == 'gif') {
        result = webp.gwebp(img, `${i[0]}.webp`,"-q 60");  
    }
    else {
        result = webp.cwebp(img, `${i[0]}.webp`,"-q 60");
    }

    result.then((response) => {
        fs.unlinkSync(img)
    })
}