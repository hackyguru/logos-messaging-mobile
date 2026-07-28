# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

   The `logosdelivery` `.a`/`.so` binaries are too large for git, so they live as
   assets on the [`native-libs-v2`](https://github.com/hackyguru/logos-messaging-mobile/releases/tag/native-libs-v2)
   release. `npm install` fetches and checksum-verifies them into
   `native/logosdelivery/` via `postinstall`; it is a no-op once they are
   present. To refetch by hand:

   ```bash
   ./scripts/fetch-native-libs.sh --force
   ```

2. Build and run

   ```bash
   npm run ios       # or: npm run android
   ```

   This runs `expo prebuild` (regenerating `ios/` and `android/`, both
   gitignored) and compiles the app. **`npx expo start` on its own is not
   enough** — the embedded Logos Delivery node is a hand-written native module,
   so it cannot run in Expo Go. Once a build is installed, `npm start` will
   attach to it for JS-only changes.

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

### Supported targets

The prebuilt native libraries are arm64-only, which constrains where the app
can run:

| Target | Supported | Notes |
| --- | --- | --- |
| iOS Simulator (Apple Silicon) | yes | the `.a` files are built for `IOSSIMULATOR`, arm64, minos 18.0 |
| Physical iPhone | no | no device slice in the vendored `.a`; linking fails |
| Intel Mac | no | would need an x86_64 simulator slice |
| Android arm64 (device or Apple Silicon emulator) | yes | `APP_ABI := arm64-v8a` |
| Android x86_64 emulator | no | no x86_64 build of `liblogosdelivery` |

Rebuilding the libraries for other targets means rebuilding logos-delivery
itself; see `native/logosdelivery/jni` (ndk-build) for the Android JNI bridge.

You will also need the usual native toolchains: Xcode and CocoaPods for iOS,
and the Android SDK plus NDK for Android.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
