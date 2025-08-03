import zipfile
import os
import json
from datetime import datetime

def create_extension_zip():
    """YuLaF Extension'ı Chrome Web Store için paketler"""
    
    # Extension için gerekli core dosyalar
    required_files = [
        'manifest.json',
        'background.js',
        'popup.html',
        'popup.js', 
        'popup.css',
        'styles.css'
    ]
    
    # Extension için gerekli klasörler
    required_folders = [
        'icons',           # Extension ikonları
        'src'              # Kaynak kodlar (services, utils, languages)
    ]
    
    # Store package'a dahil edilmeyecek dosya/klasörler
    excluded = {
        # Development dosyaları
        '.git', '.gitignore', 'README.md', 'PRIVACY.md',
        'package.json', 'package-lock.json', 'node_modules',
        
        # IDE/Editor dosyaları  
        '.vscode', '.idea', '*.code-workspace',
        
        # Python dosyaları
        'create_store_zip.py', '__pycache__', '*.py', '*.pyc',
        
        # System dosyaları
        '.DS_Store', 'Thumbs.db', '*.tmp', '*.log',
        
        # Build/Temp dosyaları
        'dist', 'build', '*.zip',
        
        # Büyük asset dosyaları (eğer varsa)
        'YuLaF_big.png', '*.psd', '*.ai', '*.sketch'
    }
    
    # Manifest'ten extension bilgilerini al
    try:
        with open('manifest.json', 'r', encoding='utf-8') as f:
            manifest = json.load(f)
            version = manifest.get('version', '1.0.0')
            name = manifest.get('name', 'YuLaF Extension').split(' - ')[0]  # "YuLaF"
    except FileNotFoundError:
        print("❌ manifest.json bulunamadı!")
        print("   Lütfen extension root klasöründe çalıştırın.")
        return False
    except json.JSONDecodeError:
        print("❌ manifest.json geçersiz JSON formatında!")
        return False
    
    # Unique ZIP dosya adı
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"{name}-v{version}-store-{timestamp}.zip"
    
    print(f"📦 Chrome Store Package oluşturuluyor...")
    print(f"🏷️  Extension: {name} v{version}")
    print(f"📄 Dosya: {zip_filename}")
    print("-" * 50)
    
    try:
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
            files_added = 0
            total_size = 0
            
            # Core dosyaları ekle
            print("📁 Core dosyaları ekleniyor...")
            for file in required_files:
                if os.path.exists(file):
                    file_size = os.path.getsize(file)
                    zipf.write(file, file)
                    files_added += 1
                    total_size += file_size
                    print(f"   ✅ {file} ({file_size/1024:.1f} KB)")
                else:
                    print(f"   ⚠️  {file} bulunamadı")
            
            # Klasörleri ekle
            for folder in required_folders:
                if os.path.exists(folder):
                    print(f"\n📁 {folder}/ klasörü ekleniyor...")
                    folder_files = 0
                    
                    for root, dirs, files in os.walk(folder):
                        # Excluded klasörleri filtrele
                        dirs[:] = [d for d in dirs if d not in excluded and not d.startswith('.')]
                        
                        for file in files:
                            # Dosya filtresi
                            if (file not in excluded and 
                                not file.startswith('.') and 
                                not any(file.endswith(ext) for ext in ['.py', '.pyc', '.tmp', '.log'])):
                                
                                file_path = os.path.join(root, file)
                                arc_path = file_path.replace('\\', '/')
                                file_size = os.path.getsize(file_path)
                                
                                zipf.write(file_path, arc_path)
                                files_added += 1
                                folder_files += 1
                                total_size += file_size
                                print(f"   ✅ {arc_path} ({file_size/1024:.1f} KB)")
                    
                    if folder_files == 0:
                        print(f"   ⚠️  {folder}/ boş veya geçerli dosya yok")
                else:
                    print(f"\n   ⚠️  {folder}/ klasörü bulunamadı")
        
        # Package bilgileri
        package_size = os.path.getsize(zip_filename)
        compression_ratio = (1 - package_size / total_size) * 100 if total_size > 0 else 0
        
        print("\n" + "="*50)
        print(f"🎉 Package başarıyla oluşturuldu!")
        print(f"📦 Dosya: {zip_filename}")
        print(f"📊 İstatistikler:")
        print(f"   • Toplam dosya sayısı: {files_added}")
        print(f"   • Orijinal boyut: {total_size/1024:.1f} KB")
        print(f"   • Package boyutu: {package_size/1024:.1f} KB") 
        print(f"   • Sıkıştırma oranı: {compression_ratio:.1f}%")
        
        # Chrome Web Store limiti kontrolü (10MB = 10,240 KB)
        max_size_kb = 10 * 1024
        if package_size/1024 > max_size_kb:
            print(f"⚠️  Uyarı: Package boyutu Chrome Store limitini ({max_size_kb/1024:.0f}MB) aşıyor!")
        else:
            print(f"✅ Chrome Store boyut limiti OK ({package_size/1024/1024:.1f}MB / 10MB)")
        
        print(f"\n🚀 Chrome Developer Dashboard'a yüklemek için hazır!")
        return True
        
    except Exception as e:
        print(f"\n❌ Package oluşturulurken hata: {e}")
        return False

def validate_extension_structure():
    """Extension dosya yapısını kontrol eder"""
    print("🔍 Extension yapısı kontrol ediliyor...")
    
    issues = []
    
    # Manifest kontrolü
    if not os.path.exists('manifest.json'):
        issues.append("❌ manifest.json eksik")
    else:
        try:
            with open('manifest.json', 'r') as f:
                manifest = json.load(f)
                if manifest.get('manifest_version') != 3:
                    issues.append("⚠️  Manifest v3 değil")
                if not manifest.get('permissions'):
                    issues.append("⚠️  Permissions tanımlı değil")
        except:
            issues.append("❌ manifest.json geçersiz")
    
    # Icon kontrolü
    if not os.path.exists('icons'):
        issues.append("❌ icons/ klasörü eksik")
    else:
        required_icons = ['icon16.png', 'icon48.png', 'icon128.png']
        for icon in required_icons:
            if not os.path.exists(f'icons/{icon}'):
                issues.append(f"⚠️  icons/{icon} eksik")
    
    # Core dosya kontrolü
    core_files = ['background.js', 'popup.html', 'popup.js', 'popup.css']
    for file in core_files:
        if not os.path.exists(file):
            issues.append(f"❌ {file} eksik")
    
    if issues:
        print("🚨 Tespit edilen sorunlar:")
        for issue in issues:
            print(f"   {issue}")
        return False
    else:
        print("✅ Extension yapısı geçerli!")
        return True

if __name__ == "__main__":
    print("🎯 YuLaF Extension Store Package Creator")
    print("=" * 50)
    
    # Önce yapıyı kontrol et
    if validate_extension_structure():
        print()
        create_extension_zip()
    else:
        print("\n❌ Package oluşturulamadı. Lütfen sorunları düzeltin.")