from PIL import Image

def convert_to_transparent_and_invert(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    # Just to check if it's solid background
    for item in data:
        # If it's very close to white, make transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        # If it's very close to black, make transparent (in case it generated a black background)
        elif item[0] < 15 and item[1] < 15 and item[2] < 15:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    img.save(output_path, "PNG")

convert_to_transparent_and_invert("public/safe-logo-concept-1.png", "public/safe-logo-concept-1-transparent.png")
