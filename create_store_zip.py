import zipfile
import os
import json
from datetime import datetime

def create_extension_zip():
    # Gerekli dosya ve klasörler
    required_files = [
        'manifest.json',
        'background.js',
        'popup.html',
        'popup.js', 
        'popup.css',
        'styles.css'
    ]
    
    required_folders = [
        'icons',
        'src'
    ]
    
    # Engellenecek dosya/klasörler
    excluded = {
        '.git', '.gitignore', 'PRIVACY.md', 'README.md', 
        'package.json', 'node_modules', '.vscode', 
        '__pycache__', '.DS_Store', 'create_store_zip.py'
    }
    
    # Manifest'ten version al
    try:
        with open('manifest.json', 'r', encoding='utf-8') as f:
            manifest = json.load(f)
            version = manifest.get('version', '1.0.0')
            name = manifest.get('name', 'Extension')
    except FileNotFoundError:
        print("❌ manifest.json bulunamadı!")
        return
    
    # ZIP dosya adı
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    zip_filename = f"YuLaF-v{version}-{timestamp}.zip"
    
    print(f"📦 {zip_filename} oluşturuluyor...")
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Gerekli dosyaları ekle
        for file in required_files:
            if os.path.exists(file):
                zipf.write(file, file)
                print(f"✅ {file}")
            else:
                print(f"⚠️  {file} bulunamadı")
        
        # Gerekli klasörleri ekle
        for folder in required_folders:
            if os.path.exists(folder):
                for root, dirs, files in os.walk(folder):
                    # Engellenmiş klasörleri atla
                    dirs[:] = [d for d in dirs if d not in excluded]
                    
                    for file in files:
                        if file not in excluded:
                            file_path = os.path.join(root, file)
                            arc_path = file_path.replace('\\', '/')
                            zipf.write(file_path, arc_path)
                            print(f"✅ {arc_path}")
            else:
                print(f"⚠️  {folder}/ klasörü bulunamadı")
    
    print(f"\n🎉 {zip_filename} başarıyla oluşturuldu!")
    print(f"📋 Version: {version}")
    print(f"📁 Boyut: {os.path.getsize(zip_filename) / 1024:.1f} KB")

if __name__ == "__main__":
    create_extension_zip()