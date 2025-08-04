import zipfile
import os
import json
from datetime import datetime
import re

def create_extension_zip():
    """YuLaF Extension'ı manifest.json'dan otomatik olarak paketler"""
    
    # Script'in çalıştırılacağı dizin (extension root)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    
    # Working directory'yi root'a değiştir
    original_dir = os.getcwd()
    os.chdir(root_dir)
    
    try:
        # Manifest'i yükle
        try:
            with open('manifest.json', 'r', encoding='utf-8') as f:
                manifest = json.load(f)
                version = manifest.get('version', '1.0.4')
                name = manifest.get('name', 'YuLaF Extension').split(' - ')[0]
        except FileNotFoundError:
            print("❌ manifest.json bulunamadı!")
            return False
        except json.JSONDecodeError:
            print("❌ manifest.json geçersiz JSON formatında!")
            return False
        
        # Manifest'ten gerekli dosyaları çıkar
        required_files = extract_required_files_from_manifest(manifest)
        
        # Dependencies'leri bul (HTML dosyalarındaki CSS, JS linkler vs.)
        all_required_files = find_all_dependencies(required_files)
        
        # ZIP dosya adı
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"{name}-v{version}-store-{timestamp}.zip"
        
        print(f"📦 Chrome Store Package oluşturuluyor...")
        print(f"🏷️  Extension: {name} v{version}")
        print(f"📄 Dosya: {zip_filename}")
        print(f"📂 Root dizin: {root_dir}")
        print(f"🔍 Manifest'ten {len(required_files)} dosya, dependencies ile {len(all_required_files)} dosya tespit edildi")
        print("-" * 50)
        
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
            files_added = 0
            total_size = 0
            
            # Önce manifest.json'ı ekle
            manifest_size = os.path.getsize('manifest.json')
            zipf.write('manifest.json', 'manifest.json')
            files_added += 1
            total_size += manifest_size
            print(f"   ✅ manifest.json ({manifest_size/1024:.1f} KB)")
            
            # Gerekli dosyaları ekle
            for file_path in sorted(all_required_files):
                if os.path.exists(file_path):
                    try:
                        file_size = os.path.getsize(file_path)
                        zipf.write(file_path, file_path.replace('\\', '/'))
                        files_added += 1
                        total_size += file_size
                        print(f"   ✅ {file_path} ({file_size/1024:.1f} KB)")
                    except Exception as e:
                        print(f"   ❌ {file_path} eklenemedi: {e}")
                else:
                    print(f"   ⚠️  {file_path} bulunamadı")
        
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
        
        # Chrome Web Store limiti kontrolü
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
    finally:
        os.chdir(original_dir)

def extract_required_files_from_manifest(manifest):
    """Manifest.json'dan gerekli tüm dosyaları çıkarır"""
    
    required_files = set()
    
    print("🔍 Manifest analiz ediliyor...")
    
    # 1. Icons
    if 'icons' in manifest:
        for size, icon_path in manifest['icons'].items():
            required_files.add(icon_path)
            print(f"   📱 Icon {size}px: {icon_path}")
    
    # 2. Action icons (popup için)
    if 'action' in manifest and 'default_icon' in manifest['action']:
        for size, icon_path in manifest['action']['default_icon'].items():
            required_files.add(icon_path)
            print(f"   🔘 Action icon {size}px: {icon_path}")
    
    # 3. Background service worker
    if 'background' in manifest and 'service_worker' in manifest['background']:
        bg_file = manifest['background']['service_worker']
        required_files.add(bg_file)
        print(f"   ⚙️  Background: {bg_file}")
    
    # 4. Action popup
    if 'action' in manifest and 'default_popup' in manifest['action']:
        popup_file = manifest['action']['default_popup']
        required_files.add(popup_file)
        print(f"   🪟 Popup: {popup_file}")
    
    # 5. Content scripts
    if 'content_scripts' in manifest:
        for i, content_script in enumerate(manifest['content_scripts']):
            print(f"   📜 Content Script {i+1}:")
            
            # JS files
            if 'js' in content_script:
                for js_file in content_script['js']:
                    required_files.add(js_file)
                    print(f"      🟨 JS: {js_file}")
            
            # CSS files
            if 'css' in content_script:
                for css_file in content_script['css']:
                    required_files.add(css_file)
                    print(f"      🎨 CSS: {css_file}")
    
    # 6. Web accessible resources
    if 'web_accessible_resources' in manifest:
        for resource_group in manifest['web_accessible_resources']:
            if 'resources' in resource_group:
                for resource in resource_group['resources']:
                    # Wildcard patterns'i handle et
                    if '*' in resource:
                        # src/assets/team/* gibi pattern'ları çöz
                        wildcard_files = find_wildcard_files(resource)
                        required_files.update(wildcard_files)
                        print(f"   🌐 Web Resource (wildcard): {resource} -> {len(wildcard_files)} dosya")
                    else:
                        required_files.add(resource)
                        print(f"   🌐 Web Resource: {resource}")
    
    return required_files

