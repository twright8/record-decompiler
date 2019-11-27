#!/usr/bin/env node
var hrstart = process.hrtime();
var hrend = 0;

const JSONStream = require('JSONStream');
const es = require('event-stream');
const monk = require('monk');
const commandLineArgs = require('command-line-args');
const processQueue = require('./lib/unmerge.js')

const optionDefinitions = [
    { name: 'collection', alias: 'c', type: String },
    { name: 'database', alias: 'd', type: String },
    { name: 'recordType', alias: 'r', type: String },
    { name: 'host', alias: 'h', type: String },
    { name: 'port', alias: 'p', type: String }
];

const args = commandLineArgs(optionDefinitions);

if(!args.database || !args.collection ) {
    console.log('ERROR: missing parameters.');
    process.exit(1);
}

// Connect to MongoDB and get sources
const recordType = args.recordType ? args.recordType : 'ocds';
const url = 'mongodb://' + (args.host ? args.host : 'localhost') + ':' + (args.port ? args.port : '27017') + '/' + args.database;
const db = monk(url, {useUnifiedTopology: true});
const queue = [];

process.stdin.setEncoding('utf8');

// Read unique identifiers from lines
process.stdin
    .pipe(es.split())
    .pipe(es.mapSync(function (line) {
        if(line) queue.push(line);
    }));

process.stdin.on('end', () => {
    // Send queue and sources to record creator of type recordType
    processQueue(queue, db.get(args.collection), recordType).then( () => {
        hrend = process.hrtime(hrstart);
        // console.log('Duration: ' + hrend[0] + '.' + hrend[1] + 's');
        process.exit();
    })
    .catch( (e) => { console.log(e); process.exit(1); } ); // In case of error...
});
