/*!
 * pleasure-api-plugin-upload v1.0.0
 * (c) 2019-2019 Martin Rafael <tin@devtin.io>
 * MIT
 */
import { getMongoConnection } from 'pleasure-api';
import { getConfig, findRoot } from 'pleasure-utils';
import sha1 from 'sha1';
import koaBody from 'koa-body';
import pick from 'lodash/pick';
import { mkdirpSync, remove, move } from 'fs-extra';
import path from 'path';

function FileUploadSchema ({ Schema, ExtendSchema = {} }) {
  return new Schema(Object.assign(ExtendSchema, {
    category: {
      type: String,
      index: true,
      required: true,
      options: {
        hidden: true
      }
    },
    hash: {
      type: String,
      index: true,
      required: true
    },
    destinationFilename: {
      type: String,
      index: true,
      required: true,
      maxlength: 64
    },
    filename: {
      type: String,
      index: true,
      required: true,
      maxlength: 240
    },
    originalUploadedFile: {
      type: Schema.Types.Mixed,
      index: true,
      required: true
    },
    remoteIp: {
      type: String,
      index: true,
      maxlength: 40,
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    },
    date: {
      type: Date,
      index: true,
      default: Date.now
    }
  }))
}

function generateFileName () {
  return sha1(Date.now() + '-' + Math.random().toString())
}

/*
const { getModels } = require('../utils/get-models')
const { models } = getModels()
const qs = require('querystring')
const { appLogger } = require('../utils/log')
*/

const categories = [];
let instanceConfig = {};
let fromStoragePath;

/**
 * @typedef {Object}
 */

/**
 * @function categories.categoryExists
 * @param {String} categoryName
 * @return {boolean|{}} The found category or false
 */
categories.categoryExists = function (categoryName) {
  let exists = false;
  for (let i = 0; i < this.length; i++) {
    if (categoryName === this[i].category) {
      exists = this[i];
      break
    }
  }
  return exists
};

/**
 * @method PleasureApiPluginUpload#setFileUpload
 * @param {String} category
 * @param {String|Function} destination - Where to store the file. It can be a function receiving an `uploadRequest`
 * object as the only argument.
 * @param {String} fieldName=file - The name of the field name that uploads the file
 * @param {Function} onUpload - Function that validates whether the upload can go through or not
 * @param {Function} onRead - Function that validates whether a request can read the file
 * @param {String[]} [allowedExtensions] - List of extensions to allow. Example: ['.jpg', '.jpeg', '.png']
 * @param {Number} [maxSize=10240] - Maximum filesize in bytes. 0 for no limit.
 */
function setFileUpload ({ category, destination, fieldName = 'file', onUpload, onRead, allowedExtensions, maxSize }) {
  if (instanceConfig.koaBody.formidable.maxFileSize < maxSize) {
    console.error(`Omitting file-upload ${ category }. maxSize configuration set to ${ maxSize }bytes is bigger than global config ${ instanceConfig.koaBody.formidable.maxFileSize }bytes. Increase api > upload > formidable > maxFileSize if needed`);
    return
  }

  if (!category || !destination) {
    return
  }

  mkdirpSync(fromStoragePath(destination));

  if (categories.categoryExists(category)) {
    throw new Error(`Category ${ category } already exists.`)
  }

  const uploadSettings = {
    category,
    destination,
    fieldName,
    onUpload,
    onRead,
    allowedExtensions,
    maxSize
  };

  categories.push(uploadSettings);
}

/**
 * @class PleasureApiPluginUpload
 * @classdesc A user could define the permissions of the entity file-uploads by defining the model. It should work out of the box
 * too, though.
 */

