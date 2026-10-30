'use strict';

// Temporary test-only probe. No credentials or database rows are returned.
const { SupabaseFarmRepository } = require('../farm-service');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ready: false });
  try {
    await new SupabaseFarmRepository().get('0x' + '0'.repeat(40));
    return res.status(200).json({ ready: true });
  } catch (_) {
    return res.status(503).json({ ready: false });
  }
};