def find_wildcard_files(pattern):
    """Wildcard pattern'ları gerçek dosyalara çevirir"""
    
    wildcard_files = set()
    
    if pattern.endswith('/*'):
        # src/assets/team/* -> src/assets/team/ klasöründeki tüm dosyalar
        directory = pattern[:-2]  # /* kısmını çıkar
        
        if os.path.exists(directory):
            for root, dirs, files in os.walk(directory):
                for file in files:
                    file_path = os.path.join(root, file).replace('\\', '/')
                    wildcard_files.add(file_path)
    
    elif '*' in pattern:
        # Diğer wildcard pattern'ları (gerekirse extend edilebilir)
        directory = os.path.dirname(pattern)
        filename_pattern = os.path.basename(pattern)
        
        if os.path.exists(directory):
            for file in os.listdir(directory):
                if matches_pattern(file, filename_pattern):
                    file_path = os.path.join(directory, file).replace('\\', '/')
                    wildcard_files.add(file_path)
    
    return wildcard_files

def matches_pattern(filename, pattern):
    """Basit wildcard pattern matching"""
    
    if pattern == '*':
        return True
    
    if pattern.startswith('*') and pattern.endswith('*'):
        return pattern[1:-1] in filename
    
    if pattern.startswith('*'):
        return filename.endswith(pattern[1:])
    
    if pattern.endswith('*'):
        return filename.startswith(pattern[:-1])
    
    return filename == pattern

def find_all_dependencies(required_files):
    """HTML dosyalarındaki CSS, JS ve image linklerini bulur"""
    
    all_files = set(required_files)
    
    print("\n🔗 Dependencies analiz ediliyor...")
    
    for file_path in list(required_files):
        if file_path.endswith('.html'):
            dependencies = extract_html_dependencies(file_path)
            new_deps = dependencies - all_files
            
            if new_deps:
                print(f"   📄 {file_path}: {len(new_deps)} dependency")
                for dep in sorted(new_deps):
                    print(f"      🔗 {dep}")
                
                all_files.update(dependencies)
    
    return all_files

def extract_html_dependencies(html_file):
    """HTML dosyasından CSS, JS ve image dependencies'lerini çıkarır"""
    
    dependencies = set()
    
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # CSS files (link rel="stylesheet")
        css_matches = re.findall(r'<link[^>]+href=["\']([^"\']+\.css)["\']', content, re.IGNORECASE)
        dependencies.update(css_matches)
        
        # JS files (script src)
        js_matches = re.findall(r'<script[^>]+src=["\']([^"\']+\.js)["\']', content, re.IGNORECASE)
        dependencies.update(js_matches)
        
        # Images (img src, icon href)
        img_matches = re.findall(r'(?:src|href)=["\']([^"\']+\.(?:png|jpg|jpeg|gif|svg|ico))["\']', content, re.IGNORECASE)
        dependencies.update(img_matches)
        
        # Relative path'leri düzelt
        html_dir = os.path.dirname(html_file)
        normalized_deps = set()
        
        for dep in dependencies:
            if dep.startswith('../'):
                # Relative path'i normalize et
                normalized_dep = os.path.normpath(os.path.join(html_dir, dep)).replace('\\', '/')
                normalized_deps.add(normalized_dep)
            elif not dep.startswith('http'):
                # Local file
                if not dep.startswith('/'):
                    normalized_dep = os.path.join(html_dir, dep).replace('\\', '/')
                    normalized_deps.add(normalized_dep)
                else:
                    normalized_deps.add(dep.lstrip('/'))
        
        return normalized_deps
        
    except Exception as e:
        print(f"   ⚠️  {html_file} okunamadı: {e}")
        return set()

def validate_manifest():
    """Manifest.json'ı validate eder"""
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    
    original_dir = os.getcwd()
    os.chdir(root_dir)
    
    try:
        print("🔍 Manifest.json doğrulanıyor...")
        
        if not os.path.exists('manifest.json'):
            print("❌ manifest.json bulunamadı!")
            return False
        
        with open('manifest.json', 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        issues = []
        
        # Temel alanları kontrol et
        if manifest.get('manifest_version') != 3:
            issues.append("❌ Manifest version 3 olmalı")
        
        if not manifest.get('name'):
            issues.append("❌ Name alanı eksik")
        
        if not manifest.get('version'):
            issues.append("❌ Version alanı eksik")
        
        # Gerekli dosyaları kontrol et
        required_files = extract_required_files_from_manifest(manifest)
        all_files = find_all_dependencies(required_files)
        
        missing_files = []
        for file_path in all_files:
            if not os.path.exists(file_path):
                missing_files.append(file_path)
        
        if missing_files:
            print(f"\n⚠️  Eksik dosyalar ({len(missing_files)}):")
            for file_path in sorted(missing_files):
                print(f"   ❌ {file_path}")
        
        if issues:
            print(f"\n🚨 Manifest sorunları:")
            for issue in issues:
                print(f"   {issue}")
            return False
        
        if missing_files:
            print(f"\n⚠️  Bazı dosyalar eksik, ancak manifest geçerli")
            return True
        
        print(f"✅ Manifest geçerli! {len(all_files)} dosya tespit edildi")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Manifest JSON hatası: {e}")
        return False
    except Exception as e:
        print(f"❌ Validation hatası: {e}")  
        return False
    finally:
        os.chdir(original_dir)

if __name__ == "__main__":
    print("🎯 YuLaF Extension Store Package Creator")
    print("📋 Manifest-driven packaging")
    print("=" * 50)
    
    # Önce manifest'i validate et
    if validate_manifest():
        print()
        success = create_extension_zip()
        if success:
            print("\n🎉 Package hazır! Chrome Web Store'a yükleyebilirsiniz.")
        else:
            print("\n❌ Package oluşturulamadı.")
    else:
        print("\n❌ Manifest validation başarısız.")