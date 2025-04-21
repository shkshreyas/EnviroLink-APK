const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting app optimization for ultra-minimal build...');

// Files to remove (relative to project root)
const filesToRemove = [
  'assets/images/deforestation-high.jpg',
  'assets/images/deforestation-medium.jpg',
  'assets/images/deforestation-low.jpg',
  'assets/images/deforestation-default.jpg',
  // Images in the images directory (they're duplicates used only in README)
  'images/Energy tracker.jpg',
  'images/dashboard.jpg',
  'images/environmental resources.jpg',
  'images/drone decon .jpg',
  'images/ai assistant.jpg',
  'images/settings.jpg',
  // Additional files to remove
  'README.md',
  'LICENSE',
  '.eslintrc.js',
  '.prettierrc',
  '.prettierignore',
  '.gitignore',
  '.expo-shared/assets.json',
  'client_secret_409842630330-a27smcum1t2jujbbhpmi7rqnrevj5pml.apps.googleusercontent.com.json'
];

// Remove unnecessary files
filesToRemove.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removed: ${file}`);
  } else {
    console.log(`⚠️ File not found: ${file}`);
  }
});

// Remove unused directories
const dirsToRemove = [
  'images', // README images not needed for app functionality
  '.expo-shared',
  '.github',
  'assets/fonts', // If using downloadable fonts via Expo Google Fonts
  'docs'
];

dirsToRemove.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${dir}`);
    } catch (error) {
      console.error(`❌ Error removing directory ${dir}:`, error);
    }
  } else {
    console.log(`⚠️ Directory not found: ${dir}`);
  }
});

// Clean package.json by removing unused dependencies
function cleanPackageJson() {
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    const pkg = require(pkgPath);
    
    // List of dependencies to remove (unused packages)
    const depsToRemove = [
      'expo-barcode-scanner',
      'react-native-qrcode-svg',
      'react-native-webview',
      'react-native-web',
      'react-dom'
    ];
    
    // Filter out dependencies
    depsToRemove.forEach(dep => {
      if (pkg.dependencies && pkg.dependencies[dep]) {
        delete pkg.dependencies[dep];
        console.log(`✅ Removed dependency: ${dep}`);
      }
    });
    
    // Write updated package.json
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('✅ Cleaned package.json');
  } catch (error) {
    console.error('❌ Error cleaning package.json:', error);
  }
}

// Ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dirPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error creating directory ${dirPath}:`, error);
      return false;
    }
  }
  return true;
}

// Keep only necessary images
function filterImages() {
  try {
    const imagesDir = path.join(__dirname, 'assets/images');
    if (!fs.existsSync(imagesDir)) return;
    
    const essentialImages = ['icon.png']; // List of images to keep
    const imageFiles = fs.readdirSync(imagesDir);
    
    for (const file of imageFiles) {
      if (!essentialImages.includes(file)) {
        const filePath = path.join(imagesDir, file);
        fs.unlinkSync(filePath);
        console.log(`✅ Removed non-essential image: ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Error filtering images:', error);
  }
}

// Main async function to handle image optimization
async function optimizeImages() {
  try {
    console.log('🖼️ Optimizing images for ultra-minimal build...');
    const imagesDir = path.join(__dirname, 'assets/images');
    
    // Filter unnecessary images first
    filterImages();
    
    // Check if images directory exists
    if (!ensureDirectoryExists(imagesDir)) {
      console.log('❌ Could not access or create images directory, skipping image optimization');
      return;
    }
    
    // Check if directory is readable
    try {
      const imageFiles = fs.readdirSync(imagesDir).filter(file => 
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
      );
      
      // Install sharp if needed for image optimization
      console.log('Installing image optimization dependencies...');
      try {
        execSync('npm install sharp --no-save');
      } catch (installError) {
        console.error('❌ Error installing sharp:', installError);
        console.log('⚠️ Skipping image optimization');
        cleanPackageJson();
        return;
      }
      
      // For each image in the directory
      for (const file of imageFiles) {
        try {
          const filePath = path.join(imagesDir, file);
          const tempPath = path.join(imagesDir, `temp_${file}`);
          
          console.log(`Optimizing: ${file}`);
          
          // Use sharp to compress the image
          const sharp = require('sharp');
          const image = sharp(filePath);
          
          // Get image info
          const metadata = await image.metadata();
          
          // Optimize based on image type
          if (file.endsWith('.png')) {
            await image
              .resize({ width: Math.min(metadata.width, 256) }) // More aggressive resizing
              .png({ quality: 60, compressionLevel: 9, palette: true }) // Even lower quality
              .toFile(tempPath);
          } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            await image
              .resize({ width: Math.min(metadata.width, 256) }) // More aggressive resizing
              .jpeg({ quality: 60, progressive: true }) // Even lower quality
              .toFile(tempPath);
          }
          
          // Replace original with optimized version
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(filePath);
            fs.renameSync(tempPath, filePath);
            console.log(`✅ Optimized: ${file}`);
          } else {
            console.log(`⚠️ Failed to optimize: ${file}`);
          }
        } catch (imageError) {
          console.error(`❌ Error optimizing image ${file}:`, imageError);
        }
      }
    } catch (readError) {
      console.error('❌ Error reading images directory:', readError);
    }
    
    // Run cleanup functions
    cleanPackageJson();
    
    // Clean node_modules with duplicate packages
    try {
      console.log('🧹 Cleaning node_modules duplicates...');
      execSync('npx expo-optimize');
      console.log('✅ Node modules optimized');
      
      // Additional optimization
      console.log('🗜️ Further optimizing with Metro bundler cache clear...');
      execSync('npx react-native-clean-project');
      console.log('✅ Metro cache cleaned');
    } catch (error) {
      console.error('❌ Error in additional optimization steps:', error);
    }

    console.log('🎉 Ultra-minimal optimization complete!');
    console.log('To build the ultra-minimal app, run: npm run build:minisized');
  } catch (error) {
    console.error('❌ Error in optimization process:', error);
  }
}

// Run the optimization
optimizeImages(); 