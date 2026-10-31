const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Use reliable Google/Cloudflare DNS for SRV queries on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const SOURCE_URI = "mongodb://Trishal:Ele%2FSq9%3FuA.d3Z%236%21yR@cluster0-shard-00-00.ssmpl.mongodb.net:27017,cluster0-shard-00-01.ssmpl.mongodb.net:27017,cluster0-shard-00-02.ssmpl.mongodb.net:27017/trishal_nazrul_academy?ssl=true&replicaSet=atlas-islggq-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
const TARGET_BASE_URI = process.argv[2] || "mongodb+srv://nazrulacademydarirampur_db_user:Oz6qwVoRykAFZbCM@cluster0.akxgzdd.mongodb.net/";
const DB_NAME = "trishal_nazrul_academy";

// Format target URI with DB name
let targetUri = TARGET_BASE_URI.trim();
if (!targetUri.includes(DB_NAME)) {
  if (targetUri.endsWith('/')) {
    targetUri = `${targetUri}${DB_NAME}?retryWrites=true&w=majority`;
  } else if (targetUri.includes('?')) {
    targetUri = targetUri.replace('?', `/${DB_NAME}?`);
  } else {
    targetUri = `${targetUri}/${DB_NAME}?retryWrites=true&w=majority`;
  }
}

async function migrate() {
  console.log('====================================================');
  console.log('🚀 MONGODB DATABASE MIGRATION STARTING');
  console.log(`Source Database: ${DB_NAME}`);
  console.log(`Target URI: ${targetUri.replace(/:([^:@]+)@/, ':****@')}`);
  console.log('====================================================\n');

  let sourceClient;
  let targetClient;

  try {
    console.log('🔌 Connecting to Source MongoDB...');
    sourceClient = new MongoClient(SOURCE_URI);
    await sourceClient.connect();
    console.log('✅ Connected to Source MongoDB successfully.');

    console.log('🔌 Connecting to Target MongoDB (Client Cluster)...');
    targetClient = new MongoClient(targetUri);
    await targetClient.connect();
    console.log('✅ Connected to Target MongoDB successfully.\n');

    const sourceDb = sourceClient.db(DB_NAME);
    const targetDb = targetClient.db(DB_NAME);

    // List all collections in source
    const collections = await sourceDb.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections to transfer:\n`);

    const summaryReport = [];

    for (const colInfo of collections) {
      const colName = colInfo.name;
      
      // Skip system collections if any
      if (colName.startsWith('system.')) continue;

      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      const sourceCount = await sourceCol.countDocuments();

      if (sourceCount === 0) {
        // Just create the collection if empty
        await targetDb.createCollection(colName).catch(() => {});
        summaryReport.push({ collection: colName, sourceCount: 0, targetCount: 0, status: 'EMPTY_COLLECTION_COPIED' });
        console.log(`⚪ [${colName}] is empty (0 docs). Created empty collection.`);
        continue;
      }

      console.log(`⏳ Migrating [${colName}]: ${sourceCount} documents...`);

      // 1. Copy Indexes (excluding _id_)
      try {
        const indexes = await sourceCol.indexes();
        const nonIdIndexes = indexes.filter(idx => idx.name !== '_id_');
        for (const idx of nonIdIndexes) {
          const indexOptions = { ...idx };
          delete indexOptions.key;
          delete indexOptions.v;
          delete indexOptions.ns;
          await targetCol.createIndex(idx.key, indexOptions).catch(err => {
            console.warn(`   ⚠️ Index warning on ${colName}.${idx.name}:`, err.message);
          });
        }
      } catch (idxErr) {
        console.warn(`   ⚠️ Could not read/create indexes for ${colName}:`, idxErr.message);
      }

      // 2. Fetch and Insert Documents in Batches
      const batchSize = 500;
      let transferredCount = 0;
      const cursor = sourceCol.find({});

      let batch = [];
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        batch.push(doc);

        if (batch.length >= batchSize) {
          await targetCol.insertMany(batch, { ordered: false }).catch(err => {
            // If already exists or duplicate key, handle silently
            if (!err.message.includes('E11000')) console.error(`Error inserting batch in ${colName}:`, err.message);
          });
          transferredCount += batch.length;
          batch = [];
        }
      }

      if (batch.length > 0) {
        await targetCol.insertMany(batch, { ordered: false }).catch(err => {
          if (!err.message.includes('E11000')) console.error(`Error inserting batch in ${colName}:`, err.message);
        });
        transferredCount += batch.length;
        batch = [];
      }

      // 3. Verification
      const targetCount = await targetCol.countDocuments();
      const isMatch = (sourceCount === targetCount);

      summaryReport.push({
        collection: colName,
        sourceCount,
        targetCount,
        status: isMatch ? '✅ MATCHED 100%' : '⚠️ COUNT_MISMATCH'
      });

      console.log(`   ${isMatch ? '✅' : '⚠️'} [${colName}] Source: ${sourceCount} | Target: ${targetCount}`);
    }

    console.log('\n====================================================');
    console.log('📊 FINAL VERIFICATION REPORT (100% DATA AUDIT)');
    console.log('====================================================');
    console.table(summaryReport);

    const allMatched = summaryReport.every(r => r.sourceCount === r.targetCount);

    if (allMatched) {
      console.log('\n🎉 ALL COLLECTIONS & DOCUMENTS TRANSFERRED WITH 100% ACCURACY!');
      console.log('Target Database URI:');
      console.log(targetUri);
    } else {
      console.warn('\n⚠️ SOME COLLECTIONS HAD MISMATCHES, PLEASE REVIEW THE TABLE ABOVE.');
    }

  } catch (err) {
    console.error('❌ MIGRATION FAILED:', err);
    process.exit(1);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
  }
}

migrate();
