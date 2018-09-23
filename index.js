const { getLoader, loaderNameMatches } = require("react-app-rewired");
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const lessExtra = new ExtractTextPlugin('static/css/antd.[contenthash:8].css')

function createRewireLess(lessLoaderOptions = {}) {
  return function (config, env) {
    const lessExtension = /\.less$/;

    const fileLoader = getLoader(
      config.module.rules,
      rule => loaderNameMatches(rule, 'file-loader')
    );
    fileLoader.exclude.push(lessExtension);
    
    // copyed by react-script webpack.config.prod.js
    // just change ExtractTextPlugin config
    let lessRules;
    let cssRules;
    if (env === "production") {
      cssRules = {
        test: lessExtension,
        loader: lessExtra.extract(
          {
            fallback: {
              loader: require.resolve('style-loader'),
              options: {
                hmr: false,
              },
            },
            use: [
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                  minimize: true,
                  sourceMap: process.env.GENERATE_SOURCEMAP !== 'false',
                },
              },
              {
                loader: require.resolve('postcss-loader'),
                options: {
                  ident: 'postcss',
                  plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    autoprefixer({
                      browsers: [
                        '>1%',
                        'last 4 versions',
                        'Firefox ESR',
                        'not ie < 9', // React doesn't support IE8 anyway
                      ],
                      flexbox: 'no-2009',
                    }),
                  ],
                },
              },
            ],
          }
        )
      };
      const lessLoader = cssRules.loader || cssRules.use

      lessRules = {
        test: lessExtension,
        loader: [
          // TODO: originally this part is wrapper in extract-text-webpack-plugin
          //       which we cannot do, so some things like relative publicPath
          //       will not work.
          //       https://github.com/timarney/react-app-rewired/issues/33
          ...lessLoader,
          { loader: "less-loader", options: lessLoaderOptions }
        ]
      };
    } else {
      cssRules = getLoader(
        config.module.rules,
        rule => String(rule.test) === String(/\.css$/)
      );
      lessRules = {
        test: lessExtension,
        use: [
          ...cssRules.use,
          { loader: "less-loader", options: lessLoaderOptions }
        ]
      };
    }

    const oneOfRule = config.module.rules.find((rule) => rule.oneOf !== undefined);
    if (oneOfRule) {
      oneOfRule.oneOf.unshift(lessRules);
    }
    else {
      // Fallback to previous behaviour of adding to the end of the rules list.
      config.module.rules.push(lessRules);
    }

    // push self plugins to get new css
    config.plugins.push(lessExtra);

    return config;
  };
}

const rewireLess = createRewireLess();

rewireLess.withLoaderOptions = createRewireLess;

module.exports = rewireLess;
