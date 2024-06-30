# Abstract Wallpaper Generator

This project generates 1920x1080 abstract wallpapers using Node.js and the canvas library. You can customize the dimensions and output path using command-line options.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository or create a new directory:

   ```sh
   mkdir abstract-wallpaper-generator
   cd abstract-wallpaper-generator
   ```

2. Initialize a new Node.js project:

   ```sh
   npm init -y
   ```

3. Install the necessary dependencies:

   ```sh
   npm install canvas@latest commander@latest
   ```

## Project Structure

```text
abstract-wallpaper-generator
├── index.js
├── src
│   ├── generateWallpaper.js
│   ├── shapes.js
│   └── utils.js
├── output
└── README.md
```

## Usage

### Default Settings

Generate a wallpaper with default settings (1920x1080 resolution):

```sh
node index.js
```

### Custom Settings

You can customize the dimensions and output path using command-line options:

- `-w, --width <number>`: Width of the wallpaper (default: 1920)
- `-h, --height <number>`: Height of the wallpaper (default: 1080)
- `-o, --output <path>`: Output file path (default: `./output/wallpaper_<timestamp>.png`)

#### Examples

Generate a wallpaper with custom dimensions (2560x1440):

```sh
node index.js --width 2560 --height 1440
```

Generate a wallpaper with a custom output file path:

```sh
node index.js --output ./output/custom_wallpaper.png
```

Generate a wallpaper with custom dimensions and output file path:

```sh
node index.js --width 2560 --height 1440 --output ./output/custom_wallpaper.png
```
