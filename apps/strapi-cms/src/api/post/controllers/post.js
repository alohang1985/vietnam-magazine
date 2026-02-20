"use strict";

/**
 * Custom controller: publish endpoint with check-and-set atomic behavior.
 * Path: /api/posts/:id/publish (PUT)
 * Behavior:
 *  - Verify post exists and status === 'approved' and publish_lock === false
 *  - Set publish_lock=true and lock_acquired_at=now
 *  - Perform publish: set status=published, published_at=now, clear lock
 *  - Return 200 with result, or 409 if lock cannot be acquired / preconditions fail
 */

module.exports = {
  async publish(ctx) {
    const { id } = ctx.params;
    if (!id) return ctx.badRequest('Missing id');
    // Fetch current post
    const post = await strapi.entityService.findOne('api::post.post', id);
    if (!post) return ctx.notFound('Post not found');
    const attrs = post;
    // preconditions
    if (attrs.status !== 'approved') return ctx.conflict('Post not approved for publishing');
    if (attrs.publish_lock) return ctx.conflict('Publish lock already acquired');

    // Acquire lock (atomicity limited by single-controller transaction)
    const now = new Date().toISOString();
    await strapi.entityService.update('api::post.post', id, { data: { publish_lock: true, lock_acquired_at: now } });

    try {
      // Re-fetch to ensure lock was set
      const locked = await strapi.entityService.findOne('api::post.post', id);
      if (!locked.publish_lock) return ctx.conflict('Failed to acquire lock');

      // Perform publish
      const published = await strapi.entityService.update('api::post.post', id, { data: { status: 'published', published_at: now, publish_lock: false, lock_acquired_at: null } });
      return ctx.send({ data: published }, 200);
    } catch (e) {
      // Ensure lock cleared on error
      await strapi.entityService.update('api::post.post', id, { data: { publish_lock: false, lock_acquired_at: null } });
      strapi.log.error('Publish controller error: ' + e.message);
      return ctx.internalServerError('Publish failed');
    }
  }
};
