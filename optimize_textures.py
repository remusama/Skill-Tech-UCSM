import os
from PIL import Image

def optimize_image(filepath, output_filepath, target_size=2048, is_webp=True):
    try:
        with Image.open(filepath) as img:
            # Resize image maintaining aspect ratio
            img.thumbnail((target_size, target_size), Image.Resampling.LANCZOS)
            
            # Save as webp
            if is_webp:
                img.save(output_filepath, 'WEBP', quality=65)
            else:
                img.save(output_filepath)
                
        print(f"Optimized: {filepath} -> {output_filepath}")
        return True
    except Exception as e:
        print(f"Error optimizing {filepath}: {e}")
        return False

def main():
    base_dir = "public/models"
    
    # 1. Eleonor and Lumine texture_00.png
    for model in ["Eleonor", "Lumine"]:
        texture_dir = os.path.join(base_dir, model, "Lumine.4096")
        png_path = os.path.join(texture_dir, "texture_00.png")
        webp_path = os.path.join(texture_dir, "texture_00.webp")
        
        if os.path.exists(png_path):
            if optimize_image(png_path, webp_path, target_size=1024):
                os.remove(png_path)
                print(f"Removed original {png_path}")
        elif os.path.exists(webp_path):
            temp_path = webp_path + ".temp.webp"
            if optimize_image(webp_path, temp_path, target_size=1024):
                os.replace(temp_path, webp_path)
                print(f"Resized {webp_path}")
        else:
            print(f"File not found: {png_path} or {webp_path}")

    # 2. Tubasa webp textures
    tubasa_dir = os.path.join(base_dir, "Tubasa", "TUBASA_014.4096")
    for i in range(3):
        webp_path = os.path.join(tubasa_dir, f"texture_0{i}.webp")
        if os.path.exists(webp_path):
            # We overwrite the same file with resized version
            temp_path = webp_path + ".temp.webp"
            if optimize_image(webp_path, temp_path, target_size=1024):
                os.replace(temp_path, webp_path)
        else:
            print(f"File not found: {webp_path}")

if __name__ == "__main__":
    main()
