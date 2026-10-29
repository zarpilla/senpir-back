'use strict';

/**
 * Keeps the Strapi 4 REST response shape (data.attributes.*, numeric id)
 * for the front and the offline caches of the PWA, without changing the front:
 * Strapi 5 returns that shape when the request has `Strapi-Response-Format: v4`.
 *
 * One difference remains in that mode: an empty multiple-media field is
 * `{ data: [] }` in Strapi 5 but was `{ data: null }` in Strapi 4, and the front
 * treats any array as "has images". We restore `null` for those fields.
 */

let multipleMediaFields = null;

function getMultipleMediaFields(strapi) {
  if (!multipleMediaFields) {
    multipleMediaFields = new Set();
    const schemas = [...Object.values(strapi.contentTypes), ...Object.values(strapi.components)];
    for (const schema of schemas) {
      for (const [name, attr] of Object.entries(schema.attributes || {})) {
        if (attr.type === 'media' && attr.multiple) multipleMediaFields.add(name);
      }
    }
  }
  return multipleMediaFields;
}

function restoreNullMedia(value, fields) {
  if (Array.isArray(value)) {
    value.forEach((v) => restoreNullMedia(v, fields));
  } else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      if (fields.has(key) && v && Array.isArray(v.data) && v.data.length === 0) {
        value[key] = { data: null };
      } else {
        restoreNullMedia(v, fields);
      }
    }
  }
}

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const isApi = ctx.path.startsWith('/api/');
    if (isApi && !ctx.request.headers['strapi-response-format']) {
      ctx.request.headers['strapi-response-format'] = 'v4';
    }
    await next();
    if (isApi && ctx.request.headers['strapi-response-format'] === 'v4' && ctx.body && ctx.body.data) {
      restoreNullMedia(ctx.body.data, getMultipleMediaFields(strapi));
    }
  };
};
