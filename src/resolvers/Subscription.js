const Subscription = {
  comment: {
    subscribe(parents, { postId }, ctx, info) {
      const { pubsub, db } = ctx
      const post = db.posts.find((post) => {
        return post.id === postId && post.published
      })
      if (!post) throw new Error('no such post found')

      return pubsub.asyncIterator(`comment ${postId}`)
    }
  },
  post: {
    subscribe(parents, {}, ctx, info) {
      const { pubsub, db } = ctx

      return pubsub.asyncIterator(`post`)
    }
  }
}

export { Subscription as default }
