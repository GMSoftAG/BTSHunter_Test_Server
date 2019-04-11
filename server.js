'use strict';

/* imports */
const http = require('http');
const http_shutdown = require('http-shutdown');
const https = require('https');
const socket_io = require('socket.io');
const express = require('express')();
const utils = require("./utils");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const config = require("./config");

/* reading from console */
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// /* adds input listener which listens for 'start_scan' or 'stop_scan' commands */
// function add_input_listener(socket) {
//     console.log("----------------");
//     console.log("To send 'start_scan' command, type 'start_scan:[<RAT>, ..., <RAT>]' listing radio access types that you want to be scanned. Supported RAT are: LTE, UMTS, GSM.");
//     console.log("To send 'stop_scan' command, type 'stop_scan'");
//     console.log("----------------");
//     rl.setPrompt("Input command>\n");
//     rl.prompt();
//     rl.on("line", function (command) {
//         if (command === "stop_scan") {
//             console.log("Sending 'stop_scan' command...")
//             socket.emit('stop_scan', function (success) {
//                 if (success) {
//                     console.log("Device stopped scanning!");
//                 } else {
//                     console.log("Device failed to stop scanning!");
//                 }
//             });
//         } else if (command.slice(-1) === "]" && command.startsWith("start_scan:[")) {
//             const arr_start_idx = command.indexOf("[");
//             const rat_str = command.substring(arr_start_idx+1, command.length - 1);
//             var params = [];
//             if (rat_str.indexOf(",") != -1) {
//                 const rat_strs = rat_str.split(",");
//                 rat_strs.forEach(function (rat) {
//                     if (utils.is_valid_rat_str(rat)) {
//                         params.push(rat);
//                     } else {
//                         console.log("Invalid parameter: " + rat + "! Command will not be sent.");
//                         params = [];
//                     }
//                 });
//             } else {
//                 if (utils.is_valid_rat_str(rat_str)) {
//                     params.push(rat_str);
//                 } else {
//                     console.log("Invalid RAT parameter: " + rat_str);
//                 }
//             }
//             if (params.length > 0) {
//                 socket.emit('start_scan', { "rat": params }, function (success) {
//                     if (success) {
//                         console.log("Device started scanning!");
//                     } else {
//                         console.log("Device failed to start scanning!");
//                     }
//                 });
//             }
//         } else {
//             console.log("Unrecognized input!");
//         }
//         rl.prompt();
//     });
// }

/* checks which sockets are authorized */
let sockets_map = new Map();

/* importing SSL certificates */
const https_options = {
    key: fs.readFileSync(path.join(__dirname, config.ssl_key), 'utf8'),
    cert: fs.readFileSync(path.join(__dirname, config.ssl_cert), 'utf8')
};

/* connect to the database and start the server */
const mongo_client = require('mongodb').MongoClient;
let server;
let db_client;
let users_coll;
function createServer() {
    return new Promise(function (resolve, reject) {
        mongo_client.connect("mongodb://" + config.mongo_url, function (err, database) {
            if (err) {
                reject(err);
            } else {
                db_client = database;
                const db = database.db('btshunter_api_test');
                users_coll = db.collection('users');
                if (config.https) {
                    server = https.createServer(https_options, express);
                } else {
                    server = http.createServer(express);
                }
                const shutdown = http_shutdown(server);
                server.on('error', err => {throw err;});
                resolve(server);
            }
        }); 
    });
}

/* Serving sample .html to verify server is running */
express.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

/* function that terminates HTTP/HTTPS server, connection to MongoDB and node.js eventloop */
function shutdownServer() {
    server.shutdown(() => {
        console.log("Server terminated!");
        db_client.close(() => {
            console.log("Database connection terminated");
            process.exit(0);
        });
    });
}

/* Auxilary function */
process.on('SIGINT', () => {
    shutdownServer();
});

/* Auxilary function */
process.on('SIGTERM', () => {
    shutdownServer();
}); 

