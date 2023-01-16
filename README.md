![Build](https://github.com/ctot-nondef/nestify-base-app/actions/workflows/build.yml/badge.svg)

# nestify-base-app 

is a [nestjs](https://nestjs.com/) based app template spinning up a JSON-Schema driven  REST-Interface using 
[express-restify-mongoose](https://florianholzapfel.github.io/express-restify-mongoose/) and equiping it with user- and 
authentication management as well as some endpoints for asset upload and management. 



## Setup for local Development
The Repo comes with a ready to launch compose file - you only need to set up your environment variables.
```bash
# setup your envirmonment variables
cp dev.env.template dev.env
# run the compose file
docker-compose --env-file ./dev.env up
```



```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

  Nest is [MIT licensed](LICENSE).
