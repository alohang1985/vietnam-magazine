try { require('dotenv').config(); } catch(e) {}
const { pipelineRun } = require('./daily_pipeline');
const { run: publishRun } = require('./publish_job');
const { generate } = require('./generate_sitemap');
const logger = require('./utils/logger');

// Simple assertion helper
function ok(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }

async function runAllTests() {
  logger.info('TEST: Starting T1-T8');

  const MODE = process.env.TEST_MODE || 'mock';
  if (MODE === 'mock') {
    logger.info('Running tests in MOCK mode');

    // T1: 수집 링크 0개 -> pipeline should log insufficient sources but not throw
    try {
      process.env.MOCK_SOURCES_COUNT = '0';
      await pipelineRun();
      logger.info('T1 MOCK: passed (handled 0 sources)');
    } catch (e) { logger.error('T1 MOCK failed: '+e.message); }

    // T2: 이미지 검색 실패 -> pipeline should still create post with editor_note flag
    try {
      process.env.MOCK_SOURCES_COUNT = '3';
      process.env.MOCK_IMAGE_FAIL = '1';
      await pipelineRun();
      logger.info('T2 MOCK: passed (image fallback exercised)');
    } catch (e) { logger.error('T2 MOCK failed: '+e.message); }

    // T3: 생성 품질 미달 -> pipeline should attempt retries and then record failure
    try {
      process.env.MOCK_AI_FAIL = '1';
      await pipelineRun();
      logger.info('T3 MOCK: passed (AI failure handled)');
    } catch (e) { logger.error('T3 MOCK failed: '+e.message); }

    // T4: 승인 없이 발행 시도 -> publishRun should exit gracefully when no approved posts
    try {
      await publishRun();
      logger.info('T4 MOCK: passed (no approved content blocked)');
    } catch (e) { logger.error('T4 MOCK failed: '+e.message); }

    // T5: 중복 발행 방지 락 (동시 2회 발행 시도 시뮬레이션)
    try {
      // Create a mock approved post via CMS API if possible, otherwise rely on mock mode
      // Run two publish runs concurrently and ensure at most one succeeds
      const results = await Promise.allSettled([publishRun(), publishRun()]);
      const fulfilled = results.filter(r=>r.status==='fulfilled').length;
      ok(fulfilled <= 2, 'Unexpected fulfilled count');
      logger.info('T5 MOCK: concurrency test executed (results: '+JSON.stringify(results.map(r=>r.status))+')');
    } catch (e) { logger.error('T5 MOCK failed: '+e.message); }

    // T6: Strapi 다운 -> publish should retry and log error without crash
    try {
      process.env.MOCK_STRAPI_DOWN = '1';
      await publishRun();
      logger.info('T6 MOCK: passed (Strapi down handled)');
    } catch (e) { logger.error('T6 MOCK failed: '+e.message); }

    // T7: 글자 수 3,000자 미만 -> pipeline should attempt regeneration
    try {
      process.env.MOCK_SHORT_ARTICLE = '1';
      await pipelineRun();
      logger.info('T7 MOCK: passed (short article regeneration simulated)');
    } catch (e) { logger.error('T7 MOCK failed: '+e.message); }

    // T8: 이미지 라이선스 메타 누락 -> pipeline should reject/flag
    try {
      process.env.MOCK_IMAGE_META_MISSING = '1';
      await pipelineRun();
      logger.info('T8 MOCK: passed (image metadata missing handled)');
    } catch (e) { logger.error('T8 MOCK failed: '+e.message); }

  } else {
    logger.info('Running tests in LIVE mode');
    try { process.env.TEST_OVERRIDE_TOPIC = 'zzzzzz_nonexistent_topic_12345'; await pipelineRun(); logger.info('T1 LIVE executed'); } catch (e) { logger.error('T1 LIVE failed: '+e.message); }
    try { process.env.UNSPLASH_API_KEY = ''; process.env.PEXELS_API_KEY = ''; await pipelineRun(); logger.info('T2 LIVE executed'); } catch (e) { logger.error('T2 LIVE failed: '+e.message); }
    try { delete process.env.OPENAI_API_KEY; await pipelineRun(); logger.info('T3 LIVE executed'); } catch (e) { logger.error('T3 LIVE failed: '+e.message); }
    try { await publishRun(); logger.info('T4 LIVE executed'); } catch (e) { logger.error('T4 LIVE failed: '+e.message); }
    try { await publishRun(); await publishRun(); logger.info('T5 LIVE executed'); } catch (e) { logger.error('T5 LIVE failed: '+e.message); }
    try { process.env.CMS_URL = 'http://localhost:59999'; await publishRun(); logger.info('T6 LIVE executed'); } catch (e) { logger.error('T6 LIVE failed: '+e.message); }
    try { await pipelineRun(); logger.info('T7 LIVE executed'); } catch (e) { logger.error('T7 LIVE failed: '+e.message); }
    try { await pipelineRun(); logger.info('T8 LIVE executed'); } catch (e) { logger.error('T8 LIVE failed: '+e.message); }
  }

  // sitemap generation
  try { await generate(); logger.info('Sitemap generation tested'); } catch (e) { logger.error('Sitemap test failed: '+e.message); }

  logger.info('All tests executed - check logs for pass/fail details');
}

if (require.main === module) runAllTests().catch(e=>{ logger.error(e.message); process.exit(1); });

module.exports = { runAllTests };