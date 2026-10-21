const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');
const os = require('os');
const bcrypt = require('bcryptjs');

// Determine persistent data path (Windows AppData, Mac Library, or local fallback)
function getDataDirectory() {
  let basePath;
  if (process.env.APPDATA) {
    basePath = path.join(process.env.APPDATA, 'billing-software', 'data');
  } else if (process.platform === 'darwin') {
    basePath = path.join(os.homedir(), 'Library', 'Application Support', 'billing-software', 'data');
  } else {
    basePath = path.join(os.homedir(), '.billing-software', 'data');
  }

  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  return basePath;
}

const DATA_DIR = getDataDirectory();
console.log(`[Offline DB] Local data storage directory: ${DATA_DIR}`);

// Initialize NeDB Datastores
const stores = {};

function getStore(name) {
  if (!stores[name]) {
    const filePath = path.join(DATA_DIR, `${name}.db`);
    stores[name] = new Datastore({
      filename: filePath,
      autoload: true,
      corruptAlertThreshold: 0.1,
    });
  }
  return stores[name];
}

// Convert Mongoose queries to NeDB compatible queries
function sanitizeQuery(query = {}) {
  if (!query || typeof query !== 'object') return {};
  const cleaned = { ...query };

  // Handle _id conversions if string or ObjectId
  if (cleaned._id && typeof cleaned._id === 'object' && cleaned._id.toString) {
    cleaned._id = cleaned._id.toString();
  }

  // Handle $or recursively
  if (Array.isArray(cleaned.$or)) {
    cleaned.$or = cleaned.$or.map(sanitizeQuery);
  }

  // Remove Mongoose-specific $expr if present
  if (cleaned.$expr) {
    delete cleaned.$expr;
  }

  return cleaned;
}

// Query Builder for Chaining: .populate(), .sort(), .skip(), .limit(), .select()
class QueryBuilder {
  constructor(store, query = {}, isSingle = false) {
    this.store = store;
    this.query = sanitizeQuery(query);
    this.isSingle = isSingle;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._populateFields = [];
    this._selectFields = null;
  }

  sort(s) {
    this._sort = s;
    return this;
  }

  skip(n) {
    this._skip = parseInt(n) || 0;
    return this;
  }

