import express from "express";
import { ApolloServer, gql, PubSub } from "apollo-server-express";
import fs from "fs";
import https from "https";
import http from "http";
import hasha from "hasha";
import prettier from "prettier";
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

const configurations = {
  production: {
    ssl: false,
    port: process.env.PORT || 443,
    hostname: "graphqlize.herokuapp.com"
  },
  development: { ssl: false, port: 4000, hostname: "localhost" }
};

const environment = process.env.NODE_ENV || "development";
const config = configurations[environment];

const apollo = new ApolloServer({
  typeDefs: gql(schemaGenerated),
  resolvers: resolversGenerated
});

const app = express();
apollo.applyMiddleware({ app });
app.get("/", (_, res) =>
  res.send(
    `<div><a href="/graphql">Graphqli</a></div><pre>${schemaGenerated}</pre>`
  )
);

let server;
if (config.ssl) {
  // Assumes certificates are in .ssl folder from package root. Make sure the files
  // are secured.
  server = https.createServer(
    {
      key: fs.readFileSync(`./ssl/${environment}/server.key`),
      cert: fs.readFileSync(`./ssl/${environment}/server.crt`)
    },
    app
  );
} else {
  server = http.createServer(app);
}

// Add subscription support
apollo.installSubscriptionHandlers(server);

db.sequelize.drop().then(() => {
  db.sequelize.sync().then(() => {
    generateFakes(db);
    server.listen({ port: config.port }, () =>
      console.log(
        "🚀 Server ready at",
        `http${config.ssl ? "s" : ""}://${config.hostname}:${config.port}${
          apollo.graphqlPath
        }`
      )
    );
  });
});
