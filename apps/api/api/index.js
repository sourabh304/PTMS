// Vercel function: vercel.json rewrites every request here with its original URL. The Nest app
// is compiled to dist/ by `npm run vercel-build`, which runs before Vercel packages this file.
module.exports = require('../dist/serverless').default;
