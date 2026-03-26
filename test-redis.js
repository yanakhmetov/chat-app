const Redis = require('ioredis');

const redis = new Redis('redis://localhost:6379');

async function test() {
  try {
    await redis.set('test', 'Hello Redis!');
    const value = await redis.get('test');
    console.log('Redis test:', value);
    console.log('✅ Redis is working!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis error:', error.message);
    process.exit(1);
  }
}

test();