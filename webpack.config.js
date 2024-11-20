module.exports = {
  module: {
      rules: [
          {
              test: /\.glsl$/,
              use: 'glslify-loader'
          }
      ]
  }
};
