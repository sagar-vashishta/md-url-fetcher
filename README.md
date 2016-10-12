[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/sagar-vashishta/md-url-fetcher)

# md-url-fetcher

- Scalable job worker which fetches contents of a given URL.
- Built using Angular, Boostrap, Node, Express, Kue, Redis, Mongo.

# demo

- View the [live demo](http://md-url-fetcher.herokuapp.com/) or deploy using Heroku.

# api

| Endpoint          | Description        |
| ------------------|:-------------------|
| ``/jobs/get``     | gets all jobs      |
| ``/jobs/get/:id`` | get one job by id  |
| ``/jobs/post``    | create new job     |

# local development

```
npm install
mongod
redis-server
npm start
```

# run tests
``npm test``
