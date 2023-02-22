const forms = require('@tailwindcss/forms')

module.exports = {
  content: [
    '!./node_modules/**',
    './**/*.html',
    './src/*.ts',
    './src/*.js',
    './*.svg',
  ],
  plugins: [forms],
}
