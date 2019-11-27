let recordDecompiler = null;
let getIDFieldName = null;

// Create records of recordType from releases with unique identifier
async function processQueue(queue, source, recordType) {
    recordDecompiler = require('./record_types/' + recordType + 'Record').recordDecompiler;
    getIDFieldName = require('./record_types/' + recordType + 'Record').getIDFieldName;

    for(let i=0; i<queue.length; i++) {
        // Search sources for releases with same unique identifier
        let records = await getRecords(queue[i], source);

        if(records.length > 0) {
            records.map( (record) => {
                // Send array of releases and merge into a record
                let pieces = recordDecompiler(queue[i], record);
                // Output pieces for all the world to see
                pieces.map( (piece) => {
                    process.stdout.write(JSON.stringify(piece)); // TODO: output individual pieces!!!
                    process.stdout.write('\n');
                } );

                record = null;
                pieces = null;
            } );
        }
    }
}

async function getRecords(id, source) {
    let idField = getIDFieldName();
    let records = await source.find({ [idField]: id });
    return records;
}

module.exports = processQueue;
