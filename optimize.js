const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting app optimization...');

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
  'images/settings.jpg'
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
  '.expo-shared'
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
      'expo-camera',
      'react-native-qrcode-svg',
      'react-native-webview'
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

// Main async function to handle image optimization
async function optimizeImages() {
  try {
    console.log('🖼️ Optimizing images...');
    const imagesDir = path.join(__dirname, 'assets/images');
    
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
              .resize({ width: Math.min(metadata.width, 512) }) // Reduced from 1024 to 512
              .png({ quality: 70, compressionLevel: 9 }) // Reduced quality from 80 to 70
              .toFile(tempPath);
          } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            await image
              .resize({ width: Math.min(metadata.width, 512) }) // Reduced from 1024 to 512
              .jpeg({ quality: 70 }) // Reduced quality from 80 to 70
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
    } catch (error) {
      console.error('❌ Error optimizing node_modules:', error);
    }

    console.log('🎉 Optimization complete!');
    console.log('To build the optimized app, run: npm run build:minisized');
  } catch (error) {
    console.error('❌ Error in optimization process:', error);
  }
}

// Run the optimization
optimizeImages(); 