module.exports = {
  devServer: {
    proxy: {
      // proxy requests whose paths match the pattern below to express
      '/api': {
        target: 'http://localhost:3000'
      }
    }
  }
}