  limit(n) {
    this._limit = parseInt(n) || null;
    return this;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  populate(field, select) {
    this._populateFields.push({ field, select });
    return this;
  }

  async exec() {
    let results;
    if (this.isSingle) {
      const doc = await this.store.findOneAsync(this.query);
      results = doc ? [doc] : [];
    } else {
      let cursor = this.store.find(this.query);
      if (this._sort) cursor = cursor.sort(this._sort);
      if (this._skip) cursor = cursor.skip(this._skip);
      if (this._limit) cursor = cursor.limit(this._limit);
      results = await cursor.execAsync();
    }

    // Populate relations if requested
    for (const pop of this._populateFields) {
      results = await populateField(results, pop.field, pop.select);
    }

    // Handle User model instances (attach matchPassword)
    results = results.map(doc => wrapDocument(doc, this.store));

    return this.isSingle ? (results[0] || null) : results;
  }

  // Support direct await queryBuilder
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

// Helper to wrap raw docs with helper methods like .save()
function wrapDocument(doc, store) {
  if (!doc || typeof doc !== 'object') return doc;

  if (!doc.save) {
    Object.defineProperty(doc, 'save', {
      enumerable: false,
      writable: true,
      value: async function () {
        if (this.password && this._isNewPassword) {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
          delete this._isNewPassword;
        }
        this.updatedAt = new Date();
        await store.updateAsync({ _id: this._id }, this, {});
        return this;
      }
    });
  }

  if (doc.password && !doc.matchPassword) {
    Object.defineProperty(doc, 'matchPassword', {
      enumerable: false,
      writable: true,
      value: async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      }
    });
  }

  return doc;
}

// Simple dynamic population based on collection name convention
async function populateField(docs, fieldPath, selectFields) {
  if (!docs || docs.length === 0) return docs;

  // Map known fields to store names
  const fieldToStoreMap = {
    customer: 'customers',
    product: 'products',
    category: 'categories',
    subCategory: 'categories',
    cashier: 'users',
    supplier: 'suppliers',
    tenant: 'tenants'
  };

  const targetStoreName = fieldToStoreMap[fieldPath];
  if (!targetStoreName) return docs;

  const targetStore = getStore(targetStoreName);

  for (const doc of docs) {
    // Nested items.product population
    if (fieldPath === 'items.product' && Array.isArray(doc.items)) {
      for (const item of doc.items) {
        if (item.product) {
          const prodId = typeof item.product === 'object' ? item.product._id : item.product;
          item.product = await targetStore.findOneAsync({ _id: prodId });
        }
      }
      continue;
    }

    const refId = doc[fieldPath];
    if (refId) {
      const id = typeof refId === 'object' ? refId._id : refId;
      const refDoc = await targetStore.findOneAsync({ _id: id });
      if (refDoc) {
        if (selectFields) {
          const allowed = selectFields.split(' ');
          const filtered = {};
          allowed.forEach(k => { if (k && refDoc[k] !== undefined) filtered[k] = refDoc[k]; });
          filtered._id = refDoc._id;
          doc[fieldPath] = filtered;
        } else {
          doc[fieldPath] = refDoc;
        }
      }
    }
  }

  return docs;
}

// Model Adapter Factory (Drop-in replacement for Mongoose models)
function createModel(collectionName) {
  const store = getStore(collectionName);

  class Model {
    constructor(data = {}) {
      Object.assign(this, data);
      this._isNew = true;
      if (this.password) this._isNewPassword = true;
      wrapDocument(this, store);
    }

    async save() {
      if (this.password && this._isNewPassword) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        delete this._isNewPassword;
      }
      this.createdAt = this.createdAt || new Date();
      this.updatedAt = new Date();
      
      const inserted = await store.insertAsync(this);
      Object.assign(this, inserted);
      wrapDocument(this, store);
      return this;
    }

    static find(query = {}) {
      return new QueryBuilder(store, query, false);
    }

    static findOne(query = {}) {
      return new QueryBuilder(store, query, true);
    }

    static findById(id) {
      const strId = id && id.toString ? id.toString() : id;
      return new QueryBuilder(store, { _id: strId }, true);
    }

    static async countDocuments(query = {}) {
      return await store.countAsync(sanitizeQuery(query));
    }

    static async create(data) {
      if (Array.isArray(data)) {
        return Promise.all(data.map(d => this.create(d)));
      }
      const instance = new Model(data);
      return await instance.save();
    }

    static async findByIdAndUpdate(id, update = {}, options = {}) {
      const strId = id && id.toString ? id.toString() : id;
      const existing = await store.findOneAsync({ _id: strId });
      if (!existing) return null;

      let updateData = update;
      if (update.$set) updateData = { ...update.$set };

      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }

      updateData.updatedAt = new Date();
      await store.updateAsync({ _id: strId }, { $set: updateData }, {});
      const updated = await store.findOneAsync({ _id: strId });
      return wrapDocument(updated, store);
    }

    static async findByIdAndDelete(id) {
      const strId = id && id.toString ? id.toString() : id;
      const existing = await store.findOneAsync({ _id: strId });
      if (!existing) return null;
      await store.removeAsync({ _id: strId }, {});
      return wrapDocument(existing, store);
    }

    static async deleteMany(query = {}) {
      return await store.removeAsync(sanitizeQuery(query), { multi: true });
    }

    static async insertMany(items = []) {
      if (!Array.isArray(items) || items.length === 0) return [];
      const inserted = await store.insertAsync(items);
      const arr = Array.isArray(inserted) ? inserted : [inserted];
      return arr.map(doc => wrapDocument(doc, store));
    }

    // Basic aggregation helper fallback for reports & dashboard
    static async aggregate(pipeline = []) {
      let results = await store.findAsync({});

      for (const stage of pipeline) {
        if (stage.$match) {
          const matchQuery = sanitizeQuery(stage.$match);
          results = results.filter(doc => {
            for (const key of Object.keys(matchQuery)) {
              if (key === 'createdAt' && typeof matchQuery[key] === 'object') {
                const docDate = new Date(doc.createdAt);
                if (matchQuery[key].$gte && docDate < new Date(matchQuery[key].$gte)) return false;
                if (matchQuery[key].$lte && docDate > new Date(matchQuery[key].$lte)) return false;
              } else if (matchQuery[key] !== undefined && doc[key] !== matchQuery[key]) {
                return false;
              }
            }
            return true;
          });
        }
        if (stage.$unwind) {
          const field = stage.$unwind.replace('$', '');
          const unwound = [];
          for (const doc of results) {
            if (Array.isArray(doc[field])) {
              doc[field].forEach(item => {
                unwound.push({ ...doc, [field]: item });
              });
            }
          }
          results = unwound;
        }
      }

      return results;
    }
  }

  return Model;
}

module.exports = {
  getStore,
  createModel,
  createNeDBModel: createModel,
  DATA_DIR,
};
