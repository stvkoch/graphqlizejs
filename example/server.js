import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import cors from "cors";
import hasha from "hasha";
import prettier from "prettier";

import { generateSchema } from "./schema";
import { generateResolvers } from "./resolvers";
import { generateFakes } from "./fakes";
import db from "./models";

const schema = prettier.format(
  generateSchema(db, {
    type: [],
    query: []
    // mutation: ["singleUpload(file: Upload!): File!"]
  }),
  { parser: "graphql" }
);

const resolvers = generateResolvers(db, db => ({
  mutation: {
    //   // https://blog.apollographql.com/file-uploads-with-apollo-server-2-0-5db2f3f60675
    //   async singleUpload(parent, { file }) {
    //     const { stream, filename, mimetype, encoding } = await file;
    //     const hashcode = await hasha.fromStream(stream, { algorithm: "md5" });
    //     // 1. Validate file metadata.
    //     const existFile = await db.models.file.findOne({
    //       where: { hashcode }
    //     });
    //     if (existFile) return existFile;
    //     // 2. Stream file contents into cloud storage:
    //     // https://nodejs.org/api/stream.html
    //     const url = faker.image.cats();
    //     // 3. Record the file upload in your DB.
    //     // const id = await recordFile( … )
    //     const row = await db.models.file.create({
    //       url,
    //       filename,
    //       mimetype,
    //       encoding
    //     });
    //     return row;
    //   }
  }
}));

const port = process.env.PORT || 5000;

console.log(schema);

const server = new ApolloServer({
  typeDefs: gql(schema),
  resolvers,
  context: { db },
  introspection: true,
  playground: true
});

const app = express();
app.use(cors());

server.applyMiddleware({ app });

app.use(express.static("app/public"));

app.get("/schema", (_, res) => res.send(schema));

db.sequelize.drop().then(() => {
  db.sequelize.sync().then(() => {
    generateFakes(db);
    app.listen({ port }, () =>
      console.log(
        `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
      )
    );
  });
});
