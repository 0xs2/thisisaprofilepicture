const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const parseUrl = require('parse-url');
const sqlite3 = require('sqlite3');
const app = express()
const db = new sqlite3.Database('./pfp.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
            console.log("Please run the task.js first and make sure to set a crontab for it for how often you want to index images. 'README.md' for details.");
            process.exit(1);
    }
});

app.set("view engine", "ejs");

app.use(compression());
app.use(express.static('public/'));

app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());


app.get("/", (req,res) => {
        randomQuery(db).then(r => {        
        return res.render('index', {result: r[0]})});
});

app.get("/api", (req,res) => {
        randomQuery(db).then(r => { return res.json(r)});
});

app.get("/api/sources", (req,res) => {
        getSources(db).then(rows => { 
        let results = [];

        rows.forEach(row => {
                results.push(parseUrl(row['url'])['resource'])
        })

        let result = results.filter((x, i) => i === results.indexOf(x));
        let count = result.length;
                
        return res.json({count: count, sources:result});
        });
});

const randomQuery = (db) => {
        return new Promise((resolve, reject)=>{
        sql = `SELECT id,title,src,height,width FROM pfp ORDER BY RANDOM() LIMIT 1;`;
        db.all(sql, [], (err, row) => {
                if (err)
                reject(err)
            resolve(row)
        });       
        });
}

const getSources = (db) => {
        return new Promise((resolve, reject)=>{
        
        sql = `SELECT distinct(url) FROM pfp;`;
        db.all(sql, [], (err, rows) => {
                if (err)
                reject(err)
            resolve(rows)
        });       
        });  
}

app.listen(5813)
