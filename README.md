# Node.js + Kafka Streams + LevelDB

The purpose of this repository is to serve as a proof of concept for the use of
the current production version of [kafka-streams](https://www.npmjs.com/package/kafka-streams),
along with [level](https://www.npmjs.com/package/level), which is a convenience
wrapper for loading the required packages to work with [LevelDB](https://github.com/google/leveldb)
in Node.js.

In Java, where the original implementation of [Kafka Streams](https://kafka.apache.org/documentation/streams/)
exists, [RockDB](https://rocksdb.org/) is used as the key-value store for
aggregation of values in a topic.  Unlike Node.js, however, working with Rocks
is abstracted below the interface provided by Streams.  The key-value store
used for abstractions like `KTable` and `KGlobalTable` in streams, while
accessible to the user, is mainly handled via configuration rather than working
directly with the key-value store itself.

This does make the Java implementation of Kafka Streams more desirable.  Also,
because of the maturity of the project, the implementation is much more robust.
This repository aims to provide the same capability that makes Kafka Streams so
powerful, especially when working with data from Kafka in a microservice
architecture, in Node.js.  LevelDB is well supported and popular for Node.js,
more so than RocksDB at the time of writing this, and seemed like a better
choice.  Also, while kafka-streams has a `KTable` interface, which can provide
a queryable store to the user, the store is not queryable while waiting for new
messages to its topic.  It's only after the consumer has stopped consuming that
the user can access the store, which removes its value in this context.

## Goal Of This Design

The goal of the design is to demonstrate how to aggregate data written to a
topic using kafka-streams.  Using the provided key, we build a key value
store that can later serve records through an API endpoint.

The API endpoint itself is not necessary.  This design could also be used to
substitute any datastore required by an application, including those for API
requests as well as other applications like GraphQL.

This is just a proof of concept, porting what's easily done in other languages
to JavaScript via Node.js.
