// Extends app.json. EXPO_BASE_URL is set by the GitHub Pages workflow so the
// web build is served from /income-tracker; native builds leave it unset.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
