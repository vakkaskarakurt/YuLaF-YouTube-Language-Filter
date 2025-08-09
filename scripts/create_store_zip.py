import zipfile
import json
from pathlib import Path
import fnmatch
from datetime import datetime

# ---- AYARLAR ----
ROOT_DIR = Path.cwd()  # Paketlenecek kök dizin

# Hariç tutulacak dosya/dizin desenleri
EXCLUDE_PATTERNS = [
    '*.py', '*.pyc', '*.pyo', '__pycache__/*',
    '.git/*', '.vscode/*', 'node_modules/*',
    '*.md', 'LICENSE', '*.log', '*.zip', ".gitignore",
    '*YuLaF_big.png', '*icon512.png', '*YuLaF*'
]
# -----------------

def get_zip_name():
    manifest_path = ROOT_DIR / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError("manifest.json bulunamadı!")

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    name = manifest.get("name", "extension").split("-")[0]  # Sadece ilk kısmı al
    version = manifest.get("version", "0.0.0")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{name}-v{version}-store-{timestamp}.zip"

def should_exclude(file_path: Path) -> bool:
    rel_path = str(file_path.relative_to(ROOT_DIR)).replace("\\", "/")
    for pattern in EXCLUDE_PATTERNS:
        if pattern.endswith("/*"):
            if rel_path.startswith(pattern[:-2]):
                return True
        elif fnmatch.fnmatch(rel_path, pattern):
            return True
    return False

def create_zip():
    zip_name = get_zip_name()
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for path in ROOT_DIR.rglob('*'):
            if path.is_file() and not should_exclude(path):
                rel_path = path.relative_to(ROOT_DIR)
                zipf.write(path, rel_path)
                print(f"✅ Eklendi: {rel_path}")
            else:
                if path.is_file():
                    print(f"⏩ Hariç tutuldu: {path.relative_to(ROOT_DIR)}")
    print(f"\n🎉 Zip oluşturuldu: {zip_name}")

if __name__ == "__main__":
    create_zip()
