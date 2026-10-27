
import os
import sys

# Try importing PIL
try:
    from PIL import Image
except ImportError:
    print("Pillow not installed. Please run 'pip install Pillow'")
    sys.exit(1)

def process_image(input_path, output_dir):
    try:
        img = Image.open(input_path)
        
        # Convert to RGB if necessary (e.g. if RGBA and saving as JPEG, though we'll use PNG)
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGBA')

        # Crop to square
        width, height = img.size
        new_size = min(width, height)
        
        left = (width - new_size) / 2
        top = (height - new_size) / 2
        right = (width + new_size) / 2
        bottom = (height + new_size) / 2
        
        img_cropped = img.crop((left, top, right, bottom))
        
        # Resize to standard favicon size (e.g. 192x192 is good for modern high dpi)
        # Also creating a 32x32 for legacy if needed, but 192/512 is standard for manifest usually.
        # We'll just stick with a nice high res PNG for the link rel="icon"
        
        img_resized = img_cropped.resize((192, 192), Image.Resampling.LANCZOS)
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        output_path = os.path.join(output_dir, 'favicon.png')
        img_resized.save(output_path, 'PNG')
        print(f"Successfully saved favicon to {output_path}")

        # Also save a smaller one for checking
        img_small = img_cropped.resize((32, 32), Image.Resampling.LANCZOS)
        img_small.save(os.path.join(output_dir, 'favicon-32x32.png'), 'PNG')
        
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    input_image = "/home/kushagra/.gemini/antigravity/brain/844ee375-e82a-47f7-ad78-b420d89b3b66/uploaded_image_1769540997201.png"
    output_directory = "/home/kushagra/Documents/e-com/public"
    process_image(input_image, output_directory)
