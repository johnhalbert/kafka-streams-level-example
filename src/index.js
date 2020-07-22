'use strict';

// 
// ----[ Dependencies ]---------------------------------------------------------
//

const express = require('express');
const level = require('level');
const { KafkaStreams } = require('kafka-streams');

//
// ----[ Configuration ]--------------------------------------------------------
//
// These configuration options come from Apache Kafka itself.  For a complete
// list of configuration options, refer to both the Kafka-Streams Documentation,
// as well as the Apache Kafka Documentation.
//
// NOTE: For Boolean values, the presence of any value in the Environment
//       Variable will cause that option to be true.  For false values, leave
//       the variable unset.
//
// NOTE: This application was designed with a view to being one of many micro
//       services doing work with Apache Kafka under the same project, or for
//       the same enterprise.  These services can be scaled horizontally,
//       distributing the available work amongst same services.  The Group ID
//       serves the purpose of allowing Kafka to organize work amongst many same
//       services, while the Client ID allows identification of a single actor
//       within the group.  The Group ID should be the same for each same 
//       service, while the Client ID should be unique in some way.
//

// 
// Allow working with .env files.
//

require('dotenv').config();

//
// NOTE: For a more complicated application, where multiple topics are consumed,
//       the name of the topics to be consumed will be encoded directly in the
//       application, rather than specified by configuration.
//

const topic = process.env.TOPIC;

//
// Final confuration object.
//
const config = {
  // Option                       Environment Variable                              // Sane Default
  noptions: {
    'metadata.broker.list':       process.env.METADATA_BROKER_LIST,                 // 'localhost:9092'
    'group.id':                   process.env.GROUP_ID,                             // 'common-id'
    'client.id':                  process.env.CLIENT_ID,                            // 'unique-id'
    event_cb:                     Boolean(process.env.EVENT_CB),                    // true
    'compression.codec':          process.env.COMPRESSION_CODEC,                    // 'snappy'
    'api.version.request':        Boolean(process.env.API_VERSION_REQUEST),         // false
    'socket.keepalive.enable':    Boolean(process.env.SOCKET_KEEPALIVE_ENABLE),     // true
    'socket.blocking.max.ms':     parseInt(process.env.SOCKET_BLOCKING_MAX_MS),     // 100
    'enable.auto.commit':         Boolean(process.env.ENABLE_AUTO_COMMIT),          // false
    'auto.commit.interval.ms':    parseInt(process.env.AUTO_COMMIT_INTERVALS),      // 100
    'heartbeat.interval.ms':      parseInt(process.env.HEARTBEAT_INTERVAL_MS),      // 250
    'retry.backoff.ms':           parseInt(process.env.RETRY_BACKOFF_MS),           // 250
    'fetch.min.bytes':            parseInt(process.env.FETCH_MIN_BYTES),            // 100
    'fetch.message.max.bytes':    parseInt(process.env.FETCH_MESSAGE_MAX_BYTES),    // 2 * 1024 * 1024
    'queued.min.messages':        parseInt(process.env.QUEUED_MIN_MESSAGES),        // 100
    'fetch.error.backoff.ms':     parseInt(process.env.FETCH_ERROR_BACKOFF_MS),     // 100
    'queued.max.messages.kbytes': parseInt(process.env.QUEUED_MAX_MESSAGES_KBYTES), // 50
    'fetch.wait.max.ms':          parseInt(process.env.FETCH_WAIT_MAX_MS),          // 1000
    'queue.buffering.max.ms':     parseInt(process.env.QUEUE_BUFFERING_MAX_MS),     // 1000
    'batch.num.messages':         parseInt(process.env.BATCH_NUM_MESSAGES),         // 10000
  },
  tconf: {
    'auto.offset.reset':          process.env.AUTO_OFFSET_RESET,                    // 'earliest',
    'request.required.acks':      parseInt(process.env.REQUEST_REQUIRED_ACKS),      // 1
  },
  batchOptions: {
    batchSize:                    parseInt(process.env.BATCH_SIZE),                 // 5
    commitEveryNBatch:            parseInt(process.env.COMMIT_EVERY_N_BATCH),       // 1
    concurrency:                  parseInt(process.env.CONCURRENCY),                // 1
    commitSync:                   Boolean(process.env.COMMIT_SYNC),                 // false
    noBatchCommits:               Boolean(process.env.NO_BATCH_COMMITS),            // false
  } 
};

//
// ----[ Streams Runtime ]--------------------------------------------------------------
//

const kvStore = level(topic);
const kafkaStreams = new KafkaStreams(config);
const stream = kafkaStreams.getKStream(topic);
const table = kafkaStreams.getKTable(topic, ({ key, value }) => ({ key: key && key.toString(), value: JSON.parse(value.toString()) }));

stream.forEach(handleMessage); //console.log(message.key ? message.key.toString() : null, JSON.parse(message.value.toString())));
kafkaStreams.on('error', err => console.error(err));
stream.start()
  .then(
    () => console.log('Stream running'),
    err => console.error(err)
  )
  .catch(err => console.error(err));

table.start()
  .then(
    () => console.log('Table running'),
    err => console.error(err)
  );

function handleMessage({ key, value, offset }) {
  if (!key)
    return console.error(`No key for message ${value.toString()}`);

  const k = key.toString();
  const v = value.toString();
  
  kvStore.put(k, v, err => console.error('Error:', err));
}

//
// ----[ API Runtime ]----------------------------------------------------------
//

const app = express();

app.get('/:id', handleGet);
app.get('/table/:id', handleTableGet);

app.listen(process.env.PORT || 3000, () => console.log('Express :3000'));

function handleGet(req, res) {
  const { params: { id } } = req;

  kvStore.get(id, respondWithValueOrError(res));
}

function respondWithValueOrError(res) {
  return function handleKVRecord(error, value) {
    if (error) {
      console.error(error);
      res.json({ error });
    } else {
      res
        .type('application/json')
        .send(value)
        .end();
    }
  };
}

function handleTableGet(req, res) {
  const { params: { id } } = req;

  table
    .storage
    .get(id)
    .then(val => res.json(val));
}
