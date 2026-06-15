# Models Directory

This directory contains Mongoose schemas and models for the OpsMate MongoDB database.

## Defining Models

- Each file should correspond to a specific database collection.
- Use singular, PascalCase for model file names (e.g., `User.ts`, `Project.ts`).
- Export the Mongoose model from the file.

### Example

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
```

## Best Practices

- Ensure interfaces for the document types are exported for use across the application.
- Use Mongoose validation features within schemas.
- Prevent model overwrite errors in Next.js development mode by checking if the model already exists (`mongoose.models.ModelName || mongoose.model(...)`).
