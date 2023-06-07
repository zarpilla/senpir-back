'use strict';

/**
 * play service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::play.play');
