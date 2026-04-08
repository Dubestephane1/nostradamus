import json
import re
import os
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

os.environ['TESSDATA_PREFIX'] = r'C:\Program Files\Tesseract-OCR\tessdata'
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(image_path):
    img = Image.open(image_path).convert('L')
    img = ImageEnhance.Contrast(img).enhance(4.0)
    img = ImageEnhance.Sharpness(img).enhance(2.5)
    img = img.filter(ImageFilter.MedianFilter(3))
    return img

def extract_text(image_path):
    print("🔄 Processing image with Tesseract...")
    img = preprocess_image(image_path)
    config = r'--oem 3 --psm 6 -l fra+eng'
    return pytesseract.image_to_string(img, config=config)

def clean_line(line: str) -> str:
    line = re.sub(r'\s+', ' ', line).strip()
    
    replacements = {
        "repoufez": "repouffez",
        "repouflez": "repouffez",
        "minut": "minuit",
        "meﬂé": "meslé",
        "Ifles": "Isles",
        "4 fang": "à fang",
        "4 propos": "à propos",
        "Curren": "CHIREN",
        "adutte": "adufte",
        "futte": "fuste",
        "extrefme": "extreme",
        "detreffe": "detresse",
        "prifonnier": "prisonnier",
        "efchappe": "eschappe",
        "preffe": "presse",
        "L’vrne": "L'urne",
        "Vexees": "Vexees",
        "Lafaillant": "L'assaillant",
        "aiant": "ayant",
        "n’efchappe": "n'eschappe",
        "n'eschappe": "n'eschappe",
        "fon Phaéton": "son Phaëton",
        "l'eloquence": "l'eloquence",
        "delivrance": "delivrance",
        "délirance": "delivrance",
        "fur la minuit": "sur la minuit",
        "font mis": "sont mis",
        "rempars caffez": "rempars cassez",
        "traditeurs fuys": "traditeurs fuys",
        "fang Gaulois": "sang Gaulois",
        "crefpe": "crespe",
        "CHIREN": "CHIREN",
        "lungin": "longin",
        "baniere": "bannière",
        "lefé": "lesé",
        "fe trame": "se trame",
        "prefque": "presque",
        "adufte": "aduste",
        "encor": "encore",
        "fuste": "fuste",
        "Apres": "Après",
        "detresse": "détresse",
        "Phaéton": "Phaëton"
    }
    
    for wrong, correct in replacements.items():
        line = line.replace(wrong, correct)
    
    # Final punctuation cleanup
    line = line.rstrip('.,; ')
    if not line.endswith(('.', ':', '?', '!')):
        line += ','
    if line.count(',') > 2:
        line = line.replace(',', ',', 1)  # keep only first comma if too many
    
    return line

if __name__ == "__main__":
    image_file = r"C:\Docs\GitHubDesk\nostradamus\Corrector\56.jpg"
    json_file = r"C:\Docs\GitHubDesk\nostradamus\Corrector\century2.json"
    output_file = r"C:\Docs\GitHubDesk\nostradamus\Corrector\corrected_century2.json"

    with open(json_file, encoding='utf-8') as f:
        data = json.load(f)

    raw_text = extract_text(image_file)

    all_lines = [line.strip() for line in raw_text.split('\n') if len(line.strip()) > 15]

    expected = ["77", "78", "79", "80", "81", "82"]
    quatrain_map = {}
    idx = 0

    for qnum in expected:
        quatrain_lines = []
        while len(quatrain_lines) < 4 and idx < len(all_lines):
            candidate = clean_line(all_lines[idx])
            if re.match(r'^LXX', candidate) or len(candidate) < 20:
                idx += 1
                continue
            quatrain_lines.append(candidate)
            idx += 1
        quatrain_map[qnum] = quatrain_lines
        print(f"Assigned 4 lines to C2Q{qnum}")

    # Apply corrections
    corrected_data = {}
    for qnum, new_lines in quatrain_map.items():
        if qnum in data:
            entry = data[qnum].copy()
            old_lines = entry.get("french", [])
            
            print(f"\n=== Final Update for C2Q{qnum} ===")
            for i in range(4):
                old = old_lines[i] if i < len(old_lines) else ""
                new = new_lines[i]
                if old != new:
                    print(f"Line {i+1}:")
                    print(f"  Old: {old}")
                    print(f"  New: {new}")
            entry["french"] = new_lines
            corrected_data[qnum] = entry

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(corrected_data if corrected_data else data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Done! Corrected JSON saved to: {output_file}")
