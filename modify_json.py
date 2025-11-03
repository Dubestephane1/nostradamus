import json

# Path to the JSON file
file_path = 'js/data/century1.json'

# Load the JSON data
with open(file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Add the image field to each quatrain
for key in data:
    data[key]['image'] = 'Michel_de_Nostredame.jpg'

# Write the updated data back to the file
with open(file_path, 'w', encoding='utf-8') as file:
    json.dump(data, file, indent=4, ensure_ascii=False)