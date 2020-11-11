# mytypeorm
A CLI to generate typeorm migrations from an exist mysql database

## Installation

```
npm install -g git+https://github.com/salesplay/mytypeorm.git
```

## Usage

To generate migrations of all tables.

```
mytypeorm all --host 127.0.0.1 --port 3306 --username root --password \
my_password --output-directory ./migrations
```

To generate a migration of a specific table.

```
mytypeorm child --host 127.0.0.1 --port 3306 --username root --password \
my_password --output-directory ./migrations --child-name "table_name"
```

# Features

- [x] Unique Indexes
- [x] Primary Indexes
- [x] Enums

# To Do
- [ ] Foreign keys


## Contributions

All PRs and issues are welcome.

## Feature Requests

This tool is made for a specific use case. So this tool has
limited features. Do not hesitate to open an issue if you want
a new feature request. We will implement your
feature ASAP.
