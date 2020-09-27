import { GraphQLServer } from 'graphql-yoga'
import uuidv4 from 'uuid/v4'

// Scalar types - String, Boolean, Int, Float, ID

// Demo user data
const users = [
  {
    id: '1',
    name: 'Andrew',
    email: 'andrew@example.com',
    age: 27
  },
  {
    id: '2',
    name: 'Sarah',
    email: 'sarah@example.com'
  },
  {
    id: '3',
    name: 'Mike',
    email: 'mike@example.com'
  }
]

const posts = [
  {
    id: '10',
    title: 'GraphQL 101',
    body: 'This is how to use GraphQL...',
    published: true,
    author: '1'
  },
  {
    id: '11',
    title: 'GraphQL 201',
    body: 'This is an advanced GraphQL post...',
    published: false,
    author: '1'
  },
  {
    id: '12',
    title: 'Programming Music',
    body: '',
    published: false,
    author: '2'
  }
]

const commentsList = [
  { id: '1', text: 'comment1', author: '1', post: '10' },
  { id: '2', text: 'comment2', author: '2', post: '10' },
  { id: '3', text: 'comment3', author: '3', post: '11' },
  { id: '4', text: 'comment4', author: '1', post: '12' }
]

// Type definitions (schema)
const typeDefs = `
    type Query {
        users(query: String): [User!]!
        posts(query: String): [Post!]!
        me: User!
        post: Post!
        comment: [Comment!]!
    }
     
    type Mutation {
        createUser(name: String!, email: String!, age: Int): User!
        createPost(title: String!, body: String!, published: Boolean!, author: ID!): Post!
        createComment(text: String!, author: String!, post: ID!): Comment!
      
    }

    type User {
        id: ID!
        name: String!
        email: String!
        age: Int
        posts: [Post!]!
        comment: [Comment!]!
    }

    type Post {
        id: ID!
        title: String!
        body: String!
        published: Boolean!
        author: User!
        comment: [Comment!]!
    }

    type Comment {
      id: ID!
      text: String!
      author: User!
      post: Post!
    }

 
`

// Resolvers
const resolvers = {
  Query: {
    users(parent, args, ctx, info) {
      if (!args.query) {
        return users
      }

      return users.filter((user) => {
        return user.name.toLowerCase().includes(args.query.toLowerCase())
      })
    },
    posts(parent, args, ctx, info) {
      if (!args.query) {
        return posts
      }

      return posts.filter((post) => {
        const isTitleMatch = post.title.toLowerCase().includes(args.query.toLowerCase())
        const isBodyMatch = post.body.toLowerCase().includes(args.query.toLowerCase())
        return isTitleMatch || isBodyMatch
      })
    },
    me() {
      return {
        id: '123098',
        name: 'Mike',
        email: 'mike@example.com'
      }
    },
    post() {
      return {
        id: '092',
        title: 'GraphQL 101',
        body: '',
        published: false
      }
    },
    comment(parent, args, ctx, info) {
      console.log('sending comment')
      return commentsList
    }
  },
  Post: {
    author(parent, args, ctx, info) {
      return users.find((user) => {
        return user.id === parent.author
      })
    },
    comment(parent, args, ctx, info) {
      return commentsList.filter((comment) => {
        return comment.post === parent.id
      })
    }
  },
  User: {
    posts(parent, args, ctx, info) {
      console.log(parent)
      return posts.filter((post) => {
        return post.id === parent.author
      })
    },
    comment(parent, args, ctx, info) {
      return commentsList.filter((comment) => {
        return comment.author === parent.id
      })
    }
  },
  Comment: {
    author(parent, args, ctx, info) {
      console.log('parent is', parent)
      return users.find((user) => {
        return user.id === parent.author
      })
    },
    post(parent, args, ctx, info) {
      return posts.find((post) => {
        return post.id === parent.post
      })
    }
  },
  Mutation: {
    createUser(parent, args, ctx, info) {
      console.log(args)

      const emailTaken = users.some((user) => user.email === args.email)
      if (emailTaken) {
        throw new Error('Email taken already')
      }
      const user = {
        id: uuidv4(),
        email: args.email,
        name: args.name,
        age: args.age
      }
      users.push(user)
      return user
    },
    createPost(parent, args, ctx, info) {
      console.log(args)

      const userExists = users.some((user) => user.id === args.author)
      if (!userExists) {
        throw new Error('User not found')
      }
      const post = {
        id: uuidv4(),
        ...args
      }
      posts.push(post)
      return post
    },
    createComment(parent, args, ctx, info) {
      console.log(args)

      const userExists = users.some((user) => user.id === args.author)
      if (!userExists) {
        throw new Error('User not found')
      }
      const postExists = posts.some((post) => post.id === args.post && post.published)
      if (!postExists) {
        throw new Error('Post not found')
      }
      const comment = {
        id: uuidv4(),
        ...args
      }
      commentsList.push(comment)
      return comment
    }
  }
}

const server = new GraphQLServer({
  typeDefs,
  resolvers
})

server.start(() => {
  console.log('The server is up!')
})
