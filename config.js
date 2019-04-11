let config = {};

/* To run HTTP, set config.https=false */
config.https = false;
config.http_port = 1234;
config.https_port = 443;

/* SSL settings */
config.ssl_cert = "https/server.crt";
config.ssl_key = "https/key.pem";

/* MongoDB settings */
config.mongo_url = "localhost:27017";

module.exports = config;