import { addService, db } from './firebase.js';
import fs from 'fs';
import path from 'path';

async function migrate() {
  try {
    console.log('--- Migration Script Started ---');
    console.log('1. Reading services data from file...');
    const dataPath = path.join(process.cwd(), 'src/utils/servicesData.js');
    const servicesData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`   Found ${servicesData.length} services to migrate.`);

    console.log('\n2. Firebase configuration:');
    console.log(`   Project ID: ${db.app.options.projectId}`);

    console.log('\n3. Starting migration of each service...');
    for (const service of servicesData) {
      const { id, name, description, price, notes } = service;
      const serviceData = {
          codigo: id,
          nome: name,
          descricao: description,
          preco: price,
          observacoes: notes
      };
      try {
        process.stdout.write(`   - Migrating service '${name}'... `);
        await addService(serviceData);
        process.stdout.write('OK\n');
      } catch (error) {
        process.stdout.write('FAIL\n');
        console.error(`     Error migrating service '${name}':`, error.message);
      }
    }
    console.log('\n--- Migration Script Finished ---');
  } catch (error) {
    console.error('\n--- An unexpected error occurred during migration ---');
    console.error(error);
  }
}

migrate();
