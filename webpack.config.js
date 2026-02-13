const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    'PipelineStagesHub/PipelineStagesHub': './src/PipelineStagesHub/index.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'var',
    library: 'PipelineStagesHubApp',
    publicPath: ''
  },
  externals: [
    {
      'react': 'React',
      'react-dom': 'ReactDOM'
    }
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/PipelineStagesHub/PipelineStagesHub.html',
      filename: 'PipelineStagesHub/PipelineStagesHub.html',
      chunks: ['PipelineStagesHub/PipelineStagesHub'],
      inject: false
    })
  ],
  devtool: 'source-map'
};
