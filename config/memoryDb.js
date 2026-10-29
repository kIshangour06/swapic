const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

async function startMemoryMongo() {
  mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'barterdb'
    }
  });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  console.log('🗄️  In-memory MongoDB started at:', uri);
  return uri;
}

async function stopMemoryMongo() {
  if (mongod) await mongod.stop();
}

module.exports = { startMemoryMongo, stopMemoryMongo };
