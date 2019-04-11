# BTS Hunter Test Server

This project is  a sample implementation of server-side application that uses BTS Hunter API to demonstrate how API calls can be used. 

### Prerequisites

To get started, you have to have following installed on your machine:

```
* NodeJS
* MongoDB
* yarn
```

The project setup was tested and verified with following versions:
```
{
	nodejs: 10.15.0,
	mongodb: 4.0.6,
	yarn: 1.15.2
}
```

### Installing

Clone project repository on your machine by running:
```
$ git clone https://github.com/GMSoftAG/BTSHunter_Test_Server.git
```

Next step is to install necessary modules. Navigate to cloned repository and run:
```
$ yarn install
```

Finally, after exucuting above commands, open *config.js* file inside project folder. To use HTTP, set **config.https = false**. Otherwise, if you want to use HTTPS, set **config.https = true**. When using HTTPS, make sure to specify path to certificate and private key files inside using **config.ssl_cert** and **config.ssl_key** respectively. Set port number where you want to server to run **config.http_port** (if using HTTP) or **config.https_port** (if using HTTPS) respectively.

### Running

First, you have to start MongoDB server. Navigate to folder which contains MongoDB executables (Windows standard path: *C:\Program Files\MongoDB\Server\4.0\bin*). Locate *mongod* executable and run:
```
$ mongod.exe --dbpath=<path to folder where you want MongoDB data files to be stored>
```
By default, MongoDB runs on *localhost:27017* - if you change the URL or port, make sure to update **mongo_url** in *config.js*.

Next, navigate to a folder where you cloned the project and execute:
```
$ node server.js
```
You should see following output:
![Alt text](https://github.com/GMSoftAG/BTSHunter_Test_Server/blob/master/images/terminal_start.PNG "Terminal output when running project")

To verify that you server is running, open your browser and type in: 
```
(http <or> https)://<IP address specified in config.js>:<port number specified in config.js>
```
You should see empty webpage with **Server is running!** written.

To stop server, press *Ctrl+C* multiple times until you see following output:
![Alt text](https://github.com/GMSoftAG/BTSHunter_Test_Server/blob/master/images/terminal_end.PNG "Terminal output when terminating project")