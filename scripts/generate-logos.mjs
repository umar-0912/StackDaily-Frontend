import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'assets');

const PURPLE = '#6200EE';
const WHITE = '#FFFFFF';

/**
 * Draw a rounded rectangle path on the canvas context.
 */
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generate a branded icon with purple rounded-rect background and white "SD" text.
 */
function generateBrandedIcon(size, fontSize, cornerRadius, outputName) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Purple rounded rectangle background
  ctx.fillStyle = PURPLE;
  drawRoundedRect(ctx, 0, 0, size, size, cornerRadius);
  ctx.fill();

  // White "SD" text centered
  ctx.fillStyle = WHITE;
  ctx.font = `bold ${fontSize}px "Helvetica Neue", "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Slight vertical offset adjustment (text baseline middle tends to be slightly high)
  ctx.fillText('SD', size / 2, size / 2 + fontSize * 0.03);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(ASSETS_DIR, outputName), buffer);
  console.log(`  ✓ ${outputName} (${size}×${size})`);
}

/**
 * Generate a transparent-background icon with white "SD" text (for adaptive/monochrome/notification icons).
 */
function generateTransparentIcon(size, fontSize, outputName) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background (default)

  // White "SD" text centered within safe zone
  ctx.fillStyle = WHITE;
  ctx.font = `bold ${fontSize}px "Helvetica Neue", "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SD', size / 2, size / 2 + fontSize * 0.03);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(ASSETS_DIR, outputName), buffer);
  console.log(`  ✓ ${outputName} (${size}×${size})`);
}

/**
 * Generate a solid color background (no text).
 */
function generateSolidBackground(size, color, outputName) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(ASSETS_DIR, outputName), buffer);
  console.log(`  ✓ ${outputName} (${size}×${size})`);
}

console.log('Generating StackDaily "SD" logos...\n');

// 1. Main app icon (1024×1024, purple bg, rounded corners)
generateBrandedIcon(1024, 420, 180, 'icon.png');

// 2. Splash screen icon (200×200)
generateBrandedIcon(200, 82, 36, 'splash-icon.png');

// 3. Web favicon (48×48)
generateBrandedIcon(48, 20, 10, 'favicon.png');

// 4. Android adaptive icon foreground (512×512, white SD on transparent)
// Text within inner 66% safe zone: 512 * 0.66 = ~338px diameter
// Font size 200px fits comfortably within this
generateTransparentIcon(512, 200, 'android-icon-foreground.png');

// 5. Android adaptive icon background (512×512, solid purple)
generateSolidBackground(512, PURPLE, 'android-icon-background.png');

// 6. Android monochrome icon (512×512, white SD on transparent for themed icons)
generateTransparentIcon(512, 200, 'android-icon-monochrome.png');

// 7. Notification icon (96×96, white SD on transparent for Android status bar)
generateTransparentIcon(96, 38, 'notification-icon.png');

// 8. Play Store Feature Graphic (1024×500)
// Purple gradient background with "SD" logo on left, app name + tagline on right
(function generateFeatureGraphic() {
  const W = 1024, H = 500;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Purple gradient background
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, '#5000D4');
  gradient.addColorStop(1, '#7C3AED');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Subtle decorative circles (top-right, bottom-left)
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(W - 80, -40, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(80, H + 40, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // "SD" logo box on the left side
  const logoSize = 160;
  const logoX = 180;
  const logoY = (H - logoSize) / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 32);
  ctx.fill();

  ctx.fillStyle = WHITE;
  ctx.font = `bold 72px "Helvetica Neue", "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SD', logoX + logoSize / 2, logoY + logoSize / 2 + 3);

  // App name
  ctx.fillStyle = WHITE;
  ctx.font = `bold 64px "Helvetica Neue", "Arial", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('StackDaily', 410, H / 2 - 30);

  // Tagline
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `400 26px "Helvetica Neue", "Arial", sans-serif`;
  ctx.fillText('Learn something new every day', 412, H / 2 + 30);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(ASSETS_DIR, 'feature-graphic.png'), buffer);
  console.log(`  ✓ feature-graphic.png (${W}×${H})`);
})();

console.log('\n✅ All 8 assets generated successfully in assets/');
