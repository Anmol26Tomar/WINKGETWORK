module.exports = function (api) {
  api.cache(true);

  // 👇 This checks the EAS/Expo build environment
  const envFile = process.env.APP_ENV === 'production' ? '.env.production' : '.env';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: envFile, // dynamically load correct file
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
