'use strict';
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::post.post', ({ strapi }) => ({
  async publish(ctx) {
    const { id } = ctx.params;
    if (!id) return ctx.badRequest('Missing id');

    const post = await strapi.entityService.findOne('api::post.post', id);
    if (!post) return ctx.notFound('Post not found');

    if (post.status !== 'approved') return ctx.conflict('Post not approved for publishing');
    if (post.publish_lock) return ctx.conflict('Publish lock already acquired');

    const now = new Date().toISOString();
    await strapi.entityService.update('api::post.post', id, { data: { publish_lock: true, lock_acquired_at: now } });

    try {
      const locked = await strapi.entityService.findOne('api::post.post', id);
      if (!locked.publish_lock) return ctx.conflict('Failed to acquire lock');

      const published = await strapi.entityService.update('api::post.post', id, { data: { status: 'published', published_at: now, publish_lock: false, lock_acquired_at: null } });
      return ctx.send({ data: published }, 200);
    } catch (e) {
      await strapi.entityService.update('api::post.post', id, { data: { publish_lock: false, lock_acquired_at: null } });
      strapi.log.error('Publish controller error: ' + e.message);
      return ctx.internalServerError('Publish failed');
    }
  }
}));
