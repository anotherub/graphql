import { GraphQLServer, PubSub } from 'graphql-yoga'
import db from './db'
import Query from './resolvers/Query'
import Mutation from './resolvers/Mutation'
import User from './resolvers/User'
import Comment from './resolvers/Comment'
import Post from './resolvers/Post'
import Subscription from './resolvers/Subscription'

const pubsub = new PubSub()

const resolvers = {
  Query,
  Mutation,
  Post,
  Comment,
  User,
  Subscription
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: {
    db,
    pubsub
  }
})

server.start(() => {
  console.log('The server is up!')
})
