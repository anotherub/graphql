import uuidv4 from 'uuid/v4'

const Mutation = {
  createUser(parent, args, { db }, info) {
    const emailTaken = db.users.some((user) => user.email === args.data.email)

    if (emailTaken) {
      throw new Error('Email taken')
    }

    const user = {
      id: uuidv4(),
      ...args.data
    }

    db.users.push(user)

    return user
  },
  deleteUser(parent, args, { db }, info) {
    const userIndex = db.users.findIndex((user) => user.id === args.id)

    if (userIndex === -1) {
      throw new Error('User not found')
    }

    const deletedUsers = db.users.splice(userIndex, 1)

    db.posts = db.posts.filter((post) => {
      const match = post.author === args.id

      if (match) {
        db.comments = db.comments.filter((comment) => comment.post !== post.id)
      }

      return !match
    })
    db.comments = db.comments.filter((comment) => comment.author !== args.id)

    return deletedUsers[0]
  },
  updateUser(parent, args, { db }, info) {
    const user = db.users.find((user) => user.id === args.id)
    const { data } = args

    if (!user) {
      throw new Error('User not found')
    }

    if (typeof args.data.email === 'string') {
      const emailToken = db.users.some((user) => {
        return user.email === args.data.email
      })
      if (emailToken) throw new Error('Email already taken')
      user.email = data.email
    }
    if (typeof data.name === 'string') {
      user.name = data.name
    }
    if (typeof data.age !== 'undefined') {
      user.age = data.age
    }
    return user
  },
  createPost(parent, args, { db, pubsub }, info) {
    const userExists = db.users.some((user) => user.id === args.data.author)

    if (!userExists) {
      throw new Error('User not found')
    }

    const post = {
      id: uuidv4(),
      ...args.data
    }

    db.posts.push(post)
    if (post.published) {
      pubsub.publish('post', {
        post: {
          mutation: 'CREATED',
          data: post
        }
      })
    }

    return post
  },
  deletePost(parent, args, { db, pubsub }, info) {
    const postIndex = db.posts.findIndex((post) => post.id === args.id)

    if (postIndex === -1) {
      throw new Error('Post not found')
    }

    const deletedPosts = db.posts.splice(postIndex, 1)

    db.comments = db.comments.filter((comment) => comment.post !== args.id)
    if (deletedPosts[0].published)
      pubsub.publish('post', {
        post: {
          mutation: 'DELETED',
          data: deletedPosts[0]
        }
      })

    return deletedPosts[0]
  },
  updatePost(parent, args, { db, pubsub }, info) {
    const post = db.posts.find((post) => post.id === args.id)
    const originalPost = { ...post }

    if (!post) {
      throw new Error('Post not found')
    }

    const { data, id } = args
    if (typeof data.body === 'string') {
      post.body = data.body
    }
    if (typeof data.title === 'string') {
      post.title = data.title
    }
    if (typeof data.published === 'boolean') {
      post.published = data.published
      if (originalPost.published && !post.published) {
        pubsub.publish('post', {
          post: {
            mutation: 'DELETED',
            data: originalPost
          }
        })
      } else if (!originalPost.published && post.published) {
        pubsub.publish('post', {
          post: {
            mutation: 'CREATED',
            data: post
          }
        })
      }
    } else if (post.published) {
      pubsub.publish('post', {
        post: {
          mutation: 'UPDATED',
          data: post
        }
      })
    }
    return post
  },
  createComment(parent, args, { db, pubsub }, info) {
    const userExists = db.users.some((user) => user.id === args.data.author)
    const postExists = db.posts.some((post) => post.id === args.data.post && post.published)

    if (!userExists || !postExists) {
      throw new Error('Unable to find user and post')
    }

    const comment = {
      id: uuidv4(),
      ...args.data
    }

    db.comments.push(comment)
    pubsub.publish(`comment ${args.data.post}`, {
      comment: {
        mutation: 'CREATED',
        data: comment
      }
    })
    return comment
  },
  deleteComment(parent, args, { db, pubsub }, info) {
    const commentIndex = db.comments.findIndex((comment) => comment.id === args.id)

    if (commentIndex === -1) {
      throw new Error('Comment not found')
    }
    console.log(args)
    const deletedComments = db.comments.splice(commentIndex, 1)
    pubsub.publish(`comment ${deletedComments[0].post}`, {
      comment: {
        mutation: 'DELETED',
        data: deletedComments[0]
      }
    })

    return deletedComments[0]
  },
  updateComment(parent, args, { db, pubsub }, info) {
    const comment = db.comments.find((comment) => comment.id === args.id)

    if (!comment) {
      throw new Error('Comment not found')
    }
    const { id, data } = args
    if (typeof data.text === 'string') {
      comment.text = data.text
    }
    pubsub.publish(`comment ${comment.post}`, {
      comment: {
        mutation: 'UPDATED',
        data: comment
      }
    })
    return comment
  }
}
export { Mutation as default }
