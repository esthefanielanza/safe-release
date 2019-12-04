# safe-release

A tool to identify breaking and non-breaking changes between two versions of a JavaScript library.

## Catalog of changes

| Category  | Description |
| ------------- | ------------- |
| Breaking  | remove function, remove class, add parameter without default value |
| Non-breaking  | add function, add class, add parameter with default value, remove parameter | 

## Getting started

First,  make sure you have git and a Node.js (version [8.12](https://nodejs.org/dist/v8.12.0/)) installed in your system. 

```bash

git clone https://github.com/esthefanielanza/safe-release.git

cd safe-release

node app.js
```

## Usage scenarios

The tool provides four HTTP POST APIs: `compareRemote`, `compare`, `compareFiles`, and `compareAllVersions`.

####  Detecting changes between two tags/branches:

URL: 

```java
localhost:3000/compareRemote
```

Body:

```java
{
    "repoURL": "https://github.com/owner/project"
    "version":
        {
            "older" : "v1.0",
            "newer" : "v2.0"
        }
}
```

####  Detecting changes between two directories:

URL:

```java
localhost:3000/compare
```
Body:

```java
{
    "older" : "./repos/older/project",
    "newer" : "./repos/newer/project"
}
```

####  Detecting changes between two files:

```java
localhost:3000/compareFiles
```
Body:

```java
{
    "older" : "./repos/older/project/file.js",
    "newer" : "./repos/newer/project/file.js"
}
```

####  Detecting changes in version histories:
```java
localhost:3000/compareAllVersions
```
Body:

```java
{
   "repoURL": "https://github.com/owner/project"
}
```
