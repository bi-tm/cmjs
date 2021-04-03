CMJS
====

Pure JavaScript content management system (alpha release).

## Features:
- Integrated ExpressJS web server
- Integrated database (NeDB) 
- Server-side rendering with Handlebars
- Administration tool (using openUI5)

## Getting Started:
Prerequisite is NodeJS. Please follow the documentation at https://nodejs.org for installation.

### 1. download CMJS
```
git clone https://github.com/bi-tm/cmjs.git
```
if you don't have git, you may download cmjs as [ZIP-file](https://github.com/bi-tm/cmjs/archive/refs/heads/master.zip) and unpack it


### 2. go to cmjs directory
```
cd cmjs
```

### 3. install node modules with npm
```
npm install
```

### 4. start cmjs with npm script
```
npm start
```

You will get following output
> projectPath = ./project<br/>
> starting cmjs server...<br/>
> frontend running on http://localhost:8080/<br/>
> admin tool running on http://localhost:8080/admin

You got it! Now you can visit your new homepage or the administration tool at the given URLs.

The admin tool is password protected, user = admin, password = admin.