/* sets up socket-io event handlers */
function setupSocketIo(server) {
    if(!server) {
        console.log("Server is unavailable.");
        return;
    }
    const io = socket_io(server);

    io.sockets.on('connection', function (socket) {

        console.log('New connection from ' + socket.handshake.address);
        console.log("Is connection secure? " + socket.handshake.secure.toString().toUpperCase());
    
        /* this socket is unauthorized yet */
        sockets_map.set(socket.id, false);
    
        socket.on('disconnect', () => {
            console.log("Client disconnected!");
            /* remove socket from socket map */
            if (sockets_map.has(socket.id)) {
                sockets_map.delete(socket.id);
            }
        });
    
        /* Registration & Authentication functions */
    
        var token_insert_timeout;
        socket.on('device_authentication', function (data) {
            var device_auth_obj = JSON.parse(data);
    
            users_coll.findOne({ token: device_auth_obj.token }, function (err, result) {
                if (err) throw err;
    
                if (result) {
                    console.log("Client with device_id: " + device_auth_obj.device_id + ", token: " + device_auth_obj.token + " sent a verification request");
                    if (result.status === "Approved") {
                        console.log("Device with device_id: " + device_auth_obj.device_id + " is verified!");
                        socket.emit('device_authentication_response', { 'status': 2, 'message': "You are verified" });
                        /* mark socket as authorized */
                        sockets_map.set(socket.id, true);
                        console.log("Socket authorized");
                        //add_input_listener(socket);
                    } else if (result.status === "Pending") {
                        console.log("Device with device_id: " + device_auth_obj.device_id + " has pending registration request!");
                        socket.emit('device_authentication_response', { 'status': 1, 'message': "Your registration request is pending" });
                    } else {
                        console.log("Closing socket...");
                        socket_io.close();
                    }
                } else {
                    console.log("Client with device_id: " + device_auth_obj.device_id + ", token: " + device_auth_obj.token + " sent a registration request");
                    socket.emit('device_authentication_response', { 'status': 1, 'message': "Your registration request is pending" });
                    users_coll.insertOne({ status: "Pending", token: device_auth_obj.token });
    
                    rl.setPrompt("Do you want to accept registration request from user with device_id: " + device_auth_obj.device_id + "? (Y/N)\n");
                    rl.prompt();
                    rl.on("line", function (answer) {
                        if (answer === "Y") {
                            socket.emit('device_authentication_response', { 'status': 2, 'message': "Your registration request is approved" });
                            users_coll.updateOne({ token: device_auth_obj.token }, { $set: { status: "Approved" } });
                            sockets_map.set(socket.id, true);
                            console.log("Socket authorized");
                            //add_input_listener(socket);
                            rl.close();
                        } else if (answer === "N") {
                            socket.emit('device_authentication_response', { 'status': 0, 'message': "Your registration request is rejected" });
                            users_coll.deleteOne({ token: device_auth_obj.token });
                            sockets_map.delete(socket.id);
                            console.log("Closing socket...");
                            socket_io.close();
                            rl.close();
                        } else {
                            rl.prompt();
                        }
                    });
                }
            });
            console.log("**********");
        });
    
        socket.on('cancel_registration', function (data) {
            var token_data = JSON.parse(data);
            console.log("Client with token: " + token_data.token + " attempts to cancel it's registration");
            users_coll.findOne({ token: token_data.token }, function (err, result) {
                if (err) throw err;
    
                if (result.status === "Approved") {
                    console.log('Client with token: ' + result.token + " is deregistered!");
                    users_coll.deleteOne({ token: token_data.token });
                    sockets_map.delete(socket.id);
                } else if (result.status === "Pending") {
                    console.log('Client with token: ' + token_data.token + " cancelled it's registration request");
                    users_coll.deleteOne({ token: token_data.token });
                    if (token_insert_timeout) {
                        clearTimeout(token_insert_timeout);
                        token_insert_timeout = null;
                    }
                }
                console.log("Closing socket...");
                socket_io.close();
            });
            console.log("**********");
        });
    
        /* Detecting cells */
    
        socket.on('cell_detection', function (data) {
            if (sockets_map.get(socket.id)) {
                const cell_data = JSON.parse(data);
                console.log("Cell detection event:");
                console.log("   " + utils.cell_to_str(cell_data.cell));
                console.log("   " + utils.event_to_str(cell_data.event));
                console.log("**********");
            } else {
                console.log("Unauthorized connection! Closing socket...");
                socket_io.close();
            }
        });
    
        socket.on('suspicious_cells', function (data) {
            if (sockets_map.get(socket.id)) {
                const cell_data = JSON.parse(data);
                console.log("Received list of suspicious cells:");
                cell_data.cells.forEach(function (cell) {
                    console.log("   " + utils.cell_to_str(cell));
                });
                console.log("**********");
            } else {
                console.log("Unauthorized connection! Closing socket...");
                socket_io.close();
            }
        });
    
        /* Searching cells */
    
        socket.on('cell_search', function (data) {
            if (sockets_map.get(socket.id)) {
                const cell_search_data = JSON.parse(data);
                console.log("Cell search event:");
                console.log("   " + utils.cell_to_str(cell_search_data.cell));
                cell_search_data.search_events.forEach(function (event) {
                    console.log("   " + utils.event_to_str(event));
                });
                console.log("**********");
            } else {
                console.log("Unauthorized connection! Closing socket...");
                socket_io.close();
            }
        });
    
        socket.on('start_search', function (data) {
            if (sockets_map.get(socket.id)) {
                const cell_data = JSON.parse(data);
                console.log("Start search event:");
                console.log("   " + utils.cell_to_str(cell_data.cell));
                console.log("    Location information: " + utils.location_str_from_array(cell_data.location[0], cell_data.location[1]));
                console.log("    Timestamp: " + cell_data.timestamp);
                console.log("**********");
            } else {
                console.log("Unauthorized connection! Closing socket...");
                socket_io.close();
            }
        });
    
        /* Auxilary functions */
    
        socket.on('location_update', function (data) {
            if (sockets_map.get(socket.id)) {
                const loc_data = JSON.parse(data);
                console.log("Location update at location=" + utils.location_str_from_array(loc_data.location[0], loc_data.location[1]) + " at time=" + loc_data.timestamp);
                console.log("**********");
            } else {
                console.log("Unauthorized connection! Closing socket...");
                socket_io.close();
            }
        });
    
        socket.on('begin_scan', function () {
            if (sockets_map.get(socket.id)) {
                console.log("Device began scanning");
                console.log("**********");
            } else {
                console.log("Unauthorized connection! Closing socket...");
                socket_io.close();
            }
        });
    
        socket.on('finish_scan', function () {
            if (sockets_map.get(socket.id)) {
                console.log("Device finished scanning");
                console.log("**********");
            } else {
                console.log("Unauthorized connection! Closing socket...");
                socket_io.close();
            }
        });
    });
}

/*
Main function:
- creates server (can be configured HTTP or HTTPS)
- attaches socket-io listener on the server and sets up event handles according to API
- starts server
*/
function launchApp() {
    const serverPromise = createServer();
    serverPromise.then(function(result) {
        setupSocketIo(result);
        if(config.https) {
            result.listen(config.https_port, () => {
                console.log("Server started at port " + config.https_port);
            });
        } else {
            result.listen(config.http_port, () => {
                console.log("Server started at port " + config.http_port);
            });
        }
    }, function(error) {
        console.log("Failed to start server!");
    });    
}

launchApp();