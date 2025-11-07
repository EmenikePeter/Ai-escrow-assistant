# AI Escrow Assistant 👋

This is an [Expo](https://expo.dev) project for an AI-powered escrow assistant application with a backend server and admin portal.

## Project Structure

- **Root**: React Native mobile app (Expo)
- **server/**: Node.js backend server with Express and Socket.IO
- **Escrow assistant admin portal/admin-portal/**: React admin dashboard

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment variables

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your API base URL and other configuration values.

3. Start the backend server

   ```bash
   cd server
   node server.js
   ```

4. Start the mobile app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Deployment

For production deployment instructions (Vercel frontend + AWS EC2 backend), see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deployment Setup

1. **Frontend (Vercel)**:
   - Set `API_BASE_URL` environment variable to your backend URL
   - Set `EXPO_PUBLIC_API_BASE_URL` for web builds
   
2. **Backend (AWS EC2)**:
   - Configure `.env` file with production values
   - Set `FRONTEND_URL` to your Vercel domain
   - Ensure ports 80, 443, and 4000 are open

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
