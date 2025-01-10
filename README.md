![Build & Deploy](https://github.com/acdh-oeaw/nestify-base-app/actions/workflows/build.yml/badge.svg)

# nestify-base-app 

is a [nestjs](https://nestjs.com/) based app template spinning up a JSON-Schema driven  REST-Interface using 
[express-restify-mongoose](https://florianholzapfel.github.io/express-restify-mongoose/) and equiping it with user- and 
authentication management as well as some endpoints for asset upload and management. 



## Setup (using the provided docker-compose)
The Repo comes with a ready to launch compose file - you only need to set up your environment variables.
```bash
# setup your envirmonment variables
cp dev.env.template dev.env
```

If you're running your own Mongodb-Instance just fill in the connection details, run like so
```bash
docker compose --env-file ./dev.env run nestify-base-app
```

To set up a database with docker-compose:
```bash
# run the mongodb container specified in the compose file
docker-compose --env-file ./dev.env run nestify-mongodb
# enter the mongodb container and set up your database and user
docker exec -it <containerID> sh
mongosh --username <MONGO_ROOT_USER> --password <MONGO_ROOT_PASSWORD>
use <DATABASE_NAME>
db.createUser({user: "<DATABASE_USER>", pwd: "<DATABASE_PASSWORD>",  roles: ["readWrite"]})
```
then shutdown the db with <kbd>Ctrl</kbd>+<kbd>C</kbd> and run the app like so
```bash
docker compose --env-file ./dev.env up
```

## Schema Definitions

The schema definitions are expected as `json` files in the folder provided via the `SCHEMAS_DIR` env variable. They 
are converted to mongoose schemas using [mongoose-schema-jsonschema](https://github.com/DScheglov/mongoose-schema-jsonschema#readme)
and need to be formatted accordingly.
