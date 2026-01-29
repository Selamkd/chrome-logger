const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development";

  return {
    /**
     * Multiple entry points are essential.
     * Each runs in a different context with different capabilities:
     * - background: Service worker (no DOM access, central message hub)
     * - content: Injected into web pages (DOM access, limited Chrome APIs)
     * - popup: Extension UI (full Chrome API access, own DOM)
     */
    entry: {
      background: "./src/background/index.ts",
      content: "./src/content/index.ts",
      injected: "./src/content/inject.js",
      popup: "./src/view/index.tsx",
    },

  output: {
  path: path.resolve(__dirname, "dist"),
  filename: (pathData) => {
    if (pathData.chunk.name === 'injected') {
      return 'content/inject.js'  
    }
  
    return '[name]/index.js'
  },
  clean: true,
},

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
        },
      ],
    },

    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    plugins: [
      /**
       * Extracts CSS into separate files.
       * Chrome extensions load CSS via manifest, not inline styles.
       */
      new MiniCssExtractPlugin({
        filename: "[name]/styles.css",
      }),

      /**
       * Generates the popup HTML with the React bundle injected.
       */
      new HtmlWebpackPlugin({
        template: "./src/view/index.html",
        filename: "view/index.html",
        chunks: ["popup"],
      }),

      /**
       * Copies static files that don't need processing.
       * The manifest and icons must be in dist root for Chrome to find them.
       */
      new CopyPlugin({
        patterns: [
          { from: "src/manifest.json", to: "manifest.json" },
          { from: "src/assets", to: "assets", noErrorOnMissing: true },
        ],
      }),
    ],

    /**
     * Source maps help with debugging but have quirks in extensions.
     * 'cheap-module-source-map' works in content scripts and popup.
     * Note: Background service workers have limited source map support.
     */
    devtool: isDevelopment ? "cheap-module-source-map" : false,

    /**
     * Disables performance hints - extension bundles have different
     * constraints than typical web apps.
     */
    performance: {
      hints: false,
    },

    /**
     * Optimisation is disabled to keep output readable during development
     * and because Chrome extensions don't benefit much from code splitting.
     */
    optimization: {
      minimize: !isDevelopment,
      splitChunks: false,
    },
  };
};
