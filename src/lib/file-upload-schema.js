export function FileUploadSchema ({ Schema, ExtendSchema = {} }) {
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
