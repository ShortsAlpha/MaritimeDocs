from PIL import Image
import os

source_path = r"C:/Users/yadau/.gemini/antigravity/brain/ffd12504-e729-4ad5-9623-346bcf974d37/uploaded_image_1767458232496.png"
dest_path = r"public/logo.png"

try:
    img = Image.open(source_path)
    img = img.convert("RGBA")

    datas = img.getdata()

    newData = []
    for item in datas:
        # Change all white (also shades of whites) to transparent
        # Threshold 200 to be safe and catch anti-aliasing edge
        if item[0] > 200 and item[1] > 200 and item[2] > 200:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    
    # Save optimized
    img.save(dest_path, "PNG")
    print("Saved to", dest_path)
except Exception as e:
    print(f"Error: {e}")
