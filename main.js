document.addEventListener('DOMContentLoaded', () => {
    generateUUID('pack-uuid');
    generateUUID('module-uuid');
    const fileInput = document.getElementById('skin-image');
    const fileNameLabel = document.getElementById('fileName');
    fileInput.addEventListener('change', handleFileSelect);

    //ファイル名を更新
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        const fileNames = Array.from(files).map(file => file.name).join(', ');
        fileNameLabel.textContent = fileNames || 'スキン画像を選択';
    });
});

function generateUUID(elementId) {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    document.getElementById(elementId).value = uuid;
}

function handleFileSelect(event) {
    const files = event.target.files;
    const container = document.getElementById('skinPreview');
    container.innerHTML = '';

    Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const skinInfo = document.createElement('div');
            skinInfo.classList.add('skin-settings');

            skinInfo.innerHTML = `
                <img src="${e.target.result}" alt="Skin Preview" class="skin-preview" style="width:64px; height:64px; margin-right:10px;">
                <input type="text" placeholder="スキン名を入力" data-index="${index}" class="skin-name">
                <div>
                    <label for="arm-type-${index}">腕のタイプ:</label>
                    <select id="arm-type-${index}" data-index="${index}" class="arm-type">
                        <option value="default">デフォルト</option>
                        <option value="slim">スリム</option>
                    </select>
                </div>
                <div>
                    <label for="animation-${index}">アニメーションを追加:</label>
                    <select id="animation-${index}" data-index="${index}" class="animation-type">
                        <option value="false" selected>いいえ</option>
                        <option value="true">はい</option>
                    </select>
                </div>
                <label>
                    <input type="checkbox" id="hide-armor-${index}" data-index="${index}" class="hide-armor"> 防具を非表示
                </label>
            `;
            container.appendChild(skinInfo);
        };
        reader.readAsDataURL(file);
    });
}

function createSkinPack() {
    const packName = document.getElementById('pack-name').value.trim();
    const packUUID = document.getElementById('pack-uuid').value.trim();
    const moduleUUID = document.getElementById('module-uuid').value.trim();
    const skinNames = document.querySelectorAll('.skin-name');
    const armTypes = document.querySelectorAll('.arm-type');
    const animationTypes = document.querySelectorAll('.animation-type');
    const hideArmorCheckboxes = document.querySelectorAll('.hide-armor');

    const skins = Array.from(skinNames).map((skinNameInput, index) => {
        return {
            name: skinNameInput.value.trim(),
            armType: armTypes[index].value,
            animationType: animationTypes[index].value === 'true',
            hideArmor: hideArmorCheckboxes[index].checked
        };
    });
    if (packName === '' || skins.some(skin => skin.name === '')) {
        alert('スキンパックの名前とスキンの名前を入力してください');
        return;
    }

    const manifest = {
        format_version: 1,
        header: {
            name: packName,
            uuid: packUUID,
            version: [1, 0, 0],
        },
        modules: [
            {
                type: "skin_pack",
                uuid: moduleUUID,
                version: [1, 0, 0],
            }
        ]
    };

    const skinsJson = {
        localization_name: packName,
        serialize_name: packName.replace(/\s+/g, '_').toLowerCase(),
        geometry: "skinpacks/skins.json",
        skins: skins.map((skin, index) => ({
            localization_name: skin.name,
            geometry: `geometry.${skin.armType}`,
            texture: `skin_${index}.png`,
            type: "free", 
            animations: skin.animationType ? {
                "move.arms": "animation.player.move.arms.zombie"
            } : undefined,
            hide_armor: skin.hideArmor
        }))
    };

    //en_US.langを生成
    const enUsLangContent = skins.map(skin => `skin.${packName}.${skin.name}=${skin.name}`).join('\n') +
        `\nskinpack.${packName}=${packName}`;

    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("skins.json", JSON.stringify(skinsJson, null, 2));
    zip.folder("texts").file("en_US.lang", enUsLangContent);

    //画像を追加
    const files = document.getElementById('skin-image').files;
    Array.from(files).forEach((file, index) => {
        zip.file(`skin_${index}.png`, file);
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `${packName}.mcpack`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

document.addEventListener('contextmenu', function(event) {
    // もしターゲットがテキストボックスでない場合、右クリックを無効にする
    if (event.target.tagName !== 'INPUT' || event.target.type !== 'text') {
        event.preventDefault();
    }
});

// 画像のドラッグを無効にする
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('dragstart', event => event.preventDefault());
});