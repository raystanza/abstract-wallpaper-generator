# Abstract Wallpaper Generator

Generate high-quality 1920x1080 abstract wallpapers using Node.js and the canvas library. The project includes several customizable generators for creating various abstract effects. You can also modify dimensions and output path using command-line options.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository or create a new directory:

   ```sh
   git clone https://github.com/raystanza/abstract-wallpaper-generator.git
   cd abstract-wallpaper-generator
   ```

2. Initialize the project and install dependencies:

   ```sh
   npm install
   ```

   - This installs necessary libraries, including `canvas` for rendering and `commander` for command-line option parsing.

## Project Structure

```text
abstract-wallpaper-generator
├── index.js                  # Main entry point
├── nodemon.json              # Configuration for nodemon (optional)
├── package.json              # Project metadata and scripts
├── public                    # Public assets for web preview
│   ├── index.html            # Web interface for previewing wallpapers
│   ├── script.js             # JavaScript for web functionality
│   └── style.css             # Basic styling for web interface
├── README.md                 # Project documentation
└── src                       # Core wallpaper generator code
    ├── generateWallpaper.js  # Main generation logic
    ├── generators            # Individual abstract generators
    │   ├── barnsley-fern.js
    │   ├── bokeh.js
    │   ├── bubbles.js
    │   ├── fire.js
    │   ├── fractal-tree.js
    │   ├── ice.js
    │   ├── julia-set.js
    │   ├── koch-snowflake.js
    │   ├── mandelbrot-set.js
    │   ├── shapes.js
    │   ├── sierpinski-triangle.js
    │   ├── snow.js
    │   ├── water.js
    │   └── waves.js
    └── utils.js              # Utility functions for color and randomization
```

## Usage

### Command-Line Interface

#### Default Settings

To generate a wallpaper with default settings (1920x1080 resolution):

```sh
node index.js
```

#### Custom Settings

Customize the dimensions and output path using command-line options:

- `-w, --width <number>`: Width of the wallpaper (default: 1920)
- `-h, --height <number>`: Height of the wallpaper (default: 1080)
- `-o, --output <path>`: Output file path (default: `./output/wallpaper_<timestamp>.png`)

##### Examples

Generate a wallpaper with custom dimensions (2560x1440):

```sh
node index.js --width 2560 --height 1440
```

Generate a wallpaper with a specific output file path:

```sh
node index.js --output ./output/custom_wallpaper.png
```

Combine custom dimensions and output path:

```sh
node index.js --width 2560 --height 1440 --output ./output/custom_wallpaper.png
```

### Available Generators

The following abstract generators are included in the project. You can modify the generator called in `generateWallpaper.js` to try different designs:

- **barnsley-fern.js** - Generates a fern-like fractal
- **bokeh.js** - Creates bokeh light effects
- **bubbles.js** - Produces a bubbly, water-like effect
- **fire.js** - Simulates a fire texture
- **fractal-tree.js** - Draws a fractal tree pattern
- **ice.js** - Generates an icy texture
- **julia-set.js** - Produces a Julia set fractal
- **koch-snowflake.js** - Creates a Koch snowflake fractal
- **mandelbrot-set.js** - Renders the Mandelbrot set
- **sierpinski-triangle.js** - Generates a Sierpinski triangle fractal
- **snow.js** - Creates a snowfall effect
- **water.js** - Simulates water ripples
- **waves.js** - Draws wave patterns

Each generator is implemented in `src/generators`, and you can experiment with them by importing and calling different functions within `generateWallpaper.js`.

## Web Interface

The project includes a web interface as the primary way to interact with the wallpaper generator. This interface allows you to preview and customize wallpaper effects in real-time.

### Running the Web Interface

To start the web server, use the following command:

```sh
npm run dev
```

This command uses `nodemon` to automatically restart the server on file changes, making it easier to test and view updates instantly. Once the server is running, open `public/index.html` in your browser to access the interface.

### Customization

The web interface can be easily customized:

- **Styling**: Modify `public/style.css` to change the layout, colors, and appearance of the interface.
- **Functionality**: Add new features or update existing ones in `public/script.js`. This file controls how wallpaper parameters are sent to the generator and displayed.

The web interface allows you to switch between different abstract effects, adjust parameters such as color, resolution, and output, and view previews before saving the wallpaper.
