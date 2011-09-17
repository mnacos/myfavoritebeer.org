const
url = require('url'),
mongodb = require('mongodb');

var collections = {
  dev:  undefined,
  beta: undefined,
  prod: undefined
};

exports.connect = function(cb) {
  if (!process.env.MONGOLAB_URI) {
    throw "no MONGOLAB_URI env var!  persistence is missing!  I give up!";
  }
  var bits = url.parse(process.env.MONGOLAB_URI);
  var server = new mongodb.Server(bits.hostname, bits.port, {});
  new mongodb.Db(bits.pathname.substr(1), server, {}).open(function (err, cli) {
    if (err) return cb(err);
    collections.dev = new mongodb.Collection(cli, 'devbeers');
    collections.local = collections.dev;
    collections.beta = new mongodb.Collection(cli, 'betabeers');
    collections.prod = new mongodb.Collection(cli, 'prodbeers');

    // now authenticate
    var auth = bits.auth.split(':');
    cli.authenticate(auth[0], auth[1], function(err) {
      cb(err);
    });
  });
}; 

exports.get = function(collection, email, cb) {
  var c = collections[collection].find({ email: email }, { beer: 1 });
  c.toArray(function(err, docs) {
    if (err) return cb(err);
    if (docs.length != 1) return cb("consistency error!  more than one doc returned!");
    cb(undefined, docs[0].beer);
  });
};

exports.set = function(collection, email, beer, cb) {
  collections[collection].update(
    { email: email },
    {
      email: email,
      beer: beer
    },
    {
      safe:true,
      upsert: true
    }, cb);
};