const PleasureApiPluginUpload = {
  name: 'upload',
  /**
   * @typedef {Object} PleasureApiPluginUpload.config
   * @property {String} entity - Entity name where to store file upload information.
   * @property {Function} filename - Entity name where to store file upload information.
   * @property {String} uploadURI=/upload - URI from where to expect file uploads.
   * @property {Array} [setup] - Optional array with configurations to initialize via {@link PleasureApiPluginUpload#setFileUpload}
   * @property {Object} koaBody - Config options for koa-body. {@see https://www.npmjs.com/package/koa-body}
   */
  config: {
    entity: 'file-uploads',
    filename () {
      return generateFileName()
    },
    koaBody: { multipart: true, multiples: false, formidable: { maxFileSize: 50 * 1024 * 1024, hash: 'sha1' } },
    uploadURI: '/upload', // entity & uploadURI must be different
    storagePath: 'storage/', // relative to project or absolute
    setup: [] // optional array to initialize via setFileUpload
  },
  methods: {
    setFileUpload
  },
  /**
   * @callback PleasureApiPluginUpload#prepare
   * @param router - koa router instance
   * @param {Object} config - Plugin configuration
   * @param Schema - Mongoose Schema class
   */
  prepare ({ router, config, mongoose: { Schema } }) {
    const { debug } = getConfig();
    instanceConfig = config;
    const storagePath = findRoot(config.storagePath);
    fromStoragePath = (...paths) => {
      return path.join(storagePath, ...paths)
    };

    mkdirpSync(storagePath);

    const koaUpload = koaBody(config.koaBody);

    if (config.setup) {
      config.setup.forEach(setup => {
        setFileUpload(setup);
      });
    }

    // create a new instance of mongoose, separated from the api logic
    let mongoose;
    let UploadModel;

    getMongoConnection()
      .then(m => {
        mongoose = m;

        // register the fileUpload schema
        UploadModel = mongoose.model(config.entity, FileUploadSchema({ Schema }));
        debug && console.log(`pleasure-api-plugin-upload initialized`);
      });

    const postUri = `${ config.uploadURI }/:category`;

    router.post(postUri, koaUpload, async (ctx, next) => {
      const { $pleasure: { user }, ip, params: { category } } = ctx;

      const theCategory = categories.categoryExists(category);

      if (!theCategory) {
        return next() // none of our business
      }

      let { request: { files: { [theCategory.fieldName]: file } } } = ctx;

      if (!file) {
        return next()
      }

      const fromCategoryStorage = (...paths) => {
        return fromStoragePath(theCategory.destination, ...paths)
      };

      const clean = () => {
        // todo: delete file
        return remove(file.path)
      };

      const cleanAndLeave = async () => {
        await clean();
        return next()
      };

      const { sessionId } = user || {};

      // todo: check file extension
      // console.log({ config })

      /**
       * @typedef {Object} UploadRequest
       * @property {Object} file - Incoming file {@see }
       */
      const UploadRequest = {
        file,
        category,
        ip,
        user,
        sessionId,
        ctx
      };

      // extensions restriction
      if (theCategory.allowedExtensions) {
        const extension = (file.name.indexOf('.') >= 0 ? file.name.match(/\..+$/)[0] : '').toLowerCase();

        if (theCategory.allowedExtensions.indexOf(extension) < 0) {
          return cleanAndLeave()
        }
      }

      // file size restriction
      if (theCategory.maxSize && file.size > theCategory.maxSize) {
        console.log({ size: file.size, allowed: theCategory.maxSize });
        return cleanAndLeave()
      }

      let destinationFilename = fromCategoryStorage(file.hash);

      if (theCategory.onUpload) {
        destinationFilename = await theCategory.onUpload(UploadRequest);

        if (!destinationFilename) {
          return cleanAndLeave()
        }
        destinationFilename = fromCategoryStorage(destinationFilename);
      }

      const FileUpload = {
        category: theCategory.category,
        filename: file.name,
        originalUploadedFile: pick(file, ['domain', 'size', 'path', 'name', 'type', 'lastModifiedDate']),
        destinationFilename: path.relative(findRoot(), destinationFilename),
        remoteIp: ip,
        hash: file.hash
      };

      const uploadFile = new UploadModel(FileUpload);

      try {
        await uploadFile.save();
      } catch (err) {
        await clean();
        throw err
      }

      // todo: move file from location
      await move(file.path, destinationFilename, { overwrite: true });

      ctx.body = { data: uploadFile.toObject() };
    });
  }
};

export { FileUploadSchema, PleasureApiPluginUpload };
