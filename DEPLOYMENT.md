# Wistoria Production Deployment

## Required Secrets

Backend on Render:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=https://your-vercel-domain.vercel.app
NODE_ENV=production
```

Optional backend overrides:

```env
JWT_ACCESS_SECRET=optional_access_secret
JWT_REFRESH_SECRET=optional_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Frontend on Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com/api/v1
```

## Render Backend

1. Create a Render Web Service from `https://github.com/abhisek-977788/Wistoria-blog.git`.
2. Set the root directory to `backend`.
3. Use `npm install && npm run build` as the build command.
4. Use `npm start` as the start command.
5. Add the backend environment variables above.
6. Deploy and copy the Render service URL.

The repository also includes `backend/render.yaml` for Render Blueprint setup.

## Vercel Frontend

1. Import `https://github.com/abhisek-977788/Wistoria-blog.git` into Vercel.
2. Set the project root directory to `frontend`.
3. Use the Next.js framework preset.
4. Add `NEXT_PUBLIC_API_URL` with the deployed Render API URL ending in `/api/v1`.
5. Deploy and copy the Vercel URL.
6. Update Render `CLIENT_URL` to the Vercel URL and redeploy the backend.

## Post-Deploy Test Checklist

- Register a new account.
- Log in and verify the dashboard loads.
- Create a category if using an admin account.
- Create a draft post with a cover image.
- Publish the post and open it from `/blog`.
- Edit the post and replace the cover image.
- Delete the post and confirm the old Cloudinary cover image is removed.
- Add, like, and delete a comment.
- Verify CORS allows the Vercel domain and blocks unknown origins.
