import express from "express";
import { ApolloServer, gql, PubSub } from "apollo-server-express";
import cors from "cors";
import http from "http";

// import hasha from "hasha";
import prettier from "prettier";

var env = process.env.NODE_ENV || "development";
var config = require(__dirname + "/config/config.json")[env];
import { schema, resolvers } from "../";
import { generateFakes } from "./fakes";
import db from "./models";

const pubsub = new PubSub();
const extend = "";
// `
// extend type Mutation{
//   singleUpload(file: Upload!): File!
// }
//`;

const schemaGenerated = prettier.format(schema(db.sequelize, extend), {
  parser: "graphql"
});

const resolversGenerated = resolvers(db.sequelize, pubsub, sequelize => ({
  mutation: {
    // // https://blog.apollographql.com/file-uploads-with-apollo-server-2-0-5db2f3f60675
    // async singleUpload(parent, { file }) {
    //   const { stream, filename, mimetype, encoding } = await file;
    //   const hashcode = await hasha.fromStream(stream, { algorithm: "md5" });
    //   // 1. Validate file metadata.
    //   const existFile = await db.models.file.findOne({
    //     where: { hashcode }
    //   });
    //   if (existFile) return existFile;
    //   // 2. Stream file contents into cloud storage:
    //   // https://nodejs.org/api/stream.html
    //   const url = faker.image.cats();
    //   // 3. Record the file upload in your DB.
    //   // const id = await recordFile( … )
    //   const row = await db.models.file.create({
    //     url,
    //     filename,
    //     mimetype,
    //     encoding
    //   });
    //   return row;
    // }
  }
}));

const port = config.port;
const wsPort = config.wsport;

const server = new ApolloServer({
  typeDefs: gql(schemaGenerated),
  resolvers: resolversGenerated,
  subscriptions: {
    onConnect: (connectionParams, webSocket, context) => {
      console.log("subscription connected");
    },
    onDisconnect: (webSocket, context) => {
      console.log("subscription disconnected");
    }
  },
  context: { db },
  introspection: true,
  playground: {
    subscriptionEndpoint:
      process.env.SUBSCRIPTION_ENDPOINT || config.subscriptionEndpoint
  }
});

const app = express();
app.use(cors());

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);
server.applyMiddleware({ app });

httpServer.listen(wsPort, () => {
  console.log(`Websocket listening on port ${wsPort}`);
});

// app.use(express.static("app/public"));
app.get("/schema", (_, res) => res.send("<pre>" + schemaGenerated + "</pre>"));
db.sequelize.drop().then(() => {
  db.sequelize.sync().then(() => {
    generateFakes(db);
    app.listen({ port }, err => {
      console.error(err);
      console.log(
        `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
      );
    });
  });
});
