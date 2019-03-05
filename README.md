Thumbnail resize for NA Websites.

## Getting Started

First download and install [GraphicsMagick](http://www.graphicsmagick.org/) or [ImageMagick](http://www.imagemagick.org/). In Mac OS X, you can simply use [Homebrew](http://mxcl.github.io/homebrew/) and do:

    brew install imagemagick
    brew install graphicsmagick

If you want WebP support with ImageMagick, you must add the WebP option:

    brew install imagemagick --with-webp

then either use npm:

    npm install gm

or clone the repo:

    git clone git://github.com/aheckmann/gm.git


### `npm start`

Runs the app in the development mode.<br>

### `npm electron-dev`

Launches the test electron app.

### `npm run electron-package`

Builds the app for production.<br>
macOS only.
