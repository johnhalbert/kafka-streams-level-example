# Node.js + Kafka Streams + LevelDB

The purpose of this repository is to serve as a proof of concept for the use of
the current version of [kafka-streams](https://www.npmjs.com/package/kafka-streams),
along with [level](https://www.npmjs.com/package/level), which is a convenience
wrapper for loading the required packages to work with [LevelDB](https://github.com/google/leveldb)
in Node.js.

In Java, where the original implementation of [Kafka Streams](https://kafka.apache.org/documentation/streams/)
exists, [RocksDB](https://rocksdb.org/) is used as the key-value store for
aggregation of values in a topic.  Unlike kafka-streams in Node.js, however,
working with Rocks in the Java implementation Kafka Streams is abstracted below
the interface provided by Streams. The key-value store used for abstractions
like `KTable` and `KGlobalTable` in streams, while accessible to the user, is
mainly handled via configuration rather than working directly with the key-value
store itself.

This makes the Java implementation of Kafka Streams more desirable.  Also,
because of the maturity of the project, the implementation is much more robust.
This repository aims to provide the same capability for querying the key value
store in kafka-streams for Node.js that makes Kafka Streams so powerful. 

LevelDB is well supported and is a popular key value store for Node.js. Based
on stats provided by [npmjs.org](https://npmjs.org), more so than the equivalent
Node.js package providing bindings for RocksDB, at the time of writing this. For
this reason, LevelDB seemed like a better choice for this project.

While kafka-streams has a `KTable` interface, which can provide a queryable store
to the user, accessing the store requires the consumer performing the aggregation
to the store be stopped, disallowing further updates to the key value store.  In
addition to this limitation, restarting consumption of the aggregated topic is
not a straightforward process, which makes the abstraction provided currently by
kafka-streams much less powerful than its Java counterpart.  This work is an
attempt to correct this.

## Goal Of This Design

The goal of the design is to demonstrate how to aggregate data written to a
topic using kafka-streams.  Using the provided key, we build a key value
store that can later serve records through an API endpoint.

The API endpoint itself is not necessary.  This design could also be used to
substitute any datastore required by an application, including those for API
requests as well as other applications like GraphQL.

This is just a proof of concept, porting what's easily done in other languages
to JavaScript via Node.js.
