# BTS Hunter Test Server

This project is  a sample implementation of server-side application that uses BTS Hunter API to demonstrate how API calls can be used. 

### Prerequisites

To get started, you have to have following installed on your machine:

```
- NodeJS
- MongoDB
- yarn
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

Finally, after exucuting above commands, open *config.js* file inside project folder and configure whether you want to use HTTP or HTTPS (when using HTTPS, make sure to have certificate, *server.crt*, and private key, *key.pem*, in *https/* folder), set port and IP address where you want server to run.

### Running

First, you have to start MongoDB server. Navigate to folder which contains MongoDB executables (Windows standard path: *C:\Program Files\MongoDB\Server\4.0\bin*). Locate *mongod* executable and run:
```
$ mongod.exe --dbpath=<path to folder where you want MongoDB data files to be stored>
```
By default, this project assumes that MongoDB is running on default port 27017 - if you change the port, make sure to change it in *server.js* as well.

Make sure to change

Next, navigate to a folder where you cloned the project and execute:
```
$ node server.js
```
You should see following output:
![Alt text](https://github.com/GMSoftAG/BTSHunter_Test_Server/images/terminal_start.png "Terminal output when running project")

To verify that you server is running, open your browser and type in: 
```
(http <or> https)://<IP address specified in config.js>:<port number specified in config.js>
```
You should see empty webpage with **Server is running!** written.

To stop server, press *Ctrl+C* multiple times until you see following output:
![Alt text](https://github.com/GMSoftAG/BTSHunter_Test_Server/images/terminal_end.png "Terminal output when terminating project")