const { program } = require('commander');
const generateWallpaper = require('./src/generateWallpaper');

program
    .option('-w, --width <number>', 'Width of the wallpaper', '1920')
    .option('-h, --height <number>', 'Height of the wallpaper', '1080')
    .option('-o, --output <path>', 'Output file path', `./output/wallpaper_${Date.now()}.png`);

program.parse(process.argv);

const options = program.opts();
const width = parseInt(options.width, 10);
const height = parseInt(options.height, 10);
const outputFile = options.output;

generateWallpaper(width, height, outputFile);
